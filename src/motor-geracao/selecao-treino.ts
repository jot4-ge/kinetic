import type { DiaDaSemana, SessaoTreino } from "@/types"
import { SESSOES_SEMANA } from "@/banco-opcoes"

// Builds the SessaoTreino[] for the Plano by:
// 1. Filtering SESSOES_SEMANA to only the days in dias_treino.
//    Days in dias_treino that have no template (e.g. Sexta — JJ only, no gym)
//    are silently skipped.
// 2. Setting tem_jj=true for training days that are also JJ days.
//    (JJ-only days like Sexta have no SessaoTreino — jj_realizado is captured
//    per-day in RegistroDeAderencia, not in the Plano's training structure.)
export function montarSessoesTreino(
  dias_treino: readonly DiaDaSemana[],
  dias_jj:     readonly DiaDaSemana[],
): readonly SessaoTreino[] {
  return SESSOES_SEMANA
    .filter(template => dias_treino.includes(template.dia_da_semana))
    .map((template): SessaoTreino => ({
      id:             `sessao-${template.dia_da_semana.toLowerCase()}`,
      dia_da_semana:  template.dia_da_semana,
      slots:          template.slots,
      tem_jj:         dias_jj.includes(template.dia_da_semana),
    }))
}
