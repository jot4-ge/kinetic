import type { Macros, ObjetivoDePlano } from "@/types/domain"

// Protein ratios (g per kg bodyweight) — protein-first, evidence-based.
// Cutting/Recomposicao: 2.2 g/kg — higher ratio preserves lean mass in deficit.
// Manutencao:           2.0 g/kg — sufficient for maintenance and adaptation.
// Bulk:                 1.8 g/kg — lower ratio; caloric surplus itself drives MPS.
export const PROTEINA_G_POR_KG: Readonly<Record<ObjetivoDePlano, number>> = {
  Cutting:      2.2,
  Manutencao:   2.0,
  Bulk:         1.8,
  Recomposicao: 2.2,
} as const

// Minimum dietary fat floor — 0.8 g/kg supports hormonal health above the
// published 0.6-0.7 g/kg minimum, leaving a buffer before the physiological floor.
export const GORDURA_MIN_G_POR_KG = 0.8

export function calcularMacros(entrada: {
  readonly kcal_meta: number
  readonly peso_kg: number
  readonly objetivo: ObjetivoDePlano
}): Macros {
  const { kcal_meta, peso_kg, objetivo } = entrada

  const proteina_g = Math.round(peso_kg * PROTEINA_G_POR_KG[objetivo])
  const gordura_g  = Math.round(peso_kg * GORDURA_MIN_G_POR_KG)

  const proteina_kcal = proteina_g * 4
  const gordura_kcal  = gordura_g * 9
  const carb_kcal     = kcal_meta - proteina_kcal - gordura_kcal
  const carboidrato_g = Math.max(0, Math.round(carb_kcal / 4))

  // kcal is derived from actual gram values (not kcal_meta) so the object is
  // internally consistent despite integer rounding (≤±10 kcal drift from target).
  const kcal = proteina_g * 4 + carboidrato_g * 4 + gordura_g * 9

  return { kcal, proteina_g, carboidrato_g, gordura_g }
}
