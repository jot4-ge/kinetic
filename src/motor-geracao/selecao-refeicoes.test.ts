import { describe, it, expect } from "vitest"
import { selecionarOpcao, montarRefeicoes } from "./selecao-refeicoes"
import { REFEICOES_CEDO } from "@/banco-opcoes"
import type { Refeicao } from "@/types"

// ─── Fixtures mínimas ─────────────────────────────────────────────────────────

const refeiçãoSimples: Refeicao = {
  id: "cafe",
  nome: "Café da manhã",
  horario: "07:00",
  opcoes: [
    { id: "op1", descricao: "Shake (390 kcal)", macros: { kcal: 390, proteina_g: 34, carboidrato_g: 61, gordura_g: 4 } },
    { id: "op2", descricao: "Pão + Ovos (430 kcal)", macros: { kcal: 430, proteina_g: 24, carboidrato_g: 51, gordura_g: 16 } },
  ],
}

const refeiçãoUnicaOpcao: Refeicao = {
  id: "lanche",
  nome: "Lanche",
  horario: "11:30",
  opcoes: [
    { id: "op1", descricao: "Iogurte (280 kcal)", macros: { kcal: 280, proteina_g: 35, carboidrato_g: 36, gordura_g: 2 } },
  ],
}

const refeiçãoComEmpate: Refeicao = {
  id: "ceia",
  nome: "Ceia",
  horario: "22:00",
  opcoes: [
    { id: "primeiro", descricao: "Op A (300 kcal)", macros: { kcal: 300, proteina_g: 20, carboidrato_g: 30, gordura_g: 5 } },
    { id: "segundo",  descricao: "Op B (500 kcal)", macros: { kcal: 500, proteina_g: 20, carboidrato_g: 60, gordura_g: 5 } },
    // target 400: |300-400|=100, |500-400|=100 → empate → primeiro vence (declaração)
  ],
}

// ─── selecionarOpcao ──────────────────────────────────────────────────────────

describe("selecionarOpcao", () => {
  it("retorna a opção mais próxima quando alvo está acima das opções", () => {
    // alvo 450: |390-450|=60, |430-450|=20 → op2
    const opcao = selecionarOpcao(refeiçãoSimples, 450)
    expect(opcao.id).toBe("op2")
  })

  it("retorna a opção mais próxima quando alvo está abaixo das opções", () => {
    // alvo 380: |390-380|=10, |430-380|=50 → op1
    const opcao = selecionarOpcao(refeiçãoSimples, 380)
    expect(opcao.id).toBe("op1")
  })

  it("retorna a opção mais próxima quando alvo está entre as opções", () => {
    // alvo 418: |390-418|=28, |430-418|=12 → op2
    const opcao = selecionarOpcao(refeiçãoSimples, 418)
    expect(opcao.id).toBe("op2")
  })

  it("retorna a opção de match exato quando existe", () => {
    const opcao = selecionarOpcao(refeiçãoSimples, 390)
    expect(opcao.id).toBe("op1")
  })

  it("em empate exato, retorna a primeira na ordem de declaração do Banco", () => {
    // target 400: |300-400|=100, |500-400|=100 → empate → "primeiro" vence
    const opcao = selecionarOpcao(refeiçãoComEmpate, 400)
    expect(opcao.id).toBe("primeiro")
  })

  it("com única opção disponível, retorna ela independente do alvo", () => {
    const opcao = selecionarOpcao(refeiçãoUnicaOpcao, 999)
    expect(opcao.id).toBe("op1")
  })

  it("retorna uma OpcaoDeRefeicao válida (tem macros)", () => {
    const opcao = selecionarOpcao(refeiçãoSimples, 400)
    expect(opcao.macros).toBeDefined()
    expect(opcao.macros.kcal).toBeGreaterThan(0)
  })
})

// ─── montarRefeicoes ──────────────────────────────────────────────────────────

