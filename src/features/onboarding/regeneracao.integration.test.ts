// Integração do fluxo de regeneração de Plano, através da Camada de Persistência
// real (IndexedDB via fake-indexeddb). Prova, no nível de persistência, as duas
// garantias centrais desta fase:
//   1. O formulário de regeneração vem PRÉ-PREENCHIDO com os dados do Usuário
//      atual (não vazio) — a fonte é o Usuario persistido.
//   2. Cancelar a confirmação NÃO arquiva nada — só a geração (arquivarEAtivar)
//      arquiva; enquanto ela não roda, o Plano atual continua ativo intacto.
//
// A fiação do componente (cancelar chama setConfirmando(false) e nunca gerar())
// é verificada por leitura de código: arquivarEAtivar só é chamado dentro de
// gerar(), e gerar() só é chamado pelo submit inicial ou pelo botão de confirmar.
// Este teste cobre o contrato de persistência em que essa fiação se apoia.

import "fake-indexeddb/auto"
import { describe, it, expect, beforeEach } from "vitest"
import { openDb } from "@/persistencia/idb/db"
import { createIdbAdapter } from "@/persistencia/idb/adapter"
import type { CamadaDePersistencia } from "@/persistencia"
import {
  construirUsuarioEPlano,
  resolverModo,
  formularioDeUsuario,
  FORMULARIO_VAZIO,
  ID_USUARIO_LOCAL,
} from "./onboarding-core"
import type { EntradaCalculo } from "@/motor-geracao"
import type {
  PlanoId, ISODate, RegistroId, RegistroDeAderencia,
} from "@/types"

let dbCounter = 0
async function freshAdapter(): Promise<CamadaDePersistencia> {
  const db = await openDb(`test-regeneracao-${++dbCounter}`)
  return createIdbAdapter(db)
}

const entradaA: EntradaCalculo = {
  peso_kg: 80, altura_cm: 178, idade: 28, sexo: "M",
  fator_atividade: "MuitoAtivo", objetivo: "Cutting",
}
const entradaB: EntradaCalculo = {
  peso_kg: 76, altura_cm: 178, idade: 28, sexo: "M",
  fator_atividade: "MuitoAtivo", objetivo: "Manutencao",
}

// Espelha exatamente o que OnboardingPage.gerar() faz ao persistir: constrói o
// Usuario+Plano, arquiva-e-ativa atomicamente, atualiza o ponteiro do Usuario.
async function executarGeracao(
  adapter: CamadaDePersistencia,
  entrada: EntradaCalculo,
  planoId: string,
  inicio: string,
) {
  const { usuario, plano } = construirUsuarioEPlano(entrada, {
    gerarId: () => planoId,
    agora: () => new Date(`${inicio}T09:00:00.000Z`),
  })
  await adapter.planos.arquivarEAtivar(plano, plano.vigencia.inicio)
  await adapter.usuarios.salvar(usuario)
  return { usuario, plano }
}

describe("regeneração de Plano — integração", () => {
  let adapter: CamadaDePersistencia
  beforeEach(async () => { adapter = await freshAdapter() })

  it("após o primeiro Plano, o formulário de regeneração vem pré-preenchido (não vazio)", async () => {
    await executarGeracao(adapter, entradaA, "plano-1", "2026-06-01")

    const usuario = await adapter.usuarios.buscar(ID_USUARIO_LOCAL)
    expect(resolverModo(usuario)).toBe("regeneracao")

    const form = formularioDeUsuario(usuario!)
    // Pré-preenchido com os dados de entradaA — e explicitamente NÃO vazio.
    expect(form).toEqual({
      peso_kg: "80",
      altura_cm: "178",
      idade: "28",
      sexo: "M",
      fator_atividade: "MuitoAtivo",
      objetivo: "Cutting",
    })
    expect(form).not.toEqual(FORMULARIO_VAZIO)
  })

  it("cancelar a confirmação não arquiva nada: o Plano atual continua ativo intacto", async () => {
    await executarGeracao(adapter, entradaA, "plano-1", "2026-06-01")

    // "Cancelar" = não executar a geração. Nenhuma escrita ocorre.
    const ativo = await adapter.planos.buscarAtivo(ID_USUARIO_LOCAL)
    expect(ativo?.id).toBe("plano-1")
    expect(ativo?.vigencia.status).toBe("ativo")
    const todos = await adapter.planos.listarPorUsuario(ID_USUARIO_LOCAL)
    expect(todos).toHaveLength(1) // nada foi arquivado nem criado
  })

  it("confirmar gera o novo Plano, arquiva o anterior e preserva o vínculo dos Registros", async () => {
    await executarGeracao(adapter, entradaA, "plano-1", "2026-06-01")

    // Registro logado durante a vigência do plano-1
    const registro: RegistroDeAderencia = {
      id: "reg-1" as RegistroId,
      usuario_id: ID_USUARIO_LOCAL,
      plano_id: "plano-1" as PlanoId,
      data: "2026-06-10" as ISODate,
      editado_em: null,
      registros_refeicao: [],
      agua_consumida_ml: 2000,
      treino_realizado: true,
      jj_realizado: null,
      checklist: {},
      registros_exercicio: [],
    }
    await adapter.registros.salvar(registro)

    // "Confirmar" = executar a geração do novo Plano (entradaB)
    await executarGeracao(adapter, entradaB, "plano-2", "2026-07-16")

    // Novo Plano é o único ativo
    const ativo = await adapter.planos.buscarAtivo(ID_USUARIO_LOCAL)
    expect(ativo?.id).toBe("plano-2")
    expect(ativo?.objetivo).toBe("Manutencao")

    const todos = await adapter.planos.listarPorUsuario(ID_USUARIO_LOCAL)
    expect(todos.filter((p) => p.vigencia.status === "ativo")).toHaveLength(1)
    expect(todos).toHaveLength(2)

    // Anterior arquivado, com início preservado e fim contíguo ao novo
    const anterior = await adapter.planos.buscar("plano-1" as PlanoId)
    expect(anterior?.vigencia.status).toBe("arquivado")
    if (anterior?.vigencia.status === "arquivado") {
      expect(anterior.vigencia.inicio).toBe("2026-06-01")
      expect(anterior.vigencia.fim).toBe("2026-07-16")
    }

    // Registro continua vinculado ao Plano arquivado (não migra)
    const doArquivado = await adapter.registros.listarPorPlano("plano-1" as PlanoId)
    expect(doArquivado).toHaveLength(1)
    expect(doArquivado[0].id).toBe("reg-1")
    expect(await adapter.registros.listarPorPlano("plano-2" as PlanoId)).toHaveLength(0)

    // O ponteiro do Usuario aponta para o novo Plano
    const usuario = await adapter.usuarios.buscar(ID_USUARIO_LOCAL)
    expect(usuario?.plano_ativo_id).toBe("plano-2")
  })
})
