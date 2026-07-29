import { describe, it, expect } from "vitest"
import {
  refeicoesPlanejadasEm,
  proporcaoRefeicoesSeguidas,
  nivelDeAderencia,
  rotuloNivelAderencia,
  resumirDia,
  resumirMes,
  diasDecorridosNoMes,
  formatarDiasRegistrados,
  LIMIAR_NIVEL_2,
} from "./aderencia-core"
import type {
  ISODate, ISOTimestamp, Plano, Refeicao, RegistroDeAderencia, RegistroDeRefeicao,
  PlanoId, RegistroId, UsuarioId, DiaDaSemana,
} from "@/types"

const d = (s: string) => s as ISODate

// 2026-07-14 é uma TERÇA-feira; 2026-07-15 é uma QUARTA. Os fixtures abaixo
// prescrevem refeições só para terça, então quarta é o dia "sem refeições
// previstas" sem precisar de um Plano diferente.
const TERCA = d("2026-07-14")
const QUARTA = d("2026-07-15")

function refeicao(id: string): Refeicao {
  return {
    id,
    nome: id,
    horario: "12:00",
    opcoes: [{
      id: `${id}-op`,
      descricao: "opção",
      macros: { kcal: 400, proteina_g: 30, carboidrato_g: 40, gordura_g: 10 },
    }],
  }
}

// Plano que prescreve `n` refeições às terças e nada nos outros dias.
function planoCom(n: number, dias: readonly DiaDaSemana[] = ["Terca"]): Plano {
  return {
    id: "plano-1" as PlanoId,
    usuario_id: "usuario-local" as UsuarioId,
    autor_id: "usuario-local" as UsuarioId,
    vigencia: { status: "ativo", inicio: d("2026-07-01") },
    objetivo: "Manutencao",
    meta_calorica_diaria: 2000,
    meta_proteina_diaria_g: 150,
    meta_carboidrato_diaria_g: 200,
    meta_gordura_diaria_g: 60,
    meta_agua_diaria_ml: 3000,
    perfis_refeicao: [{
      dias,
      refeicoes: Array.from({ length: n }, (_, i) => refeicao(`ref-${i + 1}`)),
    }],
    sessoes_treino: [],
    checklist_template: [],
    criado_em: "2026-07-01T10:00:00.000Z" as ISOTimestamp,
  }
}

// Registro que marcou como "Seguiu" as `seguidas` primeiras refeições.
function registroCom(
  seguidas: number,
  data: ISODate = TERCA,
  extras: readonly RegistroDeRefeicao[] = [],
): RegistroDeAderencia {
  const marcadas: RegistroDeRefeicao[] = Array.from({ length: seguidas }, (_, i) => ({
    refeicao_id: `ref-${i + 1}`,
    status: "Seguiu",
    opcao_seguida_id: `ref-${i + 1}-op`,
  }))
  return {
    id: "reg-1" as RegistroId,
    usuario_id: "usuario-local" as UsuarioId,
    plano_id: "plano-1" as PlanoId,
    data,
    editado_em: null,
    registros_refeicao: [...marcadas, ...extras],
    agua_consumida_ml: null,
    treino_realizado: null,
    jj_realizado: null,
    checklist: {},
    registros_exercicio: [],
  }
}

describe("refeicoesPlanejadasEm", () => {
  it("devolve as refeições do Perfil que cobre o dia da semana da data", () => {
    expect(refeicoesPlanejadasEm(planoCom(4), TERCA).map((r) => r.id))
      .toEqual(["ref-1", "ref-2", "ref-3", "ref-4"])
  })

  it("devolve vazio quando nenhum Perfil cobre aquele dia da semana", () => {
    expect(refeicoesPlanejadasEm(planoCom(4), QUARTA)).toEqual([])
  })

  it("resolve o dia da semana no fuso LOCAL — a data não escorrega para o dia anterior", () => {
    // new Date("2026-07-14") seria UTC e, em fusos negativos, cairia na segunda.
    // O Perfil só cobre terça, então um escorregão devolveria vazio aqui.
    expect(refeicoesPlanejadasEm(planoCom(3), TERCA)).toHaveLength(3)
  })
})

