// Banco de Opções — public interface
//
// All other modules (Motor de Geração, seeds, tests) import from "@/banco-opcoes".
// Internal file structure (exercicios.ts, refeicoes.ts) is an implementation detail.

// Flat list for seeding STORE_EXERCICIOS on first launch
export { BANCO_EXERCICIOS } from "./exercicios"

// Named exercise exports for Motor de Geração to reference specific exercises
// by variable (avoiding string ID lookups in hot paths)
export {
  supino_reto_barra,
  supino_inclinado_pesado,
  crucifixo_inclinado,
  peck_deck_volume,
  crossover_alto,
  supino_inclinado_pump,
  crossover_baixo,
  flexao_lenta,
  peck_deck_pump,
  triceps_pulley,
  triceps_testa,
  puxada_larga,
  puxada_neutra,
  remada_curvada,
  remada_unilateral,
  pullover_haltere,
  remada_maquina,
  pullover_polia,
  rosca_direta,
  rosca_concentrada,
  rosca_martelo,
  rosca_21,
  rosca_spider,
  rosca_cabo_unilateral,
  arnold_press,
  elevacao_lateral_drop,
  elevacao_lateral_cabo,
  elevacao_frontal_alt,
  crucifixo_inverso,
  face_pull,
  encolhimento_ombros,
  agachamento_livre,
  leg_press,
  hack_squat,
  cadeira_extensora,
  stiff_romeno,
  mesa_flexora,
  panturrilha_em_pe,
  abdominal_crunch_maquina,
  abdominal_remador,
  prancha_lateral,
  abdominal_infra,
  abdominal_bicicleta,
} from "./exercicios"

// Refeicao[] templates by day type — Motor de Geração picks the right one
// when assembling a Plano for a given day's schedule.
export { REFEICOES_CEDO, REFEICOES_TARDE, REFEICOES_SABADO } from "./refeicoes"
