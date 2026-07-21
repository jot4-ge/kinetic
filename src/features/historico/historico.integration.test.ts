// Integração do Histórico através da Camada de Persistência real (IndexedDB via
// fake-indexeddb). Exemplo trabalhado, executável, das duas garantias da fase:
//   1. A lista de Planos mostra o Ativo + os Arquivados, do mais recente ao mais
//      antigo, com Períodos de Vigência corretos (arquivado tem fim; ativo é
//      "atual").
//   2. Um Registro feito durante a vigência do Plano antigo aparece sob ELE (pelo
//      nome de suas Refeições, resolvido no Plano certo), nunca sob o Plano novo.
//
// Exercita exatamente o caminho de leitura das páginas de Histórico (listar +
// ordenar + formatar + resumir), só sem o React. A geração/arquivamento reusa o
// mesmo fluxo do OnboardingPage (construirUsuarioEPlano + arquivarEAtivar).

import "fake-indexeddb/auto"
import { describe, it, expect, beforeEach } from "vitest"
import { openDb } from "@/persistencia/idb/db"
import { createIdbAdapter } from "@/persistencia/idb/adapter"
import type { CamadaDePersistencia } from "@/persistencia"
import { construirUsuarioEPlano, ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type { EntradaCalculo } from "@/motor-geracao"
import {
  ordenarPlanosRecentesPrimeiro,
  formatarVigencia,
  nomesRefeicoesDoPlano,
  ordenarRegistrosCronologico,
  resumirRegistro,
} from "./historico-core"
import type { Plano, RegistroDeAderencia, RegistroId, ISODate } from "@/types"

let dbCounter = 0
async function freshAdapter(): Promise<CamadaDePersistencia> {
  const db = await openDb(`test-historico-${++dbCounter}`)
  return createIdbAdapter(db)
}

const entradaCutting: EntradaCalculo = {
  peso_kg: 80, altura_cm: 178, idade: 28, sexo: "M",
  fator_atividade: "MuitoAtivo", objetivo: "Cutting",
}
const entradaManutencao: EntradaCalculo = {
  peso_kg: 76, altura_cm: 178, idade: 28, sexo: "M",
  fator_atividade: "MuitoAtivo", objetivo: "Manutencao",
}

// Espelha OnboardingPage.gerar(): constrói Usuario+Plano, arquiva-e-ativa, e
// atualiza o ponteiro. Devolve o Plano gerado para uso no teste.
async function gerar(
  adapter: CamadaDePersistencia,
  entrada: EntradaCalculo,
  planoId: string,
  inicio: string,
): Promise<Plano> {
  const { usuario, plano } = construirUsuarioEPlano(entrada, {
    gerarId: () => planoId,
    agora: () => new Date(`${inicio}T09:00:00.000Z`),
  })
  await adapter.planos.arquivarEAtivar(plano, plano.vigencia.inicio)
  await adapter.usuarios.salvar(usuario)
  return plano
}

// Registra Aderência de um dia, seguindo a primeira Refeição do Plano informado.
async function logarRegistro(
  adapter: CamadaDePersistencia,
  plano: Plano,
  id: string,
  data: string,
): Promise<{ refeicaoId: string; refeicaoNome: string }> {
  const refeicao = plano.perfis_refeicao[0].refeicoes[0]
  const registro: RegistroDeAderencia = {
    id: id as RegistroId,
    usuario_id: ID_USUARIO_LOCAL,
    plano_id: plano.id,
    data: data as ISODate,
    editado_em: null,
    registros_refeicao: [
      { refeicao_id: refeicao.id, status: "Seguiu", opcao_seguida_id: refeicao.opcoes[0].id },
    ],
    agua_consumida_ml: 2000,
    treino_realizado: true,
    jj_realizado: null,
    checklist: {},
    registros_exercicio: [],
  }
  await adapter.registros.salvar(registro)
  return { refeicaoId: refeicao.id, refeicaoNome: refeicao.nome }
}

describe("Histórico — integração (dois Planos reais)", () => {
  let adapter: CamadaDePersistencia
  beforeEach(async () => { adapter = await freshAdapter() })

  it("lista Ativo + Arquivado, recente primeiro, com Vigências corretas", async () => {
    const plano1 = await gerar(adapter, entradaCutting, "plano-1", "2026-06-01")
    await logarRegistro(adapter, plano1, "reg-antigo", "2026-06-10")
    await gerar(adapter, entradaManutencao, "plano-2", "2026-07-16")

    // Caminho exato da HistoricoPage: listarPorUsuario → ordenar.
    const lista = ordenarPlanosRecentesPrimeiro(
      await adapter.planos.listarPorUsuario(ID_USUARIO_LOCAL),
    )

    expect(lista.map((p) => p.id)).toEqual(["plano-2", "plano-1"])

    // Topo: o Ativo (Manutenção), vigência "atual".
    expect(lista[0].objetivo).toBe("Manutencao")
    expect(formatarVigencia(lista[0])).toEqual({ inicio: "16 jul 2026", fim: "atual", ativo: true })

    // Abaixo: o Arquivado (Cutting), vigência 1 jun → 16 jul.
    expect(lista[1].objetivo).toBe("Cutting")
    expect(formatarVigencia(lista[1])).toEqual({ inicio: "1 jun 2026", fim: "16 jul 2026", ativo: false })
  })

  it("um Registro do Plano antigo aparece sob ele, não sob o novo", async () => {
    const plano1 = await gerar(adapter, entradaCutting, "plano-1", "2026-06-01")
    const antigo = await logarRegistro(adapter, plano1, "reg-antigo", "2026-06-10")
    const plano2 = await gerar(adapter, entradaManutencao, "plano-2", "2026-07-16")
    const novo = await logarRegistro(adapter, plano2, "reg-novo", "2026-07-20")

    // Registros sob o Plano arquivado — caminho da PlanoRegistrosPage.
    const doArquivado = ordenarRegistrosCronologico(
      await adapter.registros.listarPorPlano(plano1.id),
    ).map((r) => resumirRegistro(r, nomesRefeicoesDoPlano(plano1)))

    expect(doArquivado).toHaveLength(1)
    expect(doArquivado[0].registroId).toBe("reg-antigo")
    expect(doArquivado[0].data).toBe("10 jun 2026")
    expect(doArquivado[0].refeicoesSeguidas).toEqual([antigo.refeicaoNome])
    expect(doArquivado[0].treinoRealizado).toBe(true)
    expect(doArquivado[0].aguaConsumidaMl).toBe(2000)

    // Registros sob o Plano ativo — só o novo, nunca o antigo.
    const doAtivo = ordenarRegistrosCronologico(
      await adapter.registros.listarPorPlano(plano2.id),
    ).map((r) => resumirRegistro(r, nomesRefeicoesDoPlano(plano2)))

    expect(doAtivo).toHaveLength(1)
    expect(doAtivo[0].registroId).toBe("reg-novo")
    expect(doAtivo[0].refeicoesSeguidas).toEqual([novo.refeicaoNome])
    expect(doAtivo.some((r) => r.registroId === "reg-antigo")).toBe(false)
  })

  it("um Plano recém-criado sem Registros lista vazio (estado vazio da UI)", async () => {
    await gerar(adapter, entradaCutting, "plano-1", "2026-07-16")
    const registros = await adapter.registros.listarPorPlano("plano-1" as Plano["id"])
    expect(registros).toEqual([])
  })
})
