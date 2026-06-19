import { describe, it, expect } from "vitest"
import { calcularMacros, PROTEINA_G_POR_KG, GORDURA_MIN_G_POR_KG } from "./calculo-macros"

// ─── Valores derivados do pipeline completo para 80kg / 175cm / 25y / M ──────
// TMB = 1773.75  TDEE (ModeramenteAtivo) = 2749.31
// Cutting:       kcal_meta = 2749.31 × 0.82 = 2254.44  → 2254
// Manutencao:    kcal_meta = 2749.31
// Bulk:          kcal_meta = 2749.31 × 1.12 = 3079.23  → 3079

const PESO = 80

// Helper: verifica invariante de consistência kcal ↔ gramas
function assertConsistencia(
  result: ReturnType<typeof calcularMacros>,
  label: string
) {
  const esperado = result.proteina_g * 4 + result.carboidrato_g * 4 + result.gordura_g * 9
  expect(result.kcal, `${label}: kcal deve ser consistente com gramas`).toBe(esperado)
}

describe("calcularMacros", () => {
  describe("Cutting (2254 kcal / 80 kg)", () => {
    const r = calcularMacros({ kcal_meta: 2254, peso_kg: PESO, objetivo: "Cutting" })

    it("proteína ≥ 1.8 g/kg (mínimo da literatura)", () => {
      expect(r.proteina_g).toBeGreaterThanOrEqual(PESO * 1.8)
    })

    it("proteína usa ratio 2.2 g/kg (Cutting)", () => {
      expect(r.proteina_g).toBeCloseTo(PESO * PROTEINA_G_POR_KG["Cutting"], 0)
    })

    it("gordura ≥ 0.7 g/kg (floor hormonal)", () => {
      expect(r.gordura_g).toBeGreaterThanOrEqual(PESO * 0.7)
    })

    it("gordura usa floor de GORDURA_MIN_G_POR_KG", () => {
      expect(r.gordura_g).toBeCloseTo(PESO * GORDURA_MIN_G_POR_KG, 0)
    })

    it("carboidrato é positivo", () => {
      expect(r.carboidrato_g).toBeGreaterThan(0)
    })

    it("kcal total é consistente com gramas (sem kcal fantasma)", () => {
      assertConsistencia(r, "Cutting")
    })

    it("kcal total próximo de kcal_meta (tolerância ±10 kcal por arredondamento)", () => {
      expect(Math.abs(r.kcal - 2254)).toBeLessThanOrEqual(10)
    })
  })

  describe("Manutencao (2749 kcal / 80 kg)", () => {
    const r = calcularMacros({ kcal_meta: 2749, peso_kg: PESO, objetivo: "Manutencao" })

    it("proteína usa ratio 2.0 g/kg (Manutencao)", () => {
      expect(r.proteina_g).toBeCloseTo(PESO * PROTEINA_G_POR_KG["Manutencao"], 0)
    })

    it("ratio de proteína < Cutting (2.0 vs 2.2)", () => {
      const cutting = calcularMacros({ kcal_meta: 2254, peso_kg: PESO, objetivo: "Cutting" })
      expect(r.proteina_g / PESO).toBeLessThan(cutting.proteina_g / PESO)
    })

    it("carboidrato > proteína (mais kcal disponíveis)", () => {
      expect(r.carboidrato_g * 4).toBeGreaterThan(r.proteina_g * 4)
    })

    it("kcal total é consistente com gramas", () => {
      assertConsistencia(r, "Manutencao")
    })
  })

  describe("Bulk (3079 kcal / 80 kg)", () => {
    const r = calcularMacros({ kcal_meta: 3079, peso_kg: PESO, objetivo: "Bulk" })

    it("proteína usa ratio 1.8 g/kg (Bulk)", () => {
      expect(r.proteina_g).toBeCloseTo(PESO * PROTEINA_G_POR_KG["Bulk"], 0)
    })

    it("ratio de proteína < Cutting (superávit suporta muscle growth)", () => {
      const cutting = calcularMacros({ kcal_meta: 2254, peso_kg: PESO, objetivo: "Cutting" })
      expect(r.proteina_g).toBeLessThan(cutting.proteina_g)
    })

    it("carboidrato maior que em Manutencao (mais kcal para treino)", () => {
      const manu = calcularMacros({ kcal_meta: 2749, peso_kg: PESO, objetivo: "Manutencao" })
      expect(r.carboidrato_g).toBeGreaterThan(manu.carboidrato_g)
    })

    it("kcal total é consistente com gramas", () => {
      assertConsistencia(r, "Bulk")
    })
  })

  describe("Recomposicao (2749 kcal / 80 kg)", () => {
    const r = calcularMacros({ kcal_meta: 2749, peso_kg: PESO, objetivo: "Recomposicao" })

    it("proteína igual ao Cutting (preservação muscular prioritária)", () => {
      // Recomposicao usa o mesmo ratio de proteína que Cutting (2.2 g/kg)
      expect(PROTEINA_G_POR_KG["Recomposicao"]).toBe(PROTEINA_G_POR_KG["Cutting"])
      expect(r.proteina_g).toBeCloseTo(PESO * 2.2, 0)
    })

    it("kcal total é consistente com gramas", () => {
      assertConsistencia(r, "Recomposicao")
    })
  })

  describe("invariantes de saúde em todos os objetivos", () => {
    const objetivos = ["Cutting", "Manutencao", "Bulk", "Recomposicao"] as const

    it("proteína nunca abaixo de 1.6 g/kg (mínimo absoluto da literatura)", () => {
      objetivos.forEach(obj => {
        const r = calcularMacros({ kcal_meta: 2500, peso_kg: PESO, objetivo: obj })
        expect(r.proteina_g, `${obj}: proteína mínima`).toBeGreaterThanOrEqual(PESO * 1.6)
      })
    })

    it("gordura nunca abaixo de 0.5 g/kg", () => {
      objetivos.forEach(obj => {
        const r = calcularMacros({ kcal_meta: 2500, peso_kg: PESO, objetivo: obj })
        expect(r.gordura_g, `${obj}: gordura mínima`).toBeGreaterThanOrEqual(PESO * 0.5)
      })
    })

    it("carboidrato nunca negativo", () => {
      objetivos.forEach(obj => {
        const r = calcularMacros({ kcal_meta: 2500, peso_kg: PESO, objetivo: obj })
        expect(r.carboidrato_g, `${obj}: carb não negativo`).toBeGreaterThanOrEqual(0)
      })
    })

    it("kcal sempre consistente com gramas", () => {
      objetivos.forEach(obj => {
        const r = calcularMacros({ kcal_meta: 2500, peso_kg: PESO, objetivo: obj })
        assertConsistencia(r, obj)
      })
    })
  })

  describe("caso extremo: kcal_meta muito baixa", () => {
    it("carboidrato não fica negativo quando proteína+gordura supera kcal_meta", () => {
      // 80kg → proteina=176g(704kcal) + gordura=64g(576kcal) = 1280kcal mínimo
      // Se kcal_meta < 1280, carb seria negativo — deve cair para 0
      const r = calcularMacros({ kcal_meta: 900, peso_kg: PESO, objetivo: "Cutting" })
      expect(r.carboidrato_g).toBeGreaterThanOrEqual(0)
      assertConsistencia(r, "kcal baixa")
    })
  })

  describe("invariante principal: kcal = proteina×4 + carb×4 + gordura×9", () => {
    it("satisfeito para uma varredura ampla de inputs", () => {
      const casos = [
        { kcal_meta: 1500, peso_kg: 55, objetivo: "Cutting" as const },
        { kcal_meta: 2000, peso_kg: 70, objetivo: "Manutencao" as const },
        { kcal_meta: 3200, peso_kg: 90, objetivo: "Bulk" as const },
        { kcal_meta: 2400, peso_kg: 65, objetivo: "Recomposicao" as const },
        { kcal_meta: 1800, peso_kg: 100, objetivo: "Cutting" as const },
      ]
      casos.forEach(caso => {
        const r = calcularMacros(caso)
        assertConsistencia(r, JSON.stringify(caso))
      })
    })
  })
})
