// fake-indexeddb/auto define globalThis.indexedDB e IDBKeyRange antes de qualquer teste.
// Isolamento entre testes: cada openDb recebe um nome único via counter — bancos
// in-memory separados sem necessidade de resetar globals.
import "fake-indexeddb/auto"

import { describe, it, expect, beforeEach } from "vitest"
import { openDb } from "./db"
import { createIdbAdapter } from "./adapter"
import type { CamadaDePersistencia } from "../contratos"
import type {
  UsuarioId, PlanoId, RegistroId,
  ISODate, ISOTimestamp,
  PlanoAtivo, PlanoArquivado, Usuario, RegistroDeAderencia,
} from "@/types"
import { BANCO_EXERCICIOS } from "@/banco-opcoes"
import { gerarPlano } from "@/motor-geracao"
import type { ConteudoDoPlano } from "@/motor-geracao"

// ─── Helpers ──────────────────────────────────────────────────────────────────

let dbCounter = 0
async function freshAdapter(): Promise<CamadaDePersistencia> {
  const db = await openDb(`test-rotina-${++dbCounter}`)
  return createIdbAdapter(db)
}

const uid  = "user-1" as UsuarioId
const uid2 = "user-2" as UsuarioId
const ts   = "2026-06-21T10:00:00.000Z" as ISOTimestamp

function makeUsuario(id: UsuarioId = uid): Usuario {
  return {
    id,
    nome: "Teste",
    email: "teste@example.com",
    peso_kg: 80,
    altura_cm: 178,
    idade: 28,
    sexo: "M",
    fator_atividade: "MuitoAtivo",
    objetivo: "Cutting",
    plano_ativo_id: null,
    criado_em: ts,
  }
}

function makePlanoAtivo(usuarioId: UsuarioId, conteudo: ConteudoDoPlano, id = "plano-1"): PlanoAtivo {
  return {
    id: id as PlanoId,
    usuario_id: usuarioId,
    autor_id: usuarioId,
    criado_em: ts,
    vigencia: { status: "ativo", inicio: "2026-06-01" as ISODate },
    ...conteudo,
  }
}

function makePlanoArquivado(usuarioId: UsuarioId, conteudo: ConteudoDoPlano, id = "plano-2"): PlanoArquivado {
  return {
    id: id as PlanoId,
    usuario_id: usuarioId,
    autor_id: usuarioId,
    criado_em: ts,
    vigencia: { status: "arquivado", inicio: "2026-01-01" as ISODate, fim: "2026-05-31" as ISODate },
    ...conteudo,
  }
}

const biometriaBase = {
  peso_kg: 80, altura_cm: 178, idade: 28, sexo: "M" as const,
  fator_atividade: "MuitoAtivo" as const, objetivo: "Cutting" as const,
}

const conteudo = gerarPlano(biometriaBase)

// ─── openDb e seeding ─────────────────────────────────────────────────────────

describe("openDb e seeding", () => {
  it("popula exercicios com BANCO_EXERCICIOS na primeira execução", async () => {
    const adapter = await freshAdapter()
    const todos = await adapter.exercicios.listarTodos()
    expect(todos.length).toBe(BANCO_EXERCICIOS.length)
  })

  it("não re-semeia se exercicios já existem (idempotência)", async () => {
    const db1 = await openDb(`test-rotina-${++dbCounter}`)
    const adapter1 = createIdbAdapter(db1)
    const antes = await adapter1.exercicios.listarTodos()

    // Fechar e reabrir o mesmo banco (mesmo nome)
    db1.close()
    const db2 = await openDb(db1.name)
    const adapter2 = createIdbAdapter(db2)
    const depois = await adapter2.exercicios.listarTodos()

    expect(depois.length).toBe(antes.length)
  })

  it("cada exercicio retornado tem id, nome e grupos_musculares válidos", async () => {
    const adapter = await freshAdapter()
    const todos = await adapter.exercicios.listarTodos()
    for (const ex of todos) {
      expect(ex.id).toBeTruthy()
      expect(ex.nome).toBeTruthy()
      expect(ex.grupos_musculares.length).toBeGreaterThan(0)
    }
  })
})

// ─── UsuarioRepositorio ───────────────────────────────────────────────────────

