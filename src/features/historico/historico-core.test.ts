import { describe, it, expect } from "vitest"
import {
  formatarDataCurta,
  formatarMesAno,
  ordenarPlanosRecentesPrimeiro,
  formatarVigencia,
  numerarEras,
  resumirEras,
  formatarContagemEras,
  nomesRefeicoesDoPlano,
  ordenarRegistrosCronologico,
  resumirRegistro,
} from "./historico-core"
import type {
  Plano, PlanoAtivo, PlanoArquivado, RegistroDeAderencia,
  PlanoId, UsuarioId, RegistroId, ISODate, ISOTimestamp,
} from "@/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USUARIO = "usuario-local" as UsuarioId

function plano(over: {
  id: string
  criado_em: string
  vigencia: Plano["vigencia"]
  refeicoes?: { id: string; nome: string }[]
}): Plano {
  const base = {
    id: over.id as PlanoId,
    usuario_id: USUARIO,
    autor_id: USUARIO,
    objetivo: "Cutting" as const,
    meta_calorica_diaria: 2000,
    meta_proteina_diaria_g: 150,
    meta_carboidrato_diaria_g: 200,
    meta_gordura_diaria_g: 60,
    meta_agua_diaria_ml: 2800,
    perfis_refeicao: [
      {
        dias: ["Segunda" as const],
        refeicoes: (over.refeicoes ?? []).map((r) => ({
          id: r.id,
          nome: r.nome,
          horario: "07:00",
          opcoes: [{ id: `${r.id}-o1`, descricao: "x", macros: { kcal: 1, proteina_g: 1, carboidrato_g: 1, gordura_g: 1 } }],
        })),
      },
    ],
    sessoes_treino: [],
    checklist_template: [],
    criado_em: over.criado_em as ISOTimestamp,
  }
  return { ...base, vigencia: over.vigencia } as Plano
}

const vigenciaAtiva = (inicio: string): PlanoAtivo["vigencia"] => ({
  status: "ativo",
  inicio: inicio as ISODate,
})

const vigenciaArquivada = (inicio: string, fim: string): PlanoArquivado["vigencia"] => ({
  status: "arquivado",
  inicio: inicio as ISODate,
  fim: fim as ISODate,
})

function registro(over: {
  id: string
  data: string
  plano_id: string
  refeicoesSeguidas?: string[]
  refeicoesNaoSeguidas?: string[]
  treino?: boolean | null
  jj?: boolean | null
  agua?: number | null
}): RegistroDeAderencia {
  return {
    id: over.id as RegistroId,
    usuario_id: USUARIO,
    plano_id: over.plano_id as PlanoId,
    data: over.data as ISODate,
    editado_em: null,
    registros_refeicao: [
      ...(over.refeicoesSeguidas ?? []).map((rid) => ({
        refeicao_id: rid,
        status: "Seguiu" as const,
        opcao_seguida_id: `${rid}-o1`,
      })),
      ...(over.refeicoesNaoSeguidas ?? []).map((rid) => ({
        refeicao_id: rid,
        status: "NaoSeguiu" as const,
      })),
    ],
    agua_consumida_ml: over.agua ?? null,
    treino_realizado: over.treino ?? null,
    jj_realizado: over.jj ?? null,
    checklist: {},
    registros_exercicio: [],
  }
}

// ─── formatarDataCurta ────────────────────────────────────────────────────────

describe("formatarDataCurta", () => {
  it("formata YYYY-MM-DD em pt-BR curto, sem zero à esquerda no dia", () => {
    expect(formatarDataCurta("2026-07-12" as ISODate)).toBe("12 jul 2026")
    expect(formatarDataCurta("2026-01-05" as ISODate)).toBe("5 jan 2026")
    expect(formatarDataCurta("2026-12-31" as ISODate)).toBe("31 dez 2026")
  })

  it("não desloca o dia por fuso (não usa new Date)", () => {
    // new Date("2026-03-01") em fuso negativo cairia em 2026-02-28.
    expect(formatarDataCurta("2026-03-01" as ISODate)).toBe("1 mar 2026")
  })
})

