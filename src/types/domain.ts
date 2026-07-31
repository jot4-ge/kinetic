// ─── IDB Store name constants ─────────────────────────────────────────────────
// Import from here in src/persistencia/ — never use raw strings.

export const STORE_USUARIOS       = "usuarios"            as const
export const STORE_PLANOS         = "planos"              as const
export const STORE_EXERCICIOS     = "exercicios"          as const
export const STORE_REGISTROS      = "registros_aderencia" as const
export const STORE_REGISTROS_PESO = "registros_peso"      as const

// ─── Branded IDs (only for fields that cross IDB store boundaries) ────────────
// Internal IDs (slugs unique within a parent record) stay as plain string.

export type UsuarioId      = string & { readonly _brand: "UsuarioId" }
export type PlanoId        = string & { readonly _brand: "PlanoId" }
export type ExercicioId    = string & { readonly _brand: "ExercicioId" }
export type RegistroId     = string & { readonly _brand: "RegistroId" }
export type RegistroPesoId = string & { readonly _brand: "RegistroPesoId" }

// Temporal brands: prevent passing a full timestamp where only a date is expected.
export type ISODate      = string & { readonly _brand: "ISODate" }       // "YYYY-MM-DD"
export type ISOTimestamp = string & { readonly _brand: "ISOTimestamp" }  // ISO-8601 with time

// ─── Closed enums ─────────────────────────────────────────────────────────────

export type GrupoMuscular =
  | "Peito"
  | "Triceps"
  | "Costas"
  | "Biceps"
  | "Ombros"
  | "Quadriceps"
  | "Gluteo"
  | "Isquiotibiais"
  | "Panturrilha"
  | "Abdomen"

export type DiaDaSemana =
  | "Segunda"
  | "Terca"
  | "Quarta"
  | "Quinta"
  | "Sexta"
  | "Sabado"
  | "Domingo"

export type ObjetivoDePlano = "Cutting" | "Manutencao" | "Bulk" | "Recomposicao"

export type FatorAtividade =
  | "Sedentario"
  | "LevementeAtivo"
  | "ModeramenteAtivo"
  | "MuitoAtivo"
  | "ExtremamenteAtivo"

export type StatusDeRefeicao = "Seguiu" | "NaoSeguiu"

// ─── Repeticao — discriminated union (ADR-0009) ───────────────────────────────
// Five variants; exhaustive switch on `tipo` gives compile-time completeness.

export interface RepeticaoFaixa {
  readonly tipo: "Faixa"
  readonly min: number
  readonly max: number
}

export interface RepeticaoFixo {
  readonly tipo: "Fixo"
  readonly valor: number
}

export interface RepeticaoFalha {
  readonly tipo: "Falha"
}

export interface RepeticaoTempo {
  readonly tipo: "Tempo"
  readonly min: number // seconds
  readonly max: number // seconds
}

export interface RepeticaoPiramide {
  readonly tipo: "Piramide"
  readonly sequencia: readonly number[]
}

export type Repeticao =
  | RepeticaoFaixa
  | RepeticaoFixo
  | RepeticaoFalha
  | RepeticaoTempo
  | RepeticaoPiramide

// ─── Macros — shared value object ─────────────────────────────────────────────

export interface Macros {
  readonly kcal: number
  readonly proteina_g: number
  readonly carboidrato_g: number
  readonly gordura_g: number
}

// ─── Banco de Opções: Exercicio — top-level IDB store (STORE_EXERCICIOS) ──────
// Curated globally; referenced by FK from OpcaoDeExercicio inside each Plano.

export interface Exercicio {
  readonly id: ExercicioId
  readonly nome: string
  readonly grupos_musculares: readonly GrupoMuscular[]
  readonly series: number
  readonly repeticao: Repeticao
}

// ─── Diet structure (embedded inside Plano) ────────────────────────────────────