describe("UsuarioRepositorio", () => {
  let adapter: CamadaDePersistencia
  beforeEach(async () => { adapter = await freshAdapter() })

  it("salvar + buscar: dados voltam idênticos", async () => {
    const u = makeUsuario()
    await adapter.usuarios.salvar(u)
    const lido = await adapter.usuarios.buscar(uid)
    expect(lido).toEqual(u)
  })

  it("buscar id inexistente retorna null", async () => {
    expect(await adapter.usuarios.buscar("nao-existe" as UsuarioId)).toBeNull()
  })

  it("salvar é upsert: atualiza campo sem criar duplicata", async () => {
    const u = makeUsuario()
    await adapter.usuarios.salvar(u)
    const atualizado = { ...u, nome: "Atualizado" }
    await adapter.usuarios.salvar(atualizado)
    const lido = await adapter.usuarios.buscar(uid)
    expect(lido?.nome).toBe("Atualizado")
  })
})

// ─── PlanoRepositorio — seams críticos ───────────────────────────────────────

describe("PlanoRepositorio", () => {
  let adapter: CamadaDePersistencia
  beforeEach(async () => { adapter = await freshAdapter() })

  // ── Seam crítico 1: buscarAtivo via índice composto ───────────────────────

  it("buscarAtivo encontra PlanoAtivo pelo usuarioId sem scan", async () => {
    const ativo = makePlanoAtivo(uid, conteudo)
    await adapter.planos.salvar(ativo)
    const resultado = await adapter.planos.buscarAtivo(uid)
    expect(resultado).not.toBeNull()
    expect(resultado?.id).toBe(ativo.id)
    expect(resultado?.vigencia.status).toBe("ativo")
  })

  it("buscarAtivo retorna null quando o plano do usuário está arquivado", async () => {
    const arquivado = makePlanoArquivado(uid, conteudo)
    await adapter.planos.salvar(arquivado)
    const resultado = await adapter.planos.buscarAtivo(uid)
    expect(resultado).toBeNull()
  })

  it("buscarAtivo retorna null para usuário sem nenhum plano", async () => {
    expect(await adapter.planos.buscarAtivo(uid)).toBeNull()
  })

  it("buscarAtivo não confunde planos de usuários diferentes", async () => {
    const ativo1 = makePlanoAtivo(uid,  conteudo, "plano-u1")
    const ativo2 = makePlanoAtivo(uid2, conteudo, "plano-u2")
    await adapter.planos.salvar(ativo1)
    await adapter.planos.salvar(ativo2)

    const r1 = await adapter.planos.buscarAtivo(uid)
    const r2 = await adapter.planos.buscarAtivo(uid2)
    expect(r1?.id).toBe("plano-u1")
    expect(r2?.id).toBe("plano-u2")
  })

  it("buscar por id funciona para ativo e arquivado", async () => {
    const ativo     = makePlanoAtivo(uid, conteudo, "pa")
    const arquivado = makePlanoArquivado(uid, conteudo, "pb")
    await adapter.planos.salvar(ativo)
    await adapter.planos.salvar(arquivado)
    expect((await adapter.planos.buscar("pa" as PlanoId))?.id).toBe("pa")
    expect((await adapter.planos.buscar("pb" as PlanoId))?.id).toBe("pb")
  })

  it("buscar id inexistente retorna null", async () => {
    expect(await adapter.planos.buscar("nao-existe" as PlanoId)).toBeNull()
  })

  it("listarPorUsuario retorna planos do mais recente ao mais antigo (por vigencia.inicio)", async () => {
    const antigo  = makePlanoArquivado(uid, conteudo, "pa-antigo")
    const recente = makePlanoAtivo(uid, conteudo, "pa-recente")
    // antigo: inicio 2026-01-01, recente: inicio 2026-06-01
    await adapter.planos.salvar(antigo)
    await adapter.planos.salvar(recente)

    const lista = await adapter.planos.listarPorUsuario(uid)
    expect(lista.length).toBe(2)
    expect(lista[0].id).toBe("pa-recente")
    expect(lista[1].id).toBe("pa-antigo")
  })

  it("listarPorUsuario não inclui planos de outro usuário", async () => {
    await adapter.planos.salvar(makePlanoAtivo(uid,  conteudo, "p-u1"))
    await adapter.planos.salvar(makePlanoAtivo(uid2, conteudo, "p-u2"))
    const lista = await adapter.planos.listarPorUsuario(uid)
    expect(lista.every(p => p.usuario_id === uid)).toBe(true)
  })
})

// ─── RegistroRepositorio — seams críticos ────────────────────────────────────