// ─── ordenarPlanosRecentesPrimeiro ────────────────────────────────────────────

describe("ordenarPlanosRecentesPrimeiro", () => {
  it("ordena do mais recente ao mais antigo por criado_em", () => {
    const antigo = plano({ id: "p1", criado_em: "2026-05-01T10:00:00.000Z", vigencia: vigenciaArquivada("2026-05-01", "2026-06-01") })
    const meio = plano({ id: "p2", criado_em: "2026-06-01T10:00:00.000Z", vigencia: vigenciaArquivada("2026-06-01", "2026-07-01") })
    const ativo = plano({ id: "p3", criado_em: "2026-07-01T10:00:00.000Z", vigencia: vigenciaAtiva("2026-07-01") })

    const ordenado = ordenarPlanosRecentesPrimeiro([meio, antigo, ativo])
    expect(ordenado.map((p) => p.id)).toEqual(["p3", "p2", "p1"])
  })

  it("põe o Plano Ativo no topo mesmo criado no mesmo dia do anterior", () => {
    const anterior = plano({ id: "p1", criado_em: "2026-07-01T09:00:00.000Z", vigencia: vigenciaArquivada("2026-07-01", "2026-07-01") })
    const ativo = plano({ id: "p2", criado_em: "2026-07-01T09:30:00.000Z", vigencia: vigenciaAtiva("2026-07-01") })
    expect(ordenarPlanosRecentesPrimeiro([anterior, ativo]).map((p) => p.id)).toEqual(["p2", "p1"])
  })

  it("não muta o array de entrada", () => {
    const a = plano({ id: "p1", criado_em: "2026-05-01T10:00:00.000Z", vigencia: vigenciaAtiva("2026-05-01") })
    const b = plano({ id: "p2", criado_em: "2026-06-01T10:00:00.000Z", vigencia: vigenciaAtiva("2026-06-01") })
    const entrada = [a, b]
    ordenarPlanosRecentesPrimeiro(entrada)
    expect(entrada).toEqual([a, b])
  })
})

// ─── formatarVigencia ─────────────────────────────────────────────────────────

describe("formatarVigencia", () => {
  it("Plano Ativo: fim é 'atual' e ativo=true", () => {
    const p = plano({ id: "p1", criado_em: "2026-07-01T10:00:00.000Z", vigencia: vigenciaAtiva("2026-07-01") })
    expect(formatarVigencia(p)).toEqual({ inicio: "1 jul 2026", fim: "atual", ativo: true })
  })

  it("Plano Arquivado: início → fim reais e ativo=false", () => {
    const p = plano({ id: "p1", criado_em: "2026-05-01T10:00:00.000Z", vigencia: vigenciaArquivada("2026-05-01", "2026-07-01") })
    expect(formatarVigencia(p)).toEqual({ inicio: "1 mai 2026", fim: "1 jul 2026", ativo: false })
  })
})

// ─── formatarMesAno ───────────────────────────────────────────────────────────

describe("formatarMesAno", () => {
  it("reduz a data ao mês e ano", () => {
    expect(formatarMesAno("2026-07-12" as ISODate)).toBe("jul 2026")
    expect(formatarMesAno("2026-01-31" as ISODate)).toBe("jan 2026")
  })
})

// ─── numerarEras ──────────────────────────────────────────────────────────────