describe("proporcaoRefeicoesSeguidas", () => {
  it("conta refeições Seguidas sobre o total previsto para o dia", () => {
    expect(proporcaoRefeicoesSeguidas(registroCom(3), planoCom(4))).toBe(0.75)
  })

  it("dia cheio devolve exatamente 1", () => {
    expect(proporcaoRefeicoesSeguidas(registroCom(4), planoCom(4))).toBe(1)
  })

  it("registro sem nenhuma refeição marcada devolve 0 (não null)", () => {
    expect(proporcaoRefeicoesSeguidas(registroCom(0), planoCom(4))).toBe(0)
  })

  it("NaoSeguiu explícito conta como não seguida, igual a não marcada", () => {
    const comNaoSeguiu = registroCom(1, TERCA, [{ refeicao_id: "ref-2", status: "NaoSeguiu" }])
    expect(proporcaoRefeicoesSeguidas(comNaoSeguiu, planoCom(4))).toBe(0.25)
  })

  // O denominador vem do Plano justamente por isto: registros_refeicao é esparso.
  it("não usa o tamanho de registros_refeicao como total — 1 marcada de 5 é 20%, não 100%", () => {
    expect(proporcaoRefeicoesSeguidas(registroCom(1), planoCom(5))).toBe(0.2)
  })

  it("id que saiu do Plano não infla o numerador acima de 1", () => {
    const comOrfa = registroCom(2, TERCA, [
      { refeicao_id: "ref-de-outro-plano", status: "Seguiu", opcao_seguida_id: "x" },
    ])
    expect(proporcaoRefeicoesSeguidas(comOrfa, planoCom(2))).toBe(1)
  })

  it("null quando o Plano do Registro não foi encontrado", () => {
    expect(proporcaoRefeicoesSeguidas(registroCom(2), null)).toBeNull()
  })

  it("null quando o dia não tem refeições previstas — sem divisão por zero", () => {
    expect(proporcaoRefeicoesSeguidas(registroCom(0, QUARTA), planoCom(4))).toBeNull()
  })

  it("null quando o Perfil do dia existe mas está vazio", () => {
    expect(proporcaoRefeicoesSeguidas(registroCom(0), planoCom(0))).toBeNull()
  })
})

describe("nivelDeAderencia — cortes", () => {
  const casos: readonly [total: number, seguidas: number, nivel: 0 | 1 | 2 | 3][] = [
    [4, 4, 3],
    [4, 3, 2],
    [4, 2, 1],
    [4, 1, 1],
    [4, 0, 0],
    [3, 3, 3],
    [3, 2, 2],
    [3, 1, 1],
    [6, 5, 2],
    [6, 4, 2],
    [6, 3, 1],
    [6, 1, 1],
    [5, 3, 1],  // 0,60 — maioria, mas abaixo de 2/3: fica em 1 ponto
    [5, 4, 2],  // 0,80
    [1, 1, 3],
    [1, 0, 0],
  ]

  for (const [total, seguidas, nivel] of casos) {
    it(`${seguidas} de ${total} refeições → nível ${nivel}`, () => {
      expect(nivelDeAderencia(registroCom(seguidas), planoCom(total))).toBe(nivel)
    })
  }
})

describe("nivelDeAderencia — fronteiras e arredondamento", () => {
  it("nível 3 exige o dia INTEIRO, sem arredondar: 5 de 6 (0,83) acende 2, não 3", () => {
    expect(nivelDeAderencia(registroCom(5), planoCom(6))).toBe(2)
  })

  it("nível 3 não é alcançado por 9 de 10 (0,9), que arredondaria para 3 pontos", () => {
    expect(nivelDeAderencia(registroCom(9), planoCom(10))).toBe(2)
  })

  it("exatamente 2/3 alcança o nível 2 (fronteira inclusiva, sem erro de float)", () => {
    expect(proporcaoRefeicoesSeguidas(registroCom(2), planoCom(3))).toBeGreaterThanOrEqual(LIMIAR_NIVEL_2)
    expect(nivelDeAderencia(registroCom(2), planoCom(3))).toBe(2)
    expect(nivelDeAderencia(registroCom(4), planoCom(6))).toBe(2)
    expect(nivelDeAderencia(registroCom(6), planoCom(9))).toBe(2)
  })

  it("logo abaixo de 2/3 cai para o nível 1", () => {
    expect(nivelDeAderencia(registroCom(6), planoCom(10))).toBe(1) // 0,60
    expect(nivelDeAderencia(registroCom(65), planoCom(100))).toBe(1) // 0,65
  })

  // O piso: qualquer progresso acende um ponto, mesmo abaixo do terço uniforme.
  it("progresso mínimo acende 1 ponto — 1 de 20 (0,05) não é nível 0", () => {
    expect(nivelDeAderencia(registroCom(1), planoCom(20))).toBe(1)
  })

  it("nível 0 fica reservado a zero refeições seguidas com registro existente", () => {
    expect(nivelDeAderencia(registroCom(0), planoCom(20))).toBe(0)
  })

  it("indeterminada devolve null, que é distinto do nível 0", () => {
    expect(nivelDeAderencia(registroCom(0), null)).toBeNull()
    expect(nivelDeAderencia(registroCom(0, QUARTA), planoCom(4))).toBeNull()
    expect(nivelDeAderencia(registroCom(0), planoCom(4))).toBe(0)
  })
})

