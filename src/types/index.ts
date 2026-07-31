// Public interface for src/types/.
// All other modules import from "@/types", not from individual files.

export * from "./domain"
export {
  // Schemas (for callers that need to compose validation)
  repeticaoSchema,
  macrosSchema,
  exercicioSchema,
  opcaoDeRefeicaoSchema,
  refeicaoSchema,
  perfilDeRefeicaoSchema,
  opcaoDeExercicioSchema,
  slotDeExercicioSchema,
  sessaoTreinoSchema,
  checklistItemTemplateSchema,
  periodoDeVigenciaSchema,
  planoAtivoSchema,
  planoArquivadoSchema,
  planoSchema,
  usuarioSchema,
  registroDeRefeicaoSchema,
  registroDeExercicioSchema,
  registroDeAderenciaSchema,
  registroDePesoSchema,
  // Parse functions (primary interface for src/persistencia/)
  parseUsuario,
  parsePlano,
  parseExercicio,
  parseRegistroDeAderencia,
  parseRegistroDePeso,
} from "./schema"
