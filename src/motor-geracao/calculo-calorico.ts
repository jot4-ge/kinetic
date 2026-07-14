import type { FatorAtividade, ObjetivoDePlano } from "@/types/domain"

// Harris-Benedict activity multipliers (McArdle et al., 2001)
export const FATORES_ATIVIDADE: Readonly<Record<FatorAtividade, number>> = {
  Sedentario:        1.2,
  LevementeAtivo:    1.375,
  ModeramenteAtivo:  1.55,
  MuitoAtivo:        1.725,
  ExtremamenteAtivo: 1.9,
} as const

// Caloric adjustment relative to TDEE.
// Cutting:     −18% — center of the evidence-based 15-20% deficit range
// Bulk:        +12% — lean bulk to limit fat gain while supporting hypertrophy
// Recomposicao:  0% — isocaloric; macro split differs (see calculo-macros)
export const AJUSTES_OBJETIVO: Readonly<Record<ObjetivoDePlano, number>> = {
  Cutting:      -0.18,
  Manutencao:    0,
  Bulk:          0.12,
  Recomposicao:  0,
} as const

export function calcularTDEE(tmb: number, fator: FatorAtividade): number {
  return tmb * FATORES_ATIVIDADE[fator]
}

export function calcularKcalMeta(tdee: number, objetivo: ObjetivoDePlano): number {
  return tdee * (1 + AJUSTES_OBJETIVO[objetivo])
}
