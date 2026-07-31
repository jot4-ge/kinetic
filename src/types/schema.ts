// Runtime validation layer for data crossing the IndexedDB boundary.
// Branded types are compile-time only — without this file, data coming
// from IDB is unverified `unknown`. Run `npm install zod` before using.
//
// Usage pattern (in src/persistencia/):
//   const raw = await idbGet(...)          // unknown
//   const typed = parseRegistro(raw)       // RegistroDeAderencia | throws ZodError

import { z } from "zod"
import type {
  UsuarioId, PlanoId, ExercicioId, RegistroId, RegistroPesoId,
  ISODate, ISOTimestamp,
  GrupoMuscular, DiaDaSemana, ObjetivoDePlano, FatorAtividade,
  Exercicio, Macros, OpcaoDeRefeicao, Refeicao, PerfilDeRefeicao,
  OpcaoDeExercicio, SlotDeExercicio, SessaoTreino, ChecklistItemTemplate,
  PeriodoDeVigencia, PlanoAtivo, PlanoArquivado, Plano,
  Usuario,
  RegistroDeRefeicao, RegistroDeExercicio, RegistroDeAderencia,
  RegistroDePeso,
} from "./domain"

// ─── Brand helpers ────────────────────────────────────────────────────────────

const usuarioId      = z.string().min(1).transform(s => s as UsuarioId)
const planoId        = z.string().min(1).transform(s => s as PlanoId)
const exercicioId    = z.string().min(1).transform(s => s as ExercicioId)
const registroId     = z.string().min(1).transform(s => s as RegistroId)
const registroPesoId = z.string().min(1).transform(s => s as RegistroPesoId)
const isoDate     = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISODate must be YYYY-MM-DD")
                    .transform(s => s as ISODate)
const isoTimestamp = z.string().datetime({ offset: true })
                    .transform(s => s as ISOTimestamp)

// ─── Closed enums ─────────────────────────────────────────────────────────────

const grupoMuscularSchema = z.enum([
  "Peito", "Triceps", "Costas", "Biceps", "Ombros",
  "Quadriceps", "Gluteo", "Isquiotibiais", "Panturrilha", "Abdomen",
]) satisfies z.ZodType<GrupoMuscular>

const diaDaSemanaSchema = z.enum([
  "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo",
]) satisfies z.ZodType<DiaDaSemana>

const objetivoDePlanoSchema = z.enum([
  "Cutting", "Manutencao", "Bulk", "Recomposicao",
]) satisfies z.ZodType<ObjetivoDePlano>

const fatorAtividadeSchema = z.enum([
  "Sedentario", "LevementeAtivo", "ModeramenteAtivo", "MuitoAtivo", "ExtremamenteAtivo",
]) satisfies z.ZodType<FatorAtividade>

// ─── Repeticao ────────────────────────────────────────────────────────────────

const repeticaoFaixaSchema   = z.object({ tipo: z.literal("Faixa"),   min: z.number(), max: z.number() })
const repeticaoFixoSchema    = z.object({ tipo: z.literal("Fixo"),    valor: z.number() })
const repeticaoFalhaSchema   = z.object({ tipo: z.literal("Falha") })
const repeticaoTempoSchema   = z.object({ tipo: z.literal("Tempo"),   min: z.number(), max: z.number() })
const repeticaoPiramideSchema = z.object({ tipo: z.literal("Piramide"), sequencia: z.array(z.number()) })

export const repeticaoSchema = z.discriminatedUnion("tipo", [
  repeticaoFaixaSchema,
  repeticaoFixoSchema,
  repeticaoFalhaSchema,
  repeticaoTempoSchema,
  repeticaoPiramideSchema,
])

// ─── Macros ───────────────────────────────────────────────────────────────────

export const macrosSchema = z.object({
  kcal: z.number(),
  proteina_g: z.number(),
  carboidrato_g: z.number(),
  gordura_g: z.number(),
}) satisfies z.ZodType<Macros>

// ─── Exercicio ────────────────────────────────────────────────────────────────

export const exercicioSchema = z.object({
  id: exercicioId,
  nome: z.string().min(1),
  grupos_musculares: z.array(grupoMuscularSchema),
  series: z.number().int().positive(),
  repeticao: repeticaoSchema,
}) satisfies z.ZodType<Exercicio>

// ─── Diet structure ───────────────────────────────────────────────────────────

export const opcaoDeRefeicaoSchema = z.object({
  id: z.string().min(1),
  descricao: z.string().min(1),
  macros: macrosSchema,
}) satisfies z.ZodType<OpcaoDeRefeicao>

export const refeicaoSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  horario: z.string().regex(/^\d{2}:\d{2}$/),
  opcoes: z.array(opcaoDeRefeicaoSchema),
}) satisfies z.ZodType<Refeicao>

export const perfilDeRefeicaoSchema = z.object({
  dias:      z.array(diaDaSemanaSchema).min(1),
  refeicoes: z.array(refeicaoSchema).min(1),
}) satisfies z.ZodType<PerfilDeRefeicao>

// ─── Training structure ───────────────────────────────────────────────────────

export const opcaoDeExercicioSchema = z.object({
  id: z.string().min(1),
  exercicio_id: exercicioId,
}) satisfies z.ZodType<OpcaoDeExercicio>

export const slotDeExercicioSchema = z.object({
  id: z.string().min(1),
  ordem: z.number().int().nonnegative(),
  opcoes: z.array(opcaoDeExercicioSchema),
}) satisfies z.ZodType<SlotDeExercicio>

