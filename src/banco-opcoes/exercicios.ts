// Banco de Opções — Exercicios
//
// Source: legacy/script.js (treinoData array)
// 43 unique Exercicio records after deduplication.
// "Puxada frontal pegada larga" appears in both Terça and Sábado sessions
// with identical prescriptions → one record, referenced by two SessaoTreino.
//
// A/A2, B/B2 labels in the legacy week schedule are DIFFERENT TRAINING DAYS,
// not alternatives within the same slot. Each maps to its own SessaoTreino
// in the Plano; the Exercicio records here are referenced by both.

import type { Exercicio, ExercicioId } from "@/types"

const eid = (s: string): ExercicioId => s as ExercicioId

// ─── Peito ────────────────────────────────────────────────────────────────────

const supino_reto_barra: Exercicio = {
  id: eid("supino-reto-barra"),
  nome: "Supino reto com barra",
  grupos_musculares: ["Peito"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 6, max: 8 },
}

const supino_inclinado_pesado: Exercicio = {
  id: eid("supino-inclinado-pesado"),
  nome: "Supino inclinado com halteres",
  grupos_musculares: ["Peito"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 8, max: 10 },
}

const crucifixo_inclinado: Exercicio = {
  id: eid("crucifixo-inclinado"),
  nome: "Crucifixo inclinado com halteres",
  grupos_musculares: ["Peito"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

const peck_deck_volume: Exercicio = {
  id: eid("peck-deck-volume"),
  nome: "Peck deck / fly na máquina",
  grupos_musculares: ["Peito"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

const crossover_alto: Exercicio = {
  id: eid("crossover-alto"),
  nome: "Cross-over cabo (contração alta)",
  grupos_musculares: ["Peito"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 15, max: 20 },
}

// Pump Day variant: same movement, lighter/higher-rep prescription
const supino_inclinado_pump: Exercicio = {
  id: eid("supino-inclinado-pump"),
  nome: "Supino inclinado com halteres (contração total)",
  grupos_musculares: ["Peito"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

const crossover_baixo: Exercicio = {
  id: eid("crossover-baixo"),
  nome: "Cross-over cabo (baixo para cima)",
  grupos_musculares: ["Peito"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 15, max: 20 },
}

// Falha variant — "máximo" in legacy
const flexao_lenta: Exercicio = {
  id: eid("flexao-lenta"),
  nome: "Flexão de braço lenta (3s descida)",
  grupos_musculares: ["Peito", "Triceps"],
  series: 3,
  repeticao: { tipo: "Falha" },
}

// Pump Day: fixed 15 reps (vs. Faixa 12~15 on the volume day)
const peck_deck_pump: Exercicio = {
  id: eid("peck-deck-pump"),
  nome: "Peck deck (squeeze no pico)",
  grupos_musculares: ["Peito"],
  series: 3,
  repeticao: { tipo: "Fixo", valor: 15 },
}

// ─── Tríceps ──────────────────────────────────────────────────────────────────

const triceps_pulley: Exercicio = {
  id: eid("triceps-pulley-corda"),
  nome: "Tríceps pulley (corda) — superset",
  grupos_musculares: ["Triceps"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

const triceps_testa: Exercicio = {
  id: eid("triceps-testa"),
  nome: "Tríceps testa haltere unilateral",
  grupos_musculares: ["Triceps"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

// ─── Costas ───────────────────────────────────────────────────────────────────

// Used in BOTH Terça (B) and Sábado (Finisher) — same prescription, same ID
const puxada_larga: Exercicio = {
  id: eid("puxada-larga"),
  nome: "Puxada frontal pegada larga (foco dorsais)",
  grupos_musculares: ["Costas"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 8, max: 10 },
}

const puxada_neutra: Exercicio = {
  id: eid("puxada-neutra-fechada"),
  nome: "Puxada neutra pegada fechada",
  grupos_musculares: ["Costas"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

const remada_curvada: Exercicio = {
  id: eid("remada-curvada"),
  nome: "Remada curvada (cotovelo para fora — foco V-taper)",
  grupos_musculares: ["Costas"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 8, max: 10 },
}

const remada_unilateral: Exercicio = {
  id: eid("remada-unilateral"),
  nome: "Remada unilateral com haltere",
  grupos_musculares: ["Costas"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

const pullover_haltere: Exercicio = {
  id: eid("pullover-haltere"),
  nome: "Pull-over com haltere (alongamento dorsal)",
  grupos_musculares: ["Costas"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

// Sábado finisher — machine variant, different from remada_curvada
const remada_maquina: Exercicio = {
  id: eid("remada-maquina"),
  nome: "Remada máquina (chest supported)",
  grupos_musculares: ["Costas"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

// Cable variant — different equipment from pullover_haltere
const pullover_polia: Exercicio = {
  id: eid("pullover-polia"),
  nome: "Pull-over polia alta",
  grupos_musculares: ["Costas"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

// ─── Bíceps ───────────────────────────────────────────────────────────────────

const rosca_direta: Exercicio = {
  id: eid("rosca-direta-barra"),
  nome: "Rosca direta com barra (pico)",
  grupos_musculares: ["Biceps"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 8, max: 10 },
}

const rosca_concentrada: Exercicio = {
  id: eid("rosca-concentrada"),
  nome: "Rosca concentrada (contração)",
  grupos_musculares: ["Biceps"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

// "braquial" not in GrupoMuscular enum → mapped to Biceps
const rosca_martelo: Exercicio = {
  id: eid("rosca-martelo"),
  nome: "Rosca martelo (braquial)",
  grupos_musculares: ["Biceps"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

// "21 (7+7+7)" in legacy → Piramide with three 7-rep segments
const rosca_21: Exercicio = {
  id: eid("rosca-21-barra"),
  nome: "Rosca 21 com barra W",
  grupos_musculares: ["Biceps"],
  series: 3,
  repeticao: { tipo: "Piramide", sequencia: [7, 7, 7] },
}

const rosca_spider: Exercicio = {
  id: eid("rosca-spider-curl"),
  nome: "Rosca spider curl com haltere",
  grupos_musculares: ["Biceps"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

const rosca_cabo_unilateral: Exercicio = {
  id: eid("rosca-cabo-unilateral"),
  nome: "Rosca cabo unilateral (pico)",
  grupos_musculares: ["Biceps"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

// ─── Ombros ───────────────────────────────────────────────────────────────────

const arnold_press: Exercicio = {
  id: eid("arnold-press"),
  nome: "Desenvolvimento Arnold com halteres",
  grupos_musculares: ["Ombros"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 8, max: 10 },
}

// "12→15→20" in legacy → Piramide (ascending drop-set)
const elevacao_lateral_drop: Exercicio = {
  id: eid("elevacao-lateral-drop"),
  nome: "Elevação lateral com halteres (drop set)",
  grupos_musculares: ["Ombros"],
  series: 4,
  repeticao: { tipo: "Piramide", sequencia: [12, 15, 20] },
}

const elevacao_lateral_cabo: Exercicio = {
  id: eid("elevacao-lateral-cabo"),
  nome: "Elevação lateral na polia (cabo)",
  grupos_musculares: ["Ombros"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 15, max: 20 },
}

// "12" in legacy → Fixo
const elevacao_frontal_alt: Exercicio = {
  id: eid("elevacao-frontal-alt"),
  nome: "Elevação frontal alternada com halteres",
  grupos_musculares: ["Ombros"],
  series: 3,
  repeticao: { tipo: "Fixo", valor: 12 },
}

const crucifixo_inverso: Exercicio = {
  id: eid("crucifixo-inverso"),
  nome: "Crucifixo inverso (posterior 3D)",
  grupos_musculares: ["Ombros"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 15, max: 20 },
}

const face_pull: Exercicio = {
  id: eid("face-pull"),
  nome: "Face pull (saúde do manguito)",
  grupos_musculares: ["Ombros"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 15, max: 20 },
}

// "15" in legacy → Fixo
const encolhimento_ombros: Exercicio = {
  id: eid("encolhimento-ombros"),
  nome: "Encolhimento de ombros com halteres",
  grupos_musculares: ["Ombros"],
  series: 3,
  repeticao: { tipo: "Fixo", valor: 15 },
}

// ─── Pernas ───────────────────────────────────────────────────────────────────

const agachamento_livre: Exercicio = {
  id: eid("agachamento-livre"),
  nome: "Agachamento livre com barra (deep)",
  grupos_musculares: ["Quadriceps", "Gluteo"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 6, max: 8 },
}

const leg_press: Exercicio = {
  id: eid("leg-press-45"),
  nome: "Leg press 45° (pisada alta + larga)",
  grupos_musculares: ["Quadriceps", "Gluteo"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

const hack_squat: Exercicio = {
  id: eid("hack-squat"),
  nome: "Hack squat na máquina",
  grupos_musculares: ["Quadriceps"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 10, max: 12 },
}

const cadeira_extensora: Exercicio = {
  id: eid("cadeira-extensora"),
  nome: "Cadeira extensora (peak contraction)",
  grupos_musculares: ["Quadriceps"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

const stiff_romeno: Exercicio = {
  id: eid("stiff-romeno"),
  nome: "Stiff romeno com barra",
  grupos_musculares: ["Isquiotibiais", "Gluteo"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 8, max: 10 },
}

const mesa_flexora: Exercicio = {
  id: eid("mesa-flexora"),
  nome: "Mesa flexora",
  grupos_musculares: ["Isquiotibiais"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

const panturrilha_em_pe: Exercicio = {
  id: eid("panturrilha-em-pe"),
  nome: "Panturrilha em pé (carga máxima)",
  grupos_musculares: ["Panturrilha"],
  series: 5,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

// ─── Abdômen ──────────────────────────────────────────────────────────────────

const abdominal_crunch_maquina: Exercicio = {
  id: eid("abdominal-crunch-maquina"),
  nome: "Abdominal crunch na máquina (carga)",
  grupos_musculares: ["Abdomen"],
  series: 4,
  repeticao: { tipo: "Faixa", min: 12, max: 15 },
}

const abdominal_remador: Exercicio = {
  id: eid("abdominal-remador"),
  nome: "Abdominal remador (hollow body)",
  grupos_musculares: ["Abdomen"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 15, max: 20 },
}

// "30~45s" in legacy → Tempo (seconds)
const prancha_lateral: Exercicio = {
  id: eid("prancha-lateral"),
  nome: "Prancha lateral (cada lado)",
  grupos_musculares: ["Abdomen"],
  series: 3,
  repeticao: { tipo: "Tempo", min: 30, max: 45 },
}

const abdominal_infra: Exercicio = {
  id: eid("abdominal-infra"),
  nome: "Abdominal infra (elevação de pernas)",
  grupos_musculares: ["Abdomen"],
  series: 3,
  repeticao: { tipo: "Faixa", min: 15, max: 20 },
}

// "20" in legacy → Fixo
const abdominal_bicicleta: Exercicio = {
  id: eid("abdominal-bicicleta"),
  nome: "Abdominal bicicleta (oblíquo)",
  grupos_musculares: ["Abdomen"],
  series: 3,
  repeticao: { tipo: "Fixo", valor: 20 },
}

// ─── Export ───────────────────────────────────────────────────────────────────
// Flat list consumed by Motor de Geração and seeded into STORE_EXERCICIOS on
// first launch. Order is informational only — queries use ExercicioId FK.

export const BANCO_EXERCICIOS: Exercicio[] = [
  // Peito
  supino_reto_barra,
  supino_inclinado_pesado,
  crucifixo_inclinado,
  peck_deck_volume,
  crossover_alto,
  supino_inclinado_pump,
  crossover_baixo,
  flexao_lenta,
  peck_deck_pump,
  // Triceps
  triceps_pulley,
  triceps_testa,
  // Costas
  puxada_larga,
  puxada_neutra,
  remada_curvada,
  remada_unilateral,
  pullover_haltere,
  remada_maquina,
  pullover_polia,
  // Biceps
  rosca_direta,
  rosca_concentrada,
  rosca_martelo,
  rosca_21,
  rosca_spider,
  rosca_cabo_unilateral,
  // Ombros
  arnold_press,
  elevacao_lateral_drop,
  elevacao_lateral_cabo,
  elevacao_frontal_alt,
  crucifixo_inverso,
  face_pull,
  encolhimento_ombros,
  // Pernas
  agachamento_livre,
  leg_press,
  hack_squat,
  cadeira_extensora,
  stiff_romeno,
  mesa_flexora,
  panturrilha_em_pe,
  // Abdomen
  abdominal_crunch_maquina,
  abdominal_remador,
  prancha_lateral,
  abdominal_infra,
  abdominal_bicicleta,
]

// Named re-exports for Motor de Geração to reference specific exercises by ID
// when building SessaoTreino slots, without scanning BANCO_EXERCICIOS.
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
}