describe("montarRefeicoes", () => {
  it("preserva o número de refeições do template", () => {
    const resultado = montarRefeicoes(REFEICOES_CEDO, 2508)
    expect(resultado.length).toBe(REFEICOES_CEDO.length)
  })

  it("cada refeição resultante tem exatamente 1 opção selecionada", () => {
    const resultado = montarRefeicoes(REFEICOES_CEDO, 2508)
    resultado.forEach(r => {
      expect(r.opcoes.length).toBe(1)
    })
  })

  it("preserva id, nome e horario das refeições originais", () => {
    const resultado = montarRefeicoes(REFEICOES_CEDO, 2508)
    REFEICOES_CEDO.forEach((original, i) => {
      expect(resultado[i].id).toBe(original.id)
      expect(resultado[i].nome).toBe(original.nome)
      expect(resultado[i].horario).toBe(original.horario)
    })
  })

  it("é determinístico: mesmos inputs → mesmo output", () => {
    const r1 = montarRefeicoes(REFEICOES_CEDO, 2508)
    const r2 = montarRefeicoes(REFEICOES_CEDO, 2508)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  // ─── Resultado esperado para REFEICOES_CEDO + 2508 kcal ───────────────────
  // Alvo por slot = 2508 / 6 = 418 kcal
  //
  // cafe-da-manha: shake(390→Δ28) vs pao-com-ovos(430→Δ12) → pao-com-ovos
  // lanche:        iogurte(280→Δ138) vs pao-queijo-frango(368→Δ50) vs overnight-oats(403→Δ15) → overnight-oats
  // almoco:        arroz-frango(520→Δ102) vs arroz-carne(482→Δ64) vs hamburguer(502→Δ84) → arroz-feijao-carne
  // pre-treino:    aveia-whey-fruta(351→Δ67) vs pao-whey-agua(243→Δ175) → aveia-whey-fruta
  // jantar:        arroz-frango(520→Δ102) vs hamburguer(502→Δ84) → hamburguer-caseiro
  // ceia:          iogurte-whey-fruta(280→Δ138) vs iogurte-whey-leve(190→Δ228) → iogurte-whey-fruta

  describe("REFEICOES_CEDO com 2508 kcal/dia (80kg MuitoAtivo Cutting)", () => {
    const resultado = montarRefeicoes(REFEICOES_CEDO, 2508)
    const porId = Object.fromEntries(resultado.map(r => [r.id, r]))

    it("café da manhã → pao-com-ovos (Δ12 vs Δ28 do shake)", () => {
      expect(porId["cafe-da-manha"].opcoes[0].id).toBe("pao-com-ovos")
    })

    it("lanche → overnight-oats (Δ15, o mais próximo de 418)", () => {
      expect(porId["lanche"].opcoes[0].id).toBe("overnight-oats")
    })

    it("almoço → arroz-feijao-carne (Δ64, menor diferença absoluta)", () => {
      expect(porId["almoco"].opcoes[0].id).toBe("arroz-feijao-carne")
    })

    it("pré-treino → aveia-whey-fruta (Δ67 vs Δ175)", () => {
      expect(porId["pre-treino"].opcoes[0].id).toBe("aveia-whey-fruta")
    })

    it("jantar → hamburguer-caseiro (Δ84 vs Δ102)", () => {
      expect(porId["jantar"].opcoes[0].id).toBe("hamburguer-caseiro")
    })

    it("ceia → iogurte-whey-fruta (Δ138 vs Δ228)", () => {
      expect(porId["ceia"].opcoes[0].id).toBe("iogurte-whey-fruta")
    })

    it("total de kcal selecionadas é próximo de kcal_meta (tolerância ±200 kcal)", () => {
      const total = resultado.reduce((acc, r) => acc + r.opcoes[0].macros.kcal, 0)
      expect(Math.abs(total - 2508)).toBeLessThanOrEqual(200)
    })
  })

  it("com target muito alto, sempre seleciona a opção de maior kcal por slot", () => {
    const resultado = montarRefeicoes(REFEICOES_CEDO, 9999)
    resultado.forEach((r, i) => {
      const maxKcal = Math.max(...REFEICOES_CEDO[i].opcoes.map(o => o.macros.kcal))
      expect(r.opcoes[0].macros.kcal).toBe(maxKcal)
    })
  })

  it("com target zero, seleciona a opção de menor kcal por slot", () => {
    const resultado = montarRefeicoes(REFEICOES_CEDO, 0)
    resultado.forEach((r, i) => {
      const minKcal = Math.min(...REFEICOES_CEDO[i].opcoes.map(o => o.macros.kcal))
      expect(r.opcoes[0].macros.kcal).toBe(minKcal)
    })
  })
})
