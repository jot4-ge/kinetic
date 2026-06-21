import { describe, it, expect } from "vitest"
import { montarConteudoDoPlano } from "./montar-plano"
import type { EntradaMontagem } from "./montar-plano"
import type { Macros } from "@/types"

// ─── Fixture: ResultadoNutricional típico (80kg, MuitoAtivo, Cutting) ─────────
// Derivado do pipeline Etapa 1: TMB=1773.75, TDEE=3059.72, kcal_meta=2508.97

const MACROS_CUTTING: Macros = {
  kcal:           2508,   // from calcularMacros (aproximado)
  proteina_g:     176,
  carboidrato_g:  245,
  gordura_g:       64,
}

const ENTRADA_PADRAO: EntradaMontagem = {
  kcal_meta: 2508.97,
  macros:    MACROS_CUTTING,
  objetivo:  "Cutting",
  peso_kg:   80,
  // dias_treino e dias_jj omitidos → defaults serão aplicados
}

describe("montarConteudoDoPlano", () => {
  const plano = montarConteudoDoPlano(ENTRADA_PADRAO)

  describe("meta calórica e macros", () => {
    it("meta_calorica_diaria é Math.round(kcal_meta)", () => {
      expect(plano.meta_calorica_diaria).toBe(Math.round(2508.97))
    })

    it("meta_proteina_diaria_g corresponde às macros da Etapa 1", () => {
      expect(plano.meta_proteina_diaria_g).toBe(MACROS_CUTTING.proteina_g)
    })

    it("meta_carboidrato_diaria_g corresponde às macros da Etapa 1", () => {
      expect(plano.meta_carboidrato_diaria_g).toBe(MACROS_CUTTING.carboidrato_g)
    })

    it("meta_gordura_diaria_g corresponde às macros da Etapa 1", () => {
      expect(plano.meta_gordura_diaria_g).toBe(MACROS_CUTTING.gordura_g)
    })

    it("objetivo é preservado", () => {
      expect(plano.objetivo).toBe("Cutting")
    })
  })

  describe("meta de hidratação", () => {
    it("meta_agua_diaria_ml = 35 × peso_kg", () => {
      expect(plano.meta_agua_diaria_ml).toBe(35 * 80)
    })

    it("escala com o peso: 60 kg → 2100 ml", () => {
      const resultado = montarConteudoDoPlano({ ...ENTRADA_PADRAO, peso_kg: 60 })
      expect(resultado.meta_agua_diaria_ml).toBe(35 * 60)
    })
  })

  describe("refeições", () => {
    it("usa REFEICOES_CEDO como template canônico (6 refeições)", () => {
      expect(plano.refeicoes.length).toBe(6)
    })

    it("cada refeição tem exatamente 1 opção selecionada", () => {
      plano.refeicoes.forEach(r => expect(r.opcoes.length).toBe(1))
    })

    it("refeições têm os IDs esperados do template CEDO", () => {
      const ids = plano.refeicoes.map(r => r.id)
      expect(ids).toContain("cafe-da-manha")
      expect(ids).toContain("lanche")
      expect(ids).toContain("almoco")
      expect(ids).toContain("pre-treino")
      expect(ids).toContain("jantar")
      expect(ids).toContain("ceia")
    })

    it("kcal total das refeições é razoável (±300 kcal da meta)", () => {
      const totalKcal = plano.refeicoes.reduce((acc, r) => acc + r.opcoes[0].macros.kcal, 0)
      expect(Math.abs(totalKcal - 2508)).toBeLessThanOrEqual(300)
    })
  })

  describe("sessões de treino (defaults)", () => {
    it("defaults produzem 5 sessões (Seg/Ter/Qua/Qui/Sab)", () => {
      expect(plano.sessoes_treino.length).toBe(5)
    })

    it("Segunda tem tem_jj=true (JJ padrão é Seg/Qua/Sex)", () => {
      const seg = plano.sessoes_treino.find(s => s.dia_da_semana === "Segunda")!
      expect(seg).toBeDefined()
      expect(seg.tem_jj).toBe(true)
    })

    it("Quarta tem tem_jj=true", () => {
      const qua = plano.sessoes_treino.find(s => s.dia_da_semana === "Quarta")!
      expect(qua.tem_jj).toBe(true)
    })

    it("Terça tem tem_jj=false", () => {
      const ter = plano.sessoes_treino.find(s => s.dia_da_semana === "Terca")!
      expect(ter.tem_jj).toBe(false)
    })

    it("Sábado tem tem_jj=false", () => {
      const sab = plano.sessoes_treino.find(s => s.dia_da_semana === "Sabado")!
      expect(sab.tem_jj).toBe(false)
    })

    it("Sexta não aparece em sessoes_treino (JJ only, sem academia)", () => {
      const sex = plano.sessoes_treino.find(s => s.dia_da_semana === "Sexta")
      expect(sex).toBeUndefined()
    })
  })

  describe("checklist", () => {
    it("checklist_template não está vazio", () => {
      expect(plano.checklist_template.length).toBeGreaterThan(0)
    })

    it("IDs de checklist são únicos", () => {
      const ids = plano.checklist_template.map(c => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("cada item tem descricao não vazia", () => {
      plano.checklist_template.forEach(c => {
        expect(c.descricao.trim().length).toBeGreaterThan(0)
      })
    })
  })

  describe("customização de dias", () => {
    it("dias_treino customizados são respeitados", () => {
      const resultado = montarConteudoDoPlano({
        ...ENTRADA_PADRAO,
        dias_treino: ["Segunda", "Quarta"],
      })
      expect(resultado.sessoes_treino.length).toBe(2)
    })

    it("dias_jj customizados são respeitados", () => {
      const resultado = montarConteudoDoPlano({
        ...ENTRADA_PADRAO,
        dias_jj: [],
      })
      resultado.sessoes_treino.forEach(s => expect(s.tem_jj).toBe(false))
    })

    it("Bulk com kcal maior seleciona opções de maior kcal", () => {
      const bulk = montarConteudoDoPlano({
        ...ENTRADA_PADRAO,
        kcal_meta: 3200,
        objetivo: "Bulk",
        macros: { kcal: 3200, proteina_g: 144, carboidrato_g: 460, gordura_g: 64 },
      })
      // Com 3200/6 = 533 kcal por slot, deve selecionar opções de maior kcal
      const cuttingTotal = plano.refeicoes.reduce((a, r) => a + r.opcoes[0].macros.kcal, 0)
      const bulkTotal    = bulk.refeicoes.reduce((a, r) => a + r.opcoes[0].macros.kcal, 0)
      expect(bulkTotal).toBeGreaterThanOrEqual(cuttingTotal)
    })
  })

  describe("determinismo", () => {
    it("mesmos inputs → exatamente o mesmo Plano (JSON stringify)", () => {
      const p1 = montarConteudoDoPlano(ENTRADA_PADRAO)
      const p2 = montarConteudoDoPlano(ENTRADA_PADRAO)
      expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))
    })
  })
})
