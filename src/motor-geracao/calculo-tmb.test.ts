import { describe, it, expect } from "vitest"
import { calcularTMB } from "./calculo-tmb"

describe("calcularTMB — Mifflin-St Jeor", () => {
  // ─── Valores de referência calculados manualmente ──────────────────────────
  // Fórmula: (10 × peso) + (6.25 × altura) − (5 × idade) + constante
  // Masculino: constante = +5     Feminino: constante = −161

  it("homem padrão: 80 kg / 175 cm / 25 anos", () => {
    // (10×80) + (6.25×175) − (5×25) + 5 = 800 + 1093.75 − 125 + 5 = 1773.75
    expect(calcularTMB({ peso_kg: 80, altura_cm: 175, idade: 25, sexo: "M" }))
      .toBeCloseTo(1773.75, 2)
  })

  it("mulher padrão: 60 kg / 162 cm / 28 anos", () => {
    // (10×60) + (6.25×162) − (5×28) − 161 = 600 + 1012.5 − 140 − 161 = 1311.5
    expect(calcularTMB({ peso_kg: 60, altura_cm: 162, idade: 28, sexo: "F" }))
      .toBeCloseTo(1311.5, 2)
  })

  it("diferença M/F com inputs idênticos é exatamente 166 kcal", () => {
    // A única diferença entre as fórmulas é a constante: +5 vs −161 → Δ = 166
    const inputs = { peso_kg: 70, altura_cm: 170, idade: 30 }
    const homem  = calcularTMB({ ...inputs, sexo: "M" })
    const mulher = calcularTMB({ ...inputs, sexo: "F" })
    expect(homem - mulher).toBeCloseTo(166, 5)
  })

  it("TMB cresce com peso (mesma altura/idade/sexo)", () => {
    const base = { altura_cm: 175, idade: 30, sexo: "M" as const }
    expect(calcularTMB({ ...base, peso_kg: 90 }))
      .toBeGreaterThan(calcularTMB({ ...base, peso_kg: 70 }))
  })

  it("TMB decresce com idade (mesmo peso/altura/sexo)", () => {
    const base = { peso_kg: 80, altura_cm: 175, sexo: "M" as const }
    expect(calcularTMB({ ...base, idade: 25 }))
      .toBeGreaterThan(calcularTMB({ ...base, idade: 45 }))
  })

  it("caso extremo: atleta pesado — 120 kg / 190 cm / 40 anos / M", () => {
    // (10×120) + (6.25×190) − (5×40) + 5 = 1200 + 1187.5 − 200 + 5 = 2192.5
    expect(calcularTMB({ peso_kg: 120, altura_cm: 190, idade: 40, sexo: "M" }))
      .toBeCloseTo(2192.5, 2)
  })

  it("caso extremo: pessoa pequena — 50 kg / 155 cm / 20 anos / F", () => {
    // (10×50) + (6.25×155) − (5×20) − 161 = 500 + 968.75 − 100 − 161 = 1207.75
    expect(calcularTMB({ peso_kg: 50, altura_cm: 155, idade: 20, sexo: "F" }))
      .toBeCloseTo(1207.75, 2)
  })

  it("retorna número positivo para inputs válidos", () => {
    const tmb = calcularTMB({ peso_kg: 65, altura_cm: 168, idade: 35, sexo: "F" })
    expect(tmb).toBeGreaterThan(0)
  })
})