describe("nivelDeAderencia — Plano do dia, não Plano de hoje (ADR-0015)", () => {
  it("mede contra as refeições do Plano ao qual o Registro está vinculado", () => {
    // O mesmo registro (2 seguidas) contra Planos de tamanhos diferentes: quem
    // manda é o Plano passado, que o chamador resolve por registro.plano_id.
    expect(nivelDeAderencia(registroCom(2), planoCom(2))).toBe(3)
    expect(nivelDeAderencia(registroCom(2), planoCom(6))).toBe(1)
  })
})

describe("diasDecorridosNoMes", () => {
  const hoje = d("2026-07-14")

  it("mês inteiramente no passado conta todos os dias", () => {
    expect(diasDecorridosNoMes(2026, 6, hoje)).toBe(30)
    expect(diasDecorridosNoMes(2026, 5, hoje)).toBe(31)
  })

  it("mês corrente conta até hoje, inclusive", () => {
    expect(diasDecorridosNoMes(2026, 7, hoje)).toBe(14)
  })

  it("mês inteiramente no futuro conta zero", () => {
    expect(diasDecorridosNoMes(2026, 8, hoje)).toBe(0)
    expect(diasDecorridosNoMes(2027, 1, hoje)).toBe(0)
  })

  it("último dia do mês: o mês está decorrido por inteiro", () => {
    expect(diasDecorridosNoMes(2026, 7, d("2026-07-31"))).toBe(31)
  })

  it("primeiro dia do mês conta 1, não 0", () => {
    expect(diasDecorridosNoMes(2026, 7, d("2026-07-01"))).toBe(1)
  })

  it("fevereiro bissexto no passado conta 29", () => {
    expect(diasDecorridosNoMes(2024, 2, d("2024-05-10"))).toBe(29)
  })
})

describe("formatarDiasRegistrados", () => {
  it("mês com dias decorridos mostra a razão", () => {
    expect(formatarDiasRegistrados(4, 28)).toBe("4 de 28")
    expect(formatarDiasRegistrados(0, 30)).toBe("0 de 30")
  })

  it("mês inteiramente futuro vira travessão — '0 de 0' lê como defeito", () => {
    expect(formatarDiasRegistrados(0, 0)).toBe("—")
  })
})

describe("resumirDia", () => {
  it("dia sem registro: temRegistro false e nível null, mas já sabe o previsto", () => {
    const r = resumirDia(TERCA, null, planoCom(4))
    expect(r.temRegistro).toBe(false)
    expect(r.nivel).toBeNull()
    expect(r.refeicoesSeguidas).toBe(0)
    expect(r.refeicoesPrevistas).toBe(4)
  })

  it("dia com registro traz o detalhe completo — água, treino, JJ e checklist", () => {
    const registro = {
      ...registroCom(3),
      agua_consumida_ml: 2500,
      treino_realizado: true,
      jj_realizado: false,
      checklist: { sono: true, alongar: false, creatina: true },
    }
    const r = resumirDia(TERCA, registro, planoCom(4))
    expect(r.temRegistro).toBe(true)
    expect(r.nivel).toBe(2)
    expect(r.refeicoesSeguidas).toBe(3)
    expect(r.refeicoesPrevistas).toBe(4)
    expect(r.aguaMl).toBe(2500)
    expect(r.treino).toBe(true)
    expect(r.jj).toBe(false)
    expect(r.checklistFeitos).toBe(2)
    expect(r.checklistTotal).toBe(3)
  })

  it("distingue não-registrado (null) de registrado-como-falso em treino e água", () => {
    const r = resumirDia(TERCA, registroCom(1), planoCom(4))
    expect(r.aguaMl).toBeNull()
    expect(r.treino).toBeNull()
    expect(r.jj).toBeNull()
  })

  it("dia sem Plano resolvível não inventa previsão", () => {
    const r = resumirDia(TERCA, registroCom(2), null)
    expect(r.refeicoesPrevistas).toBe(0)
    expect(r.nivel).toBeNull()
  })
})