describe("RegistroRepositorio", () => {
  let adapter: CamadaDePersistencia
  const planoId = "plano-1" as PlanoId

  function makeRegistro(data: ISODate, id: string): RegistroDeAderencia {
    return {
      id: id as RegistroId,
      usuario_id: uid,
      plano_id: planoId,
      data,
      editado_em: null,
      registros_refeicao: [],
      agua_consumida_ml: null,
      treino_realizado: null,
      jj_realizado: null,
      checklist: {},
      registros_exercicio: [],
    }
  }

  beforeEach(async () => { adapter = await freshAdapter() })

  // ── Seam crítico 2: buscarPorData via índice composto ────────────────────

  it("buscarPorData localiza exatamente o registro pelo par [usuarioId, data]", async () => {
    const r = makeRegistro("2026-06-20" as ISODate, "reg-1")
    await adapter.registros.salvar(r)
    const encontrado = await adapter.registros.buscarPorData(uid, "2026-06-20" as ISODate)
    expect(encontrado).not.toBeNull()
    expect(encontrado?.id).toBe("reg-1")
  })

  it("buscarPorData retorna null para data sem registro", async () => {
    const r = makeRegistro("2026-06-20" as ISODate, "reg-1")
    await adapter.registros.salvar(r)
    expect(await adapter.registros.buscarPorData(uid, "2026-06-21" as ISODate)).toBeNull()
  })

  it("buscarPorData não confunde usuários diferentes na mesma data", async () => {
    const r1 = { ...makeRegistro("2026-06-20" as ISODate, "reg-u1"), usuario_id: uid  }
    const r2 = { ...makeRegistro("2026-06-20" as ISODate, "reg-u2"), usuario_id: uid2 }
    await adapter.registros.salvar(r1)
    await adapter.registros.salvar(r2)
    const encontrado = await adapter.registros.buscarPorData(uid, "2026-06-20" as ISODate)
    expect(encontrado?.id).toBe("reg-u1")
  })

  // ── Seam crítico 3: listarPorPeriodo via range no índice composto ─────────

  it("listarPorPeriodo retorna apenas registros dentro do intervalo [de, ate]", async () => {
    await adapter.registros.salvar(makeRegistro("2026-06-01" as ISODate, "r-jun01"))
    await adapter.registros.salvar(makeRegistro("2026-06-10" as ISODate, "r-jun10"))
    await adapter.registros.salvar(makeRegistro("2026-06-20" as ISODate, "r-jun20"))
    await adapter.registros.salvar(makeRegistro("2026-07-01" as ISODate, "r-jul01"))

    const resultado = await adapter.registros.listarPorPeriodo(
      uid,
      "2026-06-01" as ISODate,
      "2026-06-20" as ISODate,
    )
    expect(resultado.length).toBe(3)
    const ids = resultado.map(r => r.id)
    expect(ids).toContain("r-jun01")
    expect(ids).toContain("r-jun10")
    expect(ids).toContain("r-jun20")
    expect(ids).not.toContain("r-jul01")
  })

  it("listarPorPeriodo inclui os limites do intervalo (IDBKeyRange.bound é inclusivo)", async () => {
    await adapter.registros.salvar(makeRegistro("2026-06-01" as ISODate, "limite-inf"))
    await adapter.registros.salvar(makeRegistro("2026-06-30" as ISODate, "limite-sup"))
    const resultado = await adapter.registros.listarPorPeriodo(
      uid,
      "2026-06-01" as ISODate,
      "2026-06-30" as ISODate,
    )
    const ids = resultado.map(r => r.id)
    expect(ids).toContain("limite-inf")
    expect(ids).toContain("limite-sup")
  })

  it("listarPorPeriodo não inclui registros de outro usuário no mesmo período", async () => {
    await adapter.registros.salvar(makeRegistro("2026-06-15" as ISODate, "r-u1"))
    await adapter.registros.salvar({
      ...makeRegistro("2026-06-15" as ISODate, "r-u2"),
      usuario_id: uid2,
    })
    const resultado = await adapter.registros.listarPorPeriodo(
      uid,
      "2026-06-01" as ISODate,
      "2026-06-30" as ISODate,
    )
    expect(resultado.every(r => r.usuario_id === uid)).toBe(true)
  })

  it("listarPorPlano retorna todos os registros vinculados ao plano, ordenados por data", async () => {
    const outroPlanoid = "outro-plano" as PlanoId
    await adapter.registros.salvar(makeRegistro("2026-06-10" as ISODate, "r1"))
    await adapter.registros.salvar(makeRegistro("2026-06-01" as ISODate, "r2"))
    await adapter.registros.salvar({
      ...makeRegistro("2026-06-05" as ISODate, "r-outro"),
      plano_id: outroPlanoid,
    })
    const resultado = await adapter.registros.listarPorPlano(planoId)
    expect(resultado.length).toBe(2)
    expect(resultado.every(r => r.plano_id === planoId)).toBe(true)
    // ordem por data (resultado do índice composto [plano_id, data])
    expect(resultado[0].data).toBe("2026-06-01")
    expect(resultado[1].data).toBe("2026-06-10")
  })

  it("buscar por id faz round-trip completo incluindo campos opcionais", async () => {
    const r: RegistroDeAderencia = {
      ...makeRegistro("2026-06-21" as ISODate, "r-completo"),
      agua_consumida_ml: 3500,
      treino_realizado: true,
      jj_realizado: false,
      checklist: { "beber-agua": true, "dormir": false },
      editado_em: ts,
    }
    await adapter.registros.salvar(r)
    const lido = await adapter.registros.buscar("r-completo" as RegistroId)
    expect(lido).toEqual(r)
  })
})