export interface OpcaoDeRefeicao {
  readonly id: string       // local slug — unique within parent Refeicao
  readonly descricao: string
  readonly macros: Macros
}

export interface Refeicao {
  readonly id: string       // local slug — unique within parent Plano
  readonly nome: string     // e.g. "Café da manhã", "Almoço"
  readonly horario: string  // "HH:MM", display only
  readonly opcoes: readonly OpcaoDeRefeicao[]
}

// Groups Refeicoes that share the same eating pattern for one or more days.
// Symmetric to SessaoTreino (ADR-0012). Motor selects one OpcaoDeRefeicao per
// slot; after generation each refeicao.opcoes.length === 1.
export interface PerfilDeRefeicao {
  readonly dias:      readonly DiaDaSemana[]
  readonly refeicoes: readonly Refeicao[]
}

// ─── Training structure (embedded inside Plano) ────────────────────────────────
// Symmetric to Refeicao/OpcaoDeRefeicao on the exercise side.

export interface OpcaoDeExercicio {
  readonly id: string              // local slug — unique within parent SlotDeExercicio
  readonly exercicio_id: ExercicioId  // FK → STORE_EXERCICIOS
}

export interface SlotDeExercicio {
  readonly id: string              // local slug — unique within parent SessaoTreino
  readonly ordem: number
  readonly opcoes: readonly OpcaoDeExercicio[]
}

export interface SessaoTreino {
  readonly id: string              // local slug — unique within parent Plano
  readonly dia_da_semana: DiaDaSemana
  readonly slots: readonly SlotDeExercicio[]
  readonly tem_jj: boolean         // JJ on the same day affects hydration guidance
}

// ─── Checklist template (embedded inside Plano) ────────────────────────────────
// Defines the items AND their display order.
// RegistroDeAderencia.checklist uses these IDs as keys; render in template order.

export interface ChecklistItemTemplate {
  readonly id: string       // local slug — unique within parent Plano
  readonly descricao: string
}

// ─── PeriodoDeVigencia — discriminated union (ADR-0002) ───────────────────────
// Ativo: no end date. Arquivado: end date always present — no null-check needed.

export interface PeriodoDeVigenciaAtivo {
  readonly status: "ativo"
  readonly inicio: ISODate
}

export interface PeriodoDeVigenciaArquivado {
  readonly status: "arquivado"
  readonly inicio: ISODate
  readonly fim: ISODate
}

export type PeriodoDeVigencia = PeriodoDeVigenciaAtivo | PeriodoDeVigenciaArquivado

// ─── Plano — top-level IDB store (STORE_PLANOS) ───────────────────────────────
// Immutable after creation (ADR-0003). Changes create a new Plano and archive
// this one. PlanoAtivo and PlanoArquivado are distinct types so a function typed
// (p: PlanoAtivo) is a compile error if you pass a PlanoArquivado.

interface PlanoBase {
  readonly id: PlanoId
  readonly usuario_id: UsuarioId     // owner (ADR-0006)
  readonly autor_id: UsuarioId       // author — equals usuario_id in Camada 1 (ADR-0004)

  readonly objetivo: ObjetivoDePlano
  readonly meta_calorica_diaria: number        // kcal
  readonly meta_proteina_diaria_g: number
  readonly meta_carboidrato_diaria_g: number
  readonly meta_gordura_diaria_g: number
  readonly meta_agua_diaria_ml: number

  readonly perfis_refeicao: readonly PerfilDeRefeicao[]
  readonly sessoes_treino: readonly SessaoTreino[]
  readonly checklist_template: readonly ChecklistItemTemplate[]

  readonly criado_em: ISOTimestamp
}

export interface PlanoAtivo extends PlanoBase {
  readonly vigencia: PeriodoDeVigenciaAtivo
}

export interface PlanoArquivado extends PlanoBase {
  readonly vigencia: PeriodoDeVigenciaArquivado
}

export type Plano = PlanoAtivo | PlanoArquivado

