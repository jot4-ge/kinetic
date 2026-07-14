// Banco de Opções — Divisão semanal de treinos
//
// Source: legacy/script.js (treinoData) + comentários em exercicios.ts.
// Split A/A2/B/B2/C inferido dos labels do legado e das anotações de grupos
// musculares. Sexta é exclusivamente JJ — sem SessaoTreinoTemplate para Sex.
//
// Cada SlotDeExercicio contém OpcaoDeExercicio alternativas (o Usuário escolhe
// uma ao logar). Slots de múltiplos exercícios = opções equivalentes para o
// mesmo movimento (ex: supino barra vs. supino halter quando barra indisponível).
//
// Motor de Geração lê SESSOES_SEMANA e filtra por dias_treino do Usuário,
// depois adiciona tem_jj baseado em dias_jj.

import type {
  DiaDaSemana,
  SlotDeExercicio,
  OpcaoDeExercicio,
  Exercicio,
} from "@/types"
import {
  supino_reto_barra, supino_inclinado_pesado,
  crucifixo_inclinado, peck_deck_volume, crossover_alto,
  supino_inclinado_pump, crossover_baixo, flexao_lenta, peck_deck_pump,
  triceps_pulley, triceps_testa,
  puxada_larga, puxada_neutra, remada_curvada, remada_unilateral,
  pullover_haltere, remada_maquina, pullover_polia,
  rosca_direta, rosca_concentrada, rosca_martelo, rosca_21, rosca_spider, rosca_cabo_unilateral,
  arnold_press, elevacao_lateral_drop, elevacao_lateral_cabo, elevacao_frontal_alt,
  crucifixo_inverso, face_pull, encolhimento_ombros,
  agachamento_livre, leg_press, hack_squat, cadeira_extensora,
  stiff_romeno, mesa_flexora, panturrilha_em_pe,
  abdominal_crunch_maquina, abdominal_remador, prancha_lateral,
  abdominal_infra, abdominal_bicicleta,
} from "./exercicios"

// Template sem tem_jj — o Motor define a flag baseado em dias_jj do Usuário.
export interface SessaoTreinoTemplate {
  readonly dia_da_semana: DiaDaSemana
  readonly slots: readonly SlotDeExercicio[]
}

function makeSlot(ordem: number, exercicios: readonly Exercicio[]): SlotDeExercicio {
  return {
    id:     `slot-${ordem}`,
    ordem,
    opcoes: exercicios.map((e): OpcaoDeExercicio => ({
      id:           e.id as string,  // ExercicioId as local slug (unique within slot)
      exercicio_id: e.id,
    })),
  }
}

// ─── Treino A — Segunda (Peito + Tríceps, volume/intensidade) ─────────────────
const SESSAO_A: SessaoTreinoTemplate = {
  dia_da_semana: "Segunda",
  slots: [
    makeSlot(1,  [supino_reto_barra, supino_inclinado_pesado]),  // heavy compound
    makeSlot(2,  [crucifixo_inclinado, peck_deck_volume]),       // chest isolation
    makeSlot(3,  [crossover_alto]),                               // cable finisher
    makeSlot(4,  [triceps_pulley]),                               // triceps main
    makeSlot(5,  [triceps_testa]),                                // triceps isolation
  ],
}

// ─── Treino B — Terça (Costas + Bíceps) ──────────────────────────────────────
// puxada_larga aparece aqui E no Sábado (Finisher); mesmo ExercicioId, dois slots.
const SESSAO_B: SessaoTreinoTemplate = {
  dia_da_semana: "Terca",
  slots: [
    makeSlot(1,  [puxada_larga]),                                          // vertical pull
    makeSlot(2,  [remada_curvada, remada_unilateral]),                     // horizontal row
    makeSlot(3,  [puxada_neutra]),                                         // close-grip pull
    makeSlot(4,  [pullover_haltere, pullover_polia]),                      // pullover
    makeSlot(5,  [rosca_direta, rosca_martelo]),                           // biceps compound
    makeSlot(6,  [rosca_21, rosca_concentrada, rosca_spider, rosca_cabo_unilateral]), // biceps iso
  ],
}

// ─── Treino A2 — Quarta (Peito pump — menor carga, maior contração) ──────────
const SESSAO_A2: SessaoTreinoTemplate = {
  dia_da_semana: "Quarta",
  slots: [
    makeSlot(1,  [supino_inclinado_pump]),  // incline pump variation
    makeSlot(2,  [crossover_baixo]),        // cable low-to-high
    makeSlot(3,  [flexao_lenta]),           // bodyweight (até a falha)
    makeSlot(4,  [peck_deck_pump]),         // peak contraction
  ],
}

// ─── Treino B2 — Quinta (Ombros) ─────────────────────────────────────────────
const SESSAO_B2: SessaoTreinoTemplate = {
  dia_da_semana: "Quinta",
  slots: [
    makeSlot(1,  [arnold_press]),                              // overhead compound
    makeSlot(2,  [elevacao_lateral_drop, elevacao_lateral_cabo]), // lateral raise
    makeSlot(3,  [elevacao_frontal_alt]),                      // frontal raise
    makeSlot(4,  [crucifixo_inverso]),                         // rear delt
    makeSlot(5,  [face_pull]),                                 // rotator cuff health
    makeSlot(6,  [encolhimento_ombros]),                       // trap
  ],
}

// ─── Treino C — Sábado (Pernas + Abdômen + Finisher Costas) ──────────────────
// Puxada_larga no finisher: mesma prescrição da Terça, referencia o mesmo ExercicioId.
const SESSAO_C: SessaoTreinoTemplate = {
  dia_da_semana: "Sabado",
  slots: [
    // Pernas
    makeSlot(1,  [agachamento_livre, leg_press]),   // quad compound
    makeSlot(2,  [hack_squat, cadeira_extensora]),  // quad isolation
    makeSlot(3,  [stiff_romeno]),                   // hamstring compound
    makeSlot(4,  [mesa_flexora]),                   // hamstring isolation
    makeSlot(5,  [panturrilha_em_pe]),              // calf
    // Abdômen
    makeSlot(6,  [abdominal_crunch_maquina, abdominal_remador]),  // abs weighted
    makeSlot(7,  [prancha_lateral, abdominal_infra]),             // abs lateral/infra
    makeSlot(8,  [abdominal_bicicleta]),                          // abs rotational
    // Finisher — Costas
    makeSlot(9,  [puxada_larga]),   // vertical pull (same as Terça — ADR: same ExercicioId)
    makeSlot(10, [remada_maquina]), // chest-supported row
    makeSlot(11, [pullover_polia]), // cable pullover (vs. pullover_haltere on Terça)
  ],
}

export const SESSOES_SEMANA: readonly SessaoTreinoTemplate[] = [
  SESSAO_A,   // Segunda
  SESSAO_B,   // Terça
  SESSAO_A2,  // Quarta
  SESSAO_B2,  // Quinta
  SESSAO_C,   // Sábado
]
