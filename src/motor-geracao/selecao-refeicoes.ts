import type { Refeicao, OpcaoDeRefeicao } from "@/types"

// Selects the OpcaoDeRefeicao whose kcal is closest to kcal_alvo_slot.
// Tiebreak rule: first occurrence in the opcoes array (Banco declaration order).
// This guarantees determinism: same Banco → same choice — auditable and reproducible.
export function selecionarOpcao(
  refeicao: Refeicao,
  kcal_alvo_slot: number
): OpcaoDeRefeicao {
  return refeicao.opcoes.reduce((melhor, atual) => {
    const diff_melhor = Math.abs(melhor.macros.kcal - kcal_alvo_slot)
    const diff_atual  = Math.abs(atual.macros.kcal  - kcal_alvo_slot)
    // Strictly less than: on exact tie, melhor (earlier in array) wins.
    return diff_atual < diff_melhor ? atual : melhor
  })
}

// Builds a Refeicao[] from a template, selecting ONE OpcaoDeRefeicao per
// slot by proximity to an equal share of the daily caloric target.
//
// Equal distribution rationale: the Banco was curated with roughly equal-kcal
// slots, so equal share is a good first approximation. The result is auditable:
// "chose the option closest to kcal_meta ÷ n_refeições for this slot."
export function montarRefeicoes(
  template: readonly Refeicao[],
  kcal_meta_diaria: number
): readonly Refeicao[] {
  const kcal_por_slot = kcal_meta_diaria / template.length
  return template.map(refeicao => ({
    ...refeicao,
    opcoes: [selecionarOpcao(refeicao, kcal_por_slot)],
  }))
}
