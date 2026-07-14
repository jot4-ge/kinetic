import { describe, it, expect } from "vitest"
import { montarConteudoDoPlano } from "./montar-plano"
import type { EntradaMontagem } from "./montar-plano"
import type { Macros, PerfilDeRefeicao } from "@/types"

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

  describe("perfis de refeição (ADR-0012)", () => {
    it("plano contém 4 perfis de dia", () => {
      expect(plano.perfis_refeicao.length).toBe(4)
    })

    it("todos os 7 dias da semana têm exatamente um perfil", () => {
      const diasCobertos = plano.perfis_refeicao.flatMap(p => [...p.dias])
      expect(diasCobertos.length).toBe(7)
      expect(new Set(diasCobertos).size).toBe(7)
    })

    it("Seg/Qua/Qui compartilham o perfil CEDO com 6 refeições", () => {
      const perfilCedo = plano.perfis_refeicao.find(p => p.dias.includes("Segunda"))!
      expect(perfilCedo).toBeDefined()
      expect(perfilCedo.dias).toEqual(expect.arrayContaining(["Segunda", "Quarta", "Quinta"]))
      expect(perfilCedo.refeicoes.length).toBe(6)
    })

    it("perfil CEDO tem os IDs esperados (cafe, lanche, almoco, pre-treino, jantar, ceia)", () => {
      const perfilCedo = plano.perfis_refeicao.find(p => p.dias.includes("Segunda"))!
      const ids = perfilCedo.refeicoes.map(r => r.id)
      expect(ids).toContain("cafe-da-manha")
      expect(ids).toContain("lanche")
      expect(ids).toContain("almoco")
      expect(ids).toContain("pre-treino")
      expect(ids).toContain("jantar")
      expect(ids).toContain("ceia")
    })

    it("Terça tem perfil próprio com 4 refeições e sem pré-treino", () => {
      const perfilTerca = plano.perfis_refeicao.find(p => p.dias.includes("Terca"))!
      expect(perfilTerca).toBeDefined()
      expect(perfilTerca.dias).toEqual(["Terca"])
      expect(perfilTerca.refeicoes.length).toBe(4)
      expect(perfilTerca.refeicoes.map(r => r.id)).not.toContain("pre-treino")
    })

    it("Sexta tem perfil próprio com 5 refeições e pré-treino JJ", () => {
      const perfilSexta = plano.perfis_refeicao.find(p => p.dias.includes("Sexta"))!
      expect(perfilSexta).toBeDefined()
      expect(perfilSexta.dias).toEqual(["Sexta"])
      expect(perfilSexta.refeicoes.length).toBe(5)
      expect(perfilSexta.refeicoes.map(r => r.id)).toContain("pre-treino")
    })

    it("Sáb/Dom compartilham o perfil FIM_DE_SEMANA com 4 refeições", () => {
      const perfilFDS = plano.perfis_refeicao.find(p => p.dias.includes("Sabado"))!
      expect(perfilFDS).toBeDefined()
      expect(perfilFDS.dias).toEqual(expect.arrayContaining(["Sabado", "Domingo"]))
      expect(perfilFDS.refeicoes.length).toBe(4)
    })

    it("cada refeição em todos os perfis tem exatamente 1 opção selecionada", () => {
      plano.perfis_refeicao.forEach(perfil => {
        perfil.refeicoes.forEach(r => expect(r.opcoes.length).toBe(1))
      })
    })

    it("kcal total do perfil CEDO é razoável (±300 kcal da meta)", () => {
      const perfilCedo = plano.perfis_refeicao.find(p => p.dias.includes("Segunda"))!
      const total = perfilCedo.refeicoes.reduce((acc, r) => acc + r.opcoes[0].macros.kcal, 0)
      expect(Math.abs(total - 2508)).toBeLessThanOrEqual(300)
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

    it("Bulk com kcal maior seleciona opções de maior kcal (comparando perfil CEDO)", () => {
      const bulk = montarConteudoDoPlano({
        ...ENTRADA_PADRAO,
        kcal_meta: 3200,
        objetivo: "Bulk",
        macros: { kcal: 3200, proteina_g: 144, carboidrato_g: 460, gordura_g: 64 },
      })
      const totalKcalPerfil = (perfis: readonly PerfilDeRefeicao[], dia: string) =>
        perfis.find(p => p.dias.includes(dia as never))
              ?.refeicoes.reduce((a, r) => a + r.opcoes[0].macros.kcal, 0) ?? 0
      const cuttingTotal = totalKcalPerfil(plano.perfis_refeicao, "Segunda")
      const bulkTotal    = totalKcalPerfil(bulk.perfis_refeicao,  "Segunda")
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
