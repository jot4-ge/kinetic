// Motor de Geração — Etapa 1: cálculo determinístico (ADR-0005)
// Etapa 2: seleção do Banco de Opções (pendente de aprovação do usuário)

export { calcularTMB }                                                         from "./calculo-tmb"
export { calcularTDEE, calcularKcalMeta, FATORES_ATIVIDADE, AJUSTES_OBJETIVO } from "./calculo-calorico"
export { calcularMacros, PROTEINA_G_POR_KG, GORDURA_MIN_G_POR_KG }            from "./calculo-macros"

import type { Macros, ObjetivoDePlano, FatorAtividade } from "@/types/domain"
import { calcularTMB }                from "./calculo-tmb"
import { calcularTDEE, calcularKcalMeta } from "./calculo-calorico"
import { calcularMacros }             from "./calculo-macros"

export interface ResultadoNutricional {
  readonly tmb_kcal:  number
  readonly tdee_kcal: number
  readonly kcal_meta: number
  readonly macros:    Macros
}

export interface EntradaCalculo {
  readonly peso_kg:         number
  readonly altura_cm:       number
  readonly idade:           number
  readonly sexo:            "M" | "F"
  readonly fator_atividade: FatorAtividade
  readonly objetivo:        ObjetivoDePlano
}

export function calcularNutricao(entrada: EntradaCalculo): ResultadoNutricional {
  const tmb_kcal  = calcularTMB(entrada)
  const tdee_kcal = calcularTDEE(tmb_kcal, entrada.fator_atividade)
  const kcal_meta = calcularKcalMeta(tdee_kcal, entrada.objetivo)
  const macros    = calcularMacros({ kcal_meta, peso_kg: entrada.peso_kg, objetivo: entrada.objetivo })
  return { tmb_kcal, tdee_kcal, kcal_meta, macros }
}