describe("resumirMes", () => {
  const hoje = d("2026-07-14")
  const plano4 = planoCom(4)
  const semprePlano = () => plano4

  // Terças de julho/2026: 7, 14, 21, 28. Só elas têm refeições previstas.
  const terca = (dia: number, seguidas: number) =>
    registroCom(seguidas, d(`2026-07-${String(dia).padStart(2, "0")}`))

  it("conta dias registrados e dias decorridos", () => {
    const resumo = resumirMes([terca(7, 4), terca(14, 2)], semprePlano, 2026, 7, hoje)
    expect(resumo.diasRegistrados).toBe(2)
    expect(resumo.diasDecorridos).toBe(14)
  })

  it("média é sobre os dias COM registro, não sobre os dias decorridos", () => {
    // 4/4 = 1,00 e 2/4 = 0,50 → média 0,75. Os outros 12 dias decorridos sem
    // registro NÃO entram como zero.
    const resumo = resumirMes([terca(7, 4), terca(14, 2)], semprePlano, 2026, 7, hoje)
    expect(resumo.aderenciaMediaPct).toBe(75)
  })

  it("média arredonda para inteiro", () => {
    // 1,00 + 0,75 + 0,25 = 2,00 / 3 = 0,6667 → 67%
    const resumo = resumirMes(
      [terca(7, 4), terca(14, 3), terca(21, 1)], semprePlano, 2026, 7, d("2026-07-31"),
    )
    expect(resumo.aderenciaMediaPct).toBe(67)
  })

  it("distribuição indexada pelo nível, e diasCheios espelha o nível 3", () => {
    const resumo = resumirMes(
      [terca(7, 4), terca(14, 3), terca(21, 1), terca(28, 0)],
      semprePlano, 2026, 7, d("2026-07-31"),
    )
    expect(resumo.distribuicao).toEqual([1, 1, 1, 1]) // um dia em cada nível
    expect(resumo.diasCheios).toBe(1)
  })

  it("ignora registros de outros meses que venham na lista", () => {
    const resumo = resumirMes(
      [terca(7, 4), registroCom(0, d("2026-06-30")), registroCom(4, d("2026-08-04"))],
      semprePlano, 2026, 7, hoje,
    )
    expect(resumo.diasRegistrados).toBe(1)
    expect(resumo.aderenciaMediaPct).toBe(100)
  })

  it("mês sem nenhum registro: média null, não zero", () => {
    const resumo = resumirMes([], semprePlano, 2026, 7, hoje)
    expect(resumo.diasRegistrados).toBe(0)
    expect(resumo.aderenciaMediaPct).toBeNull()
    expect(resumo.distribuicao).toEqual([0, 0, 0, 0])
  })

  it("dias indeterminados entram em diasRegistrados mas ficam fora da média", () => {
    // 2026-07-15 é quarta: sem refeições previstas → proporção indeterminada.
    const resumo = resumirMes(
      [terca(7, 4), registroCom(0, d("2026-07-15"))], semprePlano, 2026, 7, hoje,
    )
    expect(resumo.diasRegistrados).toBe(2)
    expect(resumo.aderenciaMediaPct).toBe(100) // só a terça é mensurável
    expect(resumo.distribuicao).toEqual([0, 0, 0, 1])
  })

  it("registro cujo Plano não foi encontrado não quebra nem entra na média", () => {
    const resumo = resumirMes([terca(7, 4), terca(14, 2)], () => null, 2026, 7, hoje)
    expect(resumo.diasRegistrados).toBe(2)
    expect(resumo.aderenciaMediaPct).toBeNull()
  })

  it("cada registro é medido contra o SEU Plano (ADR-0015)", () => {
    // O dia 7 sob um Plano de 2 refeições (2/2 = cheio); o dia 14 sob um de 6
    // (2/6 = nível 1). O mesmo registro daria níveis diferentes.
    const plano2 = planoCom(2)
    const plano6 = planoCom(6)
    const resumo = resumirMes(
      [terca(7, 2), terca(14, 2)],
      (r) => (r.data === "2026-07-07" ? plano2 : plano6),
      2026, 7, hoje,
    )
    expect(resumo.distribuicao).toEqual([0, 1, 0, 1])
    expect(resumo.aderenciaMediaPct).toBe(67) // (1,00 + 0,333) / 2 = 0,667
  })
})

describe("rotuloNivelAderencia", () => {
  it("dá texto a cada nível — o indicador é visual, o significado precisa ser lido", () => {
    expect(rotuloNivelAderencia(3)).toBe("todas as refeições seguidas")
    expect(rotuloNivelAderencia(2)).toBe("maior parte das refeições seguidas")
    expect(rotuloNivelAderencia(1)).toBe("parte das refeições seguidas")
    expect(rotuloNivelAderencia(0)).toBe("nenhuma refeição seguida")
  })
})