// ─── Usuario — top-level IDB store (STORE_USUARIOS) ──────────────────────────
// Includes Motor de Geração inputs (Mifflin-St Jeor) and a denormalized
// plano_ativo_id so loading the active plan is a single IDB get() with no scan.

export interface Usuario {
  readonly id: UsuarioId
  readonly nome: string
  readonly email: string

  // Motor de Geração inputs
  readonly peso_kg: number
  readonly altura_cm: number
  readonly idade: number
  readonly sexo: "M" | "F"
  readonly fator_atividade: FatorAtividade
  readonly objetivo: ObjetivoDePlano

  readonly plano_ativo_id: PlanoId | null  // null until first plan is generated
  readonly criado_em: ISOTimestamp
}

// ─── Registro de Refeição — discriminated union (ADR-0001) ────────────────────
// Seguiu requires opcao_seguida_id. NaoSeguiu cannot have it.
// macros_reais is optional on both: override canonical macros for that day.

export interface RegistroDeRefeicaoSeguiu {
  readonly refeicao_id: string             // matches Refeicao.id in the active Plano
  readonly status: "Seguiu"
  readonly opcao_seguida_id: string        // required — matches OpcaoDeRefeicao.id
  readonly macros_reais?: Macros
}

export interface RegistroDeRefeicaoNaoSeguiu {
  readonly refeicao_id: string
  readonly status: "NaoSeguiu"
  // opcao_seguida_id intentionally absent
  readonly macros_reais?: Macros           // optionally log what was actually eaten
}

export type RegistroDeRefeicao = RegistroDeRefeicaoSeguiu | RegistroDeRefeicaoNaoSeguiu

// ─── Registro de Exercício ─────────────────────────────────────────────────────

export interface RegistroDeExercicio {
  readonly slot_id: string               // matches SlotDeExercicio.id
  readonly opcao_escolhida_id: string    // matches OpcaoDeExercicio.id
  readonly series_realizadas?: number    // optional: actual sets performed
  readonly repeticao_realizada?: Repeticao  // optional: actual reps/time/etc
}

// ─── RegistroDeAderencia — top-level IDB store (STORE_REGISTROS) ──────────────
// Two timestamps (ADR-0008):
//   data        — device date at creation, immutable, defines the calendar day
//   editado_em  — updated on every subsequent edit, null until first edit
//
// All fields readonly; updates use spread-copy in the Camada de Persistência.
// IDB indexes needed: [usuario_id, data] and [plano_id, data].

export interface RegistroDeAderencia {
  readonly id: RegistroId
  readonly usuario_id: UsuarioId
  readonly plano_id: PlanoId          // bound to the Plano active on `data` — immutable

  readonly data: ISODate              // immutable (ADR-0008)
  readonly editado_em: ISOTimestamp | null  // null on initial creation

  readonly registros_refeicao: readonly RegistroDeRefeicao[]
  readonly agua_consumida_ml: number | null
  readonly treino_realizado: boolean | null
  readonly jj_realizado: boolean | null
  // Keys = ChecklistItemTemplate.id; render order from Plano.checklist_template
  readonly checklist: Readonly<Record<string, boolean>>
  readonly registros_exercicio: readonly RegistroDeExercicio[]
}

// ─── RegistroDePeso — top-level IDB store (STORE_REGISTROS_PESO) ──────────────
// ADR-0018: no máximo um por dia (garantido pelo repositório, não pelo chamador),
// editável (editado_em, padrão ADR-0008) mas sem operação de delete — a série
// temporal de peso não é apagável.

export interface RegistroDePeso {
  readonly id: RegistroPesoId
  readonly usuario_id: UsuarioId

  readonly data: ISODate                    // imutável — define o dia (ADR-0008)
  readonly peso_kg: number
  readonly criado_em: ISOTimestamp
  readonly editado_em: ISOTimestamp | null  // null até a primeira edição
}