describe("numerarEras", () => {
  const p1 = plano({ id: "p1", criado_em: "2026-05-01T10:00:00.000Z", vigencia: vigenciaArquivada("2026-05-01", "2026-06-01") })
  const p2 = plano({ id: "p2", criado_em: "2026-06-01T10:00:00.000Z", vigencia: vigenciaArquivada("2026-06-01", "2026-07-01") })
  const p3 = plano({ id: "p3", criado_em: "2026-07-01T10:00:00.000Z", vigencia: vigenciaAtiva("2026-07-01") })

  const semRegistros = () => 0

  it("numera pelo COMEÇO: a era mais antiga é 1, a mais recente é a última", () => {
    // Entrada em ordem de exibição (recente primeiro); a saída preserva a ordem.
    const eras = numerarEras([p3, p2, p1], semRegistros)
    expect(eras.map((e) => [e.plano.id, e.numero])).toEqual([["p3", 3], ["p2", 2], ["p1", 1]])
  })

  it("o número da era antiga NÃO muda quando uma nova era começa", () => {
    const antes = numerarEras([p2, p1], semRegistros)
    const depois = numerarEras([p3, p2, p1], semRegistros)
    const numeroDe = (eras: ReturnType<typeof numerarEras>, id: string) =>
      eras.find((e) => e.plano.id === id)?.numero
    expect(numeroDe(antes, "p1")).toBe(1)
    expect(numeroDe(depois, "p1")).toBe(1)
    expect(numeroDe(antes, "p2")).toBe(2)
    expect(numeroDe(depois, "p2")).toBe(2)
  })

  it("marca como ativa só a era do Plano Ativo e traz a vigência formatada", () => {
    const [ativa, arquivada] = numerarEras([p3, p2], semRegistros)
    expect(ativa.ativa).toBe(true)
    expect(ativa.vigencia).toEqual({ inicio: "1 jul 2026", fim: "atual", ativo: true })
    expect(arquivada.ativa).toBe(false)
    expect(arquivada.vigencia).toEqual({ inicio: "1 jun 2026", fim: "1 jul 2026", ativo: false })
  })

  it("resolve os dias registrados pela função recebida", () => {
    const dias = new Map([["p1", 4], ["p2", 0], ["p3", 11]])
    const eras = numerarEras([p3, p2, p1], (p) => dias.get(p.id) ?? 0)
    expect(eras.map((e) => e.diasRegistrados)).toEqual([11, 0, 4])
  })

  it("lista vazia devolve lista vazia", () => {
    expect(numerarEras([], semRegistros)).toEqual([])
  })
})

// ─── resumirEras ──────────────────────────────────────────────────────────────

describe("resumirEras", () => {
  const p1 = plano({ id: "p1", criado_em: "2026-05-01T10:00:00.000Z", vigencia: vigenciaArquivada("2026-05-01", "2026-06-01") })
  const p2 = plano({ id: "p2", criado_em: "2026-06-01T10:00:00.000Z", vigencia: vigenciaArquivada("2026-06-01", "2026-07-01") })
  const p3 = plano({ id: "p3", criado_em: "2026-07-01T10:00:00.000Z", vigencia: vigenciaAtiva("2026-07-01") })

  it("conta as eras, soma os dias e cobre do começo da primeira ao fim da última", () => {
    const dias = new Map([["p1", 4], ["p2", 7], ["p3", 2]])
    const resumo = resumirEras(numerarEras([p3, p2, p1], (p) => dias.get(p.id) ?? 0))
    expect(resumo).toEqual({
      totalEras: 3,
      desde: "2026-05-01",
      periodo: "1 mai 2026 → atual",
      diasRegistrados: 13,
    })
  })

  it("sem Plano Ativo, o período termina na data real da última era", () => {
    const resumo = resumirEras(numerarEras([p2, p1], () => 0))
    expect(resumo.periodo).toBe("1 mai 2026 → 1 jul 2026")
  })

  it("uma era só: o período vai do início dela até 'atual'", () => {
    const resumo = resumirEras(numerarEras([p3], () => 5))
    expect(resumo).toEqual({
      totalEras: 1,
      desde: "2026-07-01",
      periodo: "1 jul 2026 → atual",
      diasRegistrados: 5,
    })
  })

  it("sem eras: travessão no período e nada a contar", () => {
    expect(resumirEras([])).toEqual({
      totalEras: 0,
      desde: null,
      periodo: "—",
      diasRegistrados: 0,
    })
  })
})

// ─── formatarContagemEras ─────────────────────────────────────────────────────