// ─── Validação (parse) ────────────────────────────────────────────────────────

describe("validação ao ler do IDB", () => {
  it("dado corrompido no store lança ZodError ao ler via buscar", async () => {
    const db = await openDb(`test-rotina-${++dbCounter}`)
    const adapter = createIdbAdapter(db)

    // Injeta dado inválido diretamente no IDB, bypassando o adapter
    await db.put("usuarios", { id: "corrompido", nome: 123, email: "não-é-email" } as never)

    await expect(adapter.usuarios.buscar("corrompido" as UsuarioId)).rejects.toThrow()
  })
})

// ─── Pipeline completo ────────────────────────────────────────────────────────

describe("pipeline completo: Usuário → gerarPlano → persistir → RegistroDeAderência → round-trip", () => {
  it("todos os dados voltam idênticos após salvar e ler", async () => {
    const adapter = await freshAdapter()

    // 1. Criar e salvar Usuário
    const usuario = makeUsuario()
    await adapter.usuarios.salvar(usuario)

    // 2. Gerar Plano via Motor de Geração (Etapas 1+2+3)
    const planoAtivo = makePlanoAtivo(uid, conteudo)
    await adapter.planos.salvar(planoAtivo)

    // 3. Plano Ativo é encontrado pelo usuarioId
    const ativoLido = await adapter.planos.buscarAtivo(uid)
    expect(ativoLido).not.toBeNull()
    expect(ativoLido?.id).toBe(planoAtivo.id)
    expect(ativoLido?.objetivo).toBe("Cutting")
    expect(ativoLido?.perfis_refeicao.length).toBeGreaterThan(0)
    expect(ativoLido?.sessoes_treino.length).toBeGreaterThan(0)

    // 4. Dados nutricionais são preservados fielmente
    expect(ativoLido?.meta_calorica_diaria).toBe(planoAtivo.meta_calorica_diaria)
    expect(ativoLido?.meta_proteina_diaria_g).toBe(planoAtivo.meta_proteina_diaria_g)
    expect(ativoLido?.meta_agua_diaria_ml).toBe(80 * 35) // 35 ml/kg (ADR-0010)

    // 5. Criar Registro de Aderência para hoje
    const hoje = "2026-06-21" as ISODate
    const registro: RegistroDeAderencia = {
      id: "reg-hoje" as RegistroId,
      usuario_id: uid,
      plano_id: planoAtivo.id,
      data: hoje,
      editado_em: null,
      registros_refeicao: [],
      agua_consumida_ml: 3500,
      treino_realizado: true,
      jj_realizado: false,
      checklist: {},
      registros_exercicio: [],
    }
    await adapter.registros.salvar(registro)

    // 6. Registro é encontrado por [usuarioId, data]
    const registroLido = await adapter.registros.buscarPorData(uid, hoje)
    expect(registroLido).toEqual(registro)

    // 7. listarPorPeriodo com janela de 1 dia encontra o registro
    const periodo = await adapter.registros.listarPorPeriodo(uid, hoje, hoje)
    expect(periodo.length).toBe(1)
    expect(periodo[0].id).toBe("reg-hoje")

    // 8. listarPorPlano encontra o registro vinculado ao plano
    const porPlano = await adapter.registros.listarPorPlano(planoAtivo.id)
    expect(porPlano.length).toBe(1)
    expect(porPlano[0].id).toBe("reg-hoje")

    // 9. Usuário ainda está íntegro
    const usuarioLido = await adapter.usuarios.buscar(uid)
    expect(usuarioLido).toEqual(usuario)
  })
})
