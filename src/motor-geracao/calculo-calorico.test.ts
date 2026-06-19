import { describe, it, expect } from "vitest"
import {
  calcularTDEE,
  calcularKcalMeta,
  FATORES_ATIVIDADE,
  AJUSTES_OBJETIVO,
} from "./calculo-calorico"

// TMB de referência derivado do caso homem padrão (80kg/175cm/25y/M)
const TMB = 1773.75

describe("FATORES_ATIVIDADE", () => {
  it("cobre todas as 5 opções sem undefined", () => {
    const chaves = ["Sedentario", "LevementeAtivo", "ModeramenteAtivo", "MuitoAtivo", "ExtremamenteAtivo"] as const
    chaves.forEach(k => expect(FATORES_ATIVIDADE[k]).toBeGreaterThan(0))
  })

  it("ordem crescente: Sedentario < LevementeAtivo < ... < ExtremamenteAtivo", () => {
    expect(FATORES_ATIVIDADE["Sedentario"]).toBeLessThan(FATORES_ATIVIDADE["LevementeAtivo"])
    expect(FATORES_ATIVIDADE["LevementeAtivo"]).toBeLessThan(FATORES_ATIVIDADE["ModeramenteAtivo"])
    expect(FATORES_ATIVIDADE["ModeramenteAtivo"]).toBeLessThan(FATORES_ATIVIDADE["MuitoAtivo"])
    expect(FATORES_ATIVIDADE["MuitoAtivo"]).toBeLessThan(FATORES_ATIVIDADE["ExtremamenteAtivo"])
  })
})

describe("AJUSTES_OBJETIVO", () => {
  it("cobre todos os 4 objetivos sem undefined", () => {
    const chaves = ["Cutting", "Manutencao", "Bulk", "Recomposicao"] as const
    chaves.forEach(k => expect(AJUSTES_OBJETIVO[k]).toBeDefined())
  })

  it("Cutting é negativo (déficit)", () => {
    expect(AJUSTES_OBJETIVO["Cutting"]).toBeLessThan(0)
  })

  it("Bulk é positivo (superávit)", () => {
    expect(AJUSTES_OBJETIVO["Bulk"]).toBeGreaterThan(0)
  })

  it("Manutencao é zero", () => {
    expect(AJUSTES_OBJETIVO["Manutencao"]).toBe(0)
  })

  it("Recomposicao é zero (mesma caloria que Manutencao, split diferente)", () => {
    expect(AJUSTES_OBJETIVO["Recomposicao"]).toBe(0)
  })
})

describe("calcularTDEE", () => {
  it("Sedentario: TMB × 1.2", () => {
    expect(calcularTDEE(TMB, "Sedentario")).toBeCloseTo(TMB * 1.2, 2)
  })

  it("LevementeAtivo: TMB × 1.375", () => {
    expect(calcularTDEE(TMB, "LevementeAtivo")).toBeCloseTo(TMB * 1.375, 2)
  })

  it("ModeramenteAtivo: TMB × 1.55", () => {
    expect(calcularTDEE(TMB, "ModeramenteAtivo")).toBeCloseTo(TMB * 1.55, 2)
  })

  it("MuitoAtivo: TMB × 1.725", () => {
    expect(calcularTDEE(TMB, "MuitoAtivo")).toBeCloseTo(TMB * 1.725, 2)
  })

  it("ExtremamenteAtivo: TMB × 1.9", () => {
    expect(calcularTDEE(TMB, "ExtremamenteAtivo")).toBeCloseTo(TMB * 1.9, 2)
  })

  it("TDEE sempre maior que TMB (todos os fatores > 1)", () => {
    const fatores = ["Sedentario", "LevementeAtivo", "ModeramenteAtivo", "MuitoAtivo", "ExtremamenteAtivo"] as const
    fatores.forEach(f => expect(calcularTDEE(TMB, f)).toBeGreaterThan(TMB))
  })
})

describe("calcularKcalMeta", () => {
  // TDEE de referência: TMB × 1.55 (ModeramenteAtivo)
  const TDEE = TMB * 1.55 // 2749.3125

  it("Cutting: aplica déficit (kcal_meta < TDEE)", () => {
    const meta = calcularKcalMeta(TDEE, "Cutting")
    expect(meta).toBeLessThan(TDEE)
    // Déficit deve ser entre 10% e 25% (literatura: 15-20%, nosso valor: 18%)
    const deficit_pct = (TDEE - meta) / TDEE
    expect(deficit_pct).toBeGreaterThanOrEqual(0.10)
    expect(deficit_pct).toBeLessThanOrEqual(0.25)
  })

  it("Manutencao: sem ajuste (kcal_meta === TDEE)", () => {
    expect(calcularKcalMeta(TDEE, "Manutencao")).toBeCloseTo(TDEE, 4)
  })

  it("Bulk: aplica superávit (kcal_meta > TDEE)", () => {
    const meta = calcularKcalMeta(TDEE, "Bulk")
    expect(meta).toBeGreaterThan(TDEE)
    // Superávit deve ser entre 5% e 20% (lean bulk: 12%)
    const superavit_pct = (meta - TDEE) / TDEE
    expect(superavit_pct).toBeGreaterThanOrEqual(0.05)
    expect(superavit_pct).toBeLessThanOrEqual(0.20)
  })

  it("Recomposicao: sem ajuste calórico (igual a Manutencao)", () => {
    expect(calcularKcalMeta(TDEE, "Recomposicao"))
      .toBeCloseTo(calcularKcalMeta(TDEE, "Manutencao"), 4)
  })

  it("Cutting < Manutencao < Bulk", () => {
    const cutting    = calcularKcalMeta(TDEE, "Cutting")
    const manutencao = calcularKcalMeta(TDEE, "Manutencao")
    const bulk       = calcularKcalMeta(TDEE, "Bulk")
    expect(cutting).toBeLessThan(manutencao)
    expect(manutencao).toBeLessThan(bulk)
  })

  it("resultado é sempre positivo", () => {
    const objetivos = ["Cutting", "Manutencao", "Bulk", "Recomposicao"] as const
    objetivos.forEach(o => expect(calcularKcalMeta(TDEE, o)).toBeGreaterThan(0))
  })
})