describe("formatarContagemEras", () => {
  it("pluraliza e reduz o começo a mês/ano", () => {
    expect(formatarContagemEras(3, "2026-05-01" as ISODate)).toBe("3 eras desde mai 2026")
    expect(formatarContagemEras(1, "2026-07-16" as ISODate)).toBe("1 era desde jul 2026")
  })

  it("sem eras (ou sem começo) vira travessão", () => {
    expect(formatarContagemEras(0, null)).toBe("—")
    expect(formatarContagemEras(2, null)).toBe("—")
  })
})

// ─── nomesRefeicoesDoPlano ────────────────────────────────────────────────────

describe("nomesRefeicoesDoPlano", () => {
  it("mapeia id → nome varrendo os Perfis de Dia", () => {
    const p = plano({
      id: "p1",
      criado_em: "2026-07-01T10:00:00.000Z",
      vigencia: vigenciaAtiva("2026-07-01"),
      refeicoes: [
        { id: "cafe", nome: "Café da manhã" },
        { id: "almoco", nome: "Almoço" },
      ],
    })
    const mapa = nomesRefeicoesDoPlano(p)
    expect(mapa.get("cafe")).toBe("Café da manhã")
    expect(mapa.get("almoco")).toBe("Almoço")
    expect(mapa.get("inexistente")).toBeUndefined()
  })
})

// ─── ordenarRegistrosCronologico ──────────────────────────────────────────────

describe("ordenarRegistrosCronologico", () => {
  it("ordena do mais antigo ao mais recente", () => {
    const r1 = registro({ id: "r1", data: "2026-07-03", plano_id: "p1" })
    const r2 = registro({ id: "r2", data: "2026-07-01", plano_id: "p1" })
    const r3 = registro({ id: "r3", data: "2026-07-02", plano_id: "p1" })
    expect(ordenarRegistrosCronologico([r1, r2, r3]).map((r) => r.data)).toEqual([
      "2026-07-01", "2026-07-02", "2026-07-03",
    ])
  })

  it("desempata datas iguais por id (ordem estável)", () => {
    const rb = registro({ id: "rb", data: "2026-07-01", plano_id: "p1" })
    const ra = registro({ id: "ra", data: "2026-07-01", plano_id: "p1" })
    expect(ordenarRegistrosCronologico([rb, ra]).map((r) => r.id)).toEqual(["ra", "rb"])
  })
})

// ─── resumirRegistro ──────────────────────────────────────────────────────────

describe("resumirRegistro", () => {
  const nomes = new Map([
    ["cafe", "Café da manhã"],
    ["almoco", "Almoço"],
    ["janta", "Jantar"],
  ])

  it("lista só as Refeições Seguidas, pelo nome, ignorando as Não Seguidas", () => {
    const r = registro({
      id: "r1",
      data: "2026-07-01",
      plano_id: "p1",
      refeicoesSeguidas: ["cafe", "janta"],
      refeicoesNaoSeguidas: ["almoco"],
      treino: true,
      jj: false,
      agua: 1500,
    })
    const resumo = resumirRegistro(r, nomes)
    expect(resumo).toEqual({
      registroId: "r1",
      data: "1 jul 2026",
      refeicoesSeguidas: ["Café da manhã", "Jantar"],
      treinoRealizado: true,
      jjRealizado: false,
      aguaConsumidaMl: 1500,
    })
  })

  it("trata treino/JJ null como false e água null como 0", () => {
    const r = registro({ id: "r1", data: "2026-07-01", plano_id: "p1" })
    const resumo = resumirRegistro(r, nomes)
    expect(resumo.treinoRealizado).toBe(false)
    expect(resumo.jjRealizado).toBe(false)
    expect(resumo.aguaConsumidaMl).toBe(0)
    expect(resumo.refeicoesSeguidas).toEqual([])
  })

  it("cai no id quando o nome não está no mapa (defensivo)", () => {
    const r = registro({ id: "r1", data: "2026-07-01", plano_id: "p1", refeicoesSeguidas: ["desconhecida"] })
    expect(resumirRegistro(r, nomes).refeicoesSeguidas).toEqual(["desconhecida"])
  })
})
