import { describe, it, expect } from "vitest"
import {
  diasNoMes,
  diaSemanaDoPrimeiro,
  gerarGradeMes,
  mesAnterior,
  mesProximo,
  primeiroDia,
  ultimoDia,
  rotuloMes,
  CABECALHOS_SEMANA,
  somarDias,
  mesDe,
  indiceDiaSemana,
  ehDataFutura,
  parseDataISO,
  type CelulaDia,
} from "./calendario-core"
import type { ISODate } from "@/types"

const d = (s: string) => s as ISODate

describe("diasNoMes", () => {
  it("meses de 31 dias", () => {
    for (const mes of [1, 3, 5, 7, 8, 10, 12]) expect(diasNoMes(2026, mes)).toBe(31)
  })
  it("meses de 30 dias", () => {
    for (const mes of [4, 6, 9, 11]) expect(diasNoMes(2026, mes)).toBe(30)
  })
  it("fevereiro em ano comum tem 28", () => {
    expect(diasNoMes(2026, 2)).toBe(28)
  })
  it("fevereiro em ano bissexto tem 29", () => {
    expect(diasNoMes(2024, 2)).toBe(29)
  })
  it("regra de bissexto secular: 2000 é bissexto, 1900 não", () => {
    expect(diasNoMes(2000, 2)).toBe(29)
    expect(diasNoMes(1900, 2)).toBe(28)
  })
})

describe("diaSemanaDoPrimeiro", () => {
  it("1º de julho de 2026 é quarta (índice 3)", () => {
    expect(diaSemanaDoPrimeiro(2026, 7)).toBe(3)
  })
  it("1º de fevereiro de 2026 é domingo (índice 0)", () => {
    expect(diaSemanaDoPrimeiro(2026, 2)).toBe(0)
  })
  it("1º de agosto de 2026 é sábado (índice 6)", () => {
    expect(diaSemanaDoPrimeiro(2026, 8)).toBe(6)
  })
})

describe("primeiroDia / ultimoDia", () => {
  it("delimita o mês como ISODate para listarPorPeriodo", () => {
    expect(primeiroDia(2026, 7)).toBe("2026-07-01")
    expect(ultimoDia(2026, 7)).toBe("2026-07-31")
    expect(ultimoDia(2024, 2)).toBe("2024-02-29")
  })
})

describe("gerarGradeMes", () => {
  it("toda semana tem exatamente 7 células", () => {
    const grade = gerarGradeMes(2026, 7)
    for (const semana of grade) expect(semana).toHaveLength(7)
  })

  it("o número de células preenchidas iguala os dias do mês", () => {
    const grade = gerarGradeMes(2026, 7)
    const preenchidas = grade.flat().filter((c): c is CelulaDia => c !== null)
    expect(preenchidas).toHaveLength(31)
    expect(preenchidas[0]).toEqual({ data: "2026-07-01", dia: 1 })
    expect(preenchidas[30]).toEqual({ data: "2026-07-31", dia: 31 })
  })

  it("o dia 1 cai na coluna do seu dia da semana (julho/2026 = quarta, col 3)", () => {
    const grade = gerarGradeMes(2026, 7)
    const primeira = grade[0]
    expect(primeira[0]).toBeNull() // domingo
    expect(primeira[1]).toBeNull() // segunda
    expect(primeira[2]).toBeNull() // terça
    expect(primeira[3]).toEqual({ data: "2026-07-01", dia: 1 }) // quarta
  })

  it("mês que começa no domingo não tem preenchimento inicial (fev/2026)", () => {
    const grade = gerarGradeMes(2026, 2)
    expect(grade[0][0]).toEqual({ data: "2026-02-01", dia: 1 })
  })

  it("mês que começa no sábado tem 6 células nulas antes do dia 1 (ago/2026)", () => {
    const grade = gerarGradeMes(2026, 8)
    const primeira = grade[0]
    expect(primeira.slice(0, 6).every((c) => c === null)).toBe(true)
    expect(primeira[6]).toEqual({ data: "2026-08-01", dia: 1 })
  })

  it("fevereiro bissexto começando no domingo cabe em 5 semanas exatas (fev/2026 tem 28d = 4 semanas)", () => {
    expect(gerarGradeMes(2026, 2)).toHaveLength(4)
  })

  it("todas as células têm data ISO consistente com o dia", () => {
    const grade = gerarGradeMes(2024, 2) // bissexto
    const preenchidas = grade.flat().filter((c): c is CelulaDia => c !== null)
    expect(preenchidas).toHaveLength(29)
    expect(preenchidas.at(-1)).toEqual({ data: "2024-02-29", dia: 29 })
  })
})

describe("mesAnterior / mesProximo", () => {
  it("avança dentro do ano", () => {
    expect(mesProximo({ ano: 2026, mes: 7 })).toEqual({ ano: 2026, mes: 8 })
  })
  it("retrocede dentro do ano", () => {
    expect(mesAnterior({ ano: 2026, mes: 7 })).toEqual({ ano: 2026, mes: 6 })
  })
  it("vira o ano para frente em dezembro", () => {
    expect(mesProximo({ ano: 2026, mes: 12 })).toEqual({ ano: 2027, mes: 1 })
  })
  it("vira o ano para trás em janeiro", () => {
    expect(mesAnterior({ ano: 2026, mes: 1 })).toEqual({ ano: 2025, mes: 12 })
  })
})