export const sessaoTreinoSchema = z.object({
  id: z.string().min(1),
  dia_da_semana: diaDaSemanaSchema,
  slots: z.array(slotDeExercicioSchema),
  tem_jj: z.boolean(),
}) satisfies z.ZodType<SessaoTreino>

export const checklistItemTemplateSchema = z.object({
  id: z.string().min(1),
  descricao: z.string().min(1),
}) satisfies z.ZodType<ChecklistItemTemplate>

// ─── PeriodoDeVigencia ────────────────────────────────────────────────────────

const periodoAtivoSchema    = z.object({ status: z.literal("ativo"),     inicio: isoDate })
const periodoArquivadoSchema = z.object({ status: z.literal("arquivado"), inicio: isoDate, fim: isoDate })

export const periodoDeVigenciaSchema = z.union([
  periodoAtivoSchema,
  periodoArquivadoSchema,
]) satisfies z.ZodType<PeriodoDeVigencia>

// ─── Plano ────────────────────────────────────────────────────────────────────

const planoBaseShape = {
  id: planoId,
  usuario_id: usuarioId,
  autor_id: usuarioId,
  objetivo: objetivoDePlanoSchema,
  meta_calorica_diaria: z.number().positive(),
  meta_proteina_diaria_g: z.number().nonnegative(),
  meta_carboidrato_diaria_g: z.number().nonnegative(),
  meta_gordura_diaria_g: z.number().nonnegative(),
  meta_agua_diaria_ml: z.number().positive(),
  perfis_refeicao: z.array(perfilDeRefeicaoSchema),
  sessoes_treino: z.array(sessaoTreinoSchema),
  checklist_template: z.array(checklistItemTemplateSchema),
  criado_em: isoTimestamp,
}

export const planoAtivoSchema = z.object({
  ...planoBaseShape,
  vigencia: periodoAtivoSchema,
}) satisfies z.ZodType<PlanoAtivo>

export const planoArquivadoSchema = z.object({
  ...planoBaseShape,
  vigencia: periodoArquivadoSchema,
}) satisfies z.ZodType<PlanoArquivado>

export const planoSchema = z.union([
  planoAtivoSchema,
  planoArquivadoSchema,
]) satisfies z.ZodType<Plano>

// ─── Usuario ──────────────────────────────────────────────────────────────────

export const usuarioSchema = z.object({
  id: usuarioId,
  nome: z.string().min(1),
  email: z.string().email(),
  peso_kg: z.number().positive(),
  altura_cm: z.number().positive(),
  idade: z.number().int().positive(),
  sexo: z.enum(["M", "F"]),
  fator_atividade: fatorAtividadeSchema,
  objetivo: objetivoDePlanoSchema,
  plano_ativo_id: planoId.nullable(),
  criado_em: isoTimestamp,
}) satisfies z.ZodType<Usuario>

// ─── Registros de Aderência ───────────────────────────────────────────────────

const registroDeRefeicaoSeguiuSchema = z.object({
  refeicao_id: z.string().min(1),
  status: z.literal("Seguiu"),
  opcao_seguida_id: z.string().min(1),
  macros_reais: macrosSchema.optional(),
})

const registroDeRefeicaoNaoSeguiuSchema = z.object({
  refeicao_id: z.string().min(1),
  status: z.literal("NaoSeguiu"),
  macros_reais: macrosSchema.optional(),
})

export const registroDeRefeicaoSchema = z.discriminatedUnion("status", [
  registroDeRefeicaoSeguiuSchema,
  registroDeRefeicaoNaoSeguiuSchema,
]) satisfies z.ZodType<RegistroDeRefeicao>

export const registroDeExercicioSchema = z.object({
  slot_id: z.string().min(1),
  opcao_escolhida_id: z.string().min(1),
  series_realizadas: z.number().int().positive().optional(),
  repeticao_realizada: repeticaoSchema.optional(),
}) satisfies z.ZodType<RegistroDeExercicio>

export const registroDeAderenciaSchema = z.object({
  id: registroId,
  usuario_id: usuarioId,
  plano_id: planoId,
  data: isoDate,
  editado_em: isoTimestamp.nullable(),
  registros_refeicao: z.array(registroDeRefeicaoSchema),
  agua_consumida_ml: z.number().nonnegative().nullable(),
  treino_realizado: z.boolean().nullable(),
  jj_realizado: z.boolean().nullable(),
  checklist: z.record(z.string(), z.boolean()),
  registros_exercicio: z.array(registroDeExercicioSchema),
}) satisfies z.ZodType<RegistroDeAderencia>

// ─── RegistroDePeso ─────────────────────────────────────────────────────────

export const registroDePesoSchema = z.object({
  id: registroPesoId,
  usuario_id: usuarioId,
  data: isoDate,
  peso_kg: z.number().positive(),
  criado_em: isoTimestamp,
  editado_em: isoTimestamp.nullable(),
}) satisfies z.ZodType<RegistroDePeso>

// ─── Parse functions (primary interface for src/persistencia/) ────────────────
// Each function takes `unknown` and returns a typed value, throwing ZodError
// on invalid data. Callers do not need to import Zod directly.

export function parseUsuario(raw: unknown): Usuario {
  return usuarioSchema.parse(raw)
}

export function parsePlano(raw: unknown): Plano {
  return planoSchema.parse(raw)
}

export function parseExercicio(raw: unknown): Exercicio {
  return exercicioSchema.parse(raw)
}

export function parseRegistroDeAderencia(raw: unknown): RegistroDeAderencia {
  return registroDeAderenciaSchema.parse(raw)
}

export function parseRegistroDePeso(raw: unknown): RegistroDePeso {
  return registroDePesoSchema.parse(raw)
}