describe("somarDias", () => {
  it("soma dentro do mês", () => {
    expect(somarDias(d("2026-07-15"), 1)).toBe("2026-07-16")
    expect(somarDias(d("2026-07-15"), 7)).toBe("2026-07-22")
    expect(somarDias(d("2026-07-15"), -7)).toBe("2026-07-08")
  })
  it("atravessa a virada do mês", () => {
    expect(somarDias(d("2026-07-31"), 1)).toBe("2026-08-01")
    expect(somarDias(d("2026-08-01"), -1)).toBe("2026-07-31")
  })
  it("atravessa a virada do ano", () => {
    expect(somarDias(d("2026-12-31"), 1)).toBe("2027-01-01")
    expect(somarDias(d("2026-01-01"), -1)).toBe("2025-12-31")
  })
  it("respeita fevereiro comum e bissexto", () => {
    expect(somarDias(d("2026-03-01"), -1)).toBe("2026-02-28") // 2026 comum
    expect(somarDias(d("2024-03-01"), -1)).toBe("2024-02-29") // 2024 bissexto
    expect(somarDias(d("2024-02-28"), 1)).toBe("2024-02-29")
  })
  it("delta zero devolve a mesma data", () => {
    expect(somarDias(d("2026-07-15"), 0)).toBe("2026-07-15")
  })
})

describe("mesDe", () => {
  it("extrai ano e mês humano da ISODate", () => {
    expect(mesDe(d("2026-07-15"))).toEqual({ ano: 2026, mes: 7 })
    expect(mesDe(d("2027-01-01"))).toEqual({ ano: 2027, mes: 1 })
    expect(mesDe(d("2025-12-31"))).toEqual({ ano: 2025, mes: 12 })
  })
})

describe("indiceDiaSemana", () => {
  it("coincide com diaSemanaDoPrimeiro no dia 1", () => {
    expect(indiceDiaSemana(d("2026-07-01"))).toBe(3) // quarta
    expect(indiceDiaSemana(d("2026-02-01"))).toBe(0) // domingo
  })
  it("resolve um dia arbitrário", () => {
    expect(indiceDiaSemana(d("2026-07-05"))).toBe(0) // domingo
    expect(indiceDiaSemana(d("2026-07-11"))).toBe(6) // sábado
  })
})

describe("ehDataFutura", () => {
  it("data depois de hoje é futura", () => {
    expect(ehDataFutura(d("2026-07-28"), d("2026-07-27"))).toBe(true)
    expect(ehDataFutura(d("2026-08-01"), d("2026-07-31"))).toBe(true)
  })
  it("o próprio hoje NÃO é futuro", () => {
    expect(ehDataFutura(d("2026-07-27"), d("2026-07-27"))).toBe(false)
  })
  it("data antes de hoje não é futura", () => {
    expect(ehDataFutura(d("2026-07-26"), d("2026-07-27"))).toBe(false)
    expect(ehDataFutura(d("2025-12-31"), d("2026-01-01"))).toBe(false)
  })
})

describe("parseDataISO", () => {
  it("aceita uma data válida e a devolve como ISODate", () => {
    expect(parseDataISO("2026-07-12")).toBe("2026-07-12")
    expect(parseDataISO("2024-02-29")).toBe("2024-02-29") // bissexto
  })
  it("rejeita datas impossíveis", () => {
    expect(parseDataISO("2026-02-29")).toBeNull() // 2026 não é bissexto
    expect(parseDataISO("2026-02-30")).toBeNull()
    expect(parseDataISO("2026-04-31")).toBeNull()
    expect(parseDataISO("2026-13-01")).toBeNull()
    expect(parseDataISO("2026-00-10")).toBeNull()
    expect(parseDataISO("2026-07-00")).toBeNull()
  })
  it("rejeita formato malformado", () => {
    expect(parseDataISO("2026-7-12")).toBeNull() // sem zero à esquerda
    expect(parseDataISO("12/07/2026")).toBeNull()
    expect(parseDataISO("lixo")).toBeNull()
    expect(parseDataISO("")).toBeNull()
    expect(parseDataISO("2026-07-12T00:00:00")).toBeNull()
  })
})

describe("rotuloMes / CABECALHOS_SEMANA", () => {
  it("rótulo em português com o ano", () => {
    expect(rotuloMes(2026, 7)).toBe("Julho 2026")
    expect(rotuloMes(2026, 3)).toBe("Março 2026")
  })
  it("sete cabeçalhos, domingo-primeiro", () => {
    expect(CABECALHOS_SEMANA).toHaveLength(7)
    expect(CABECALHOS_SEMANA[0]).toEqual({ curto: "D", longo: "Domingo" })
    expect(CABECALHOS_SEMANA[6]).toEqual({ curto: "S", longo: "Sábado" })
  })
})
