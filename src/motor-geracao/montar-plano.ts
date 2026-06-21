import type {
  Macros,
  ObjetivoDePlano,
  DiaDaSemana,
  ChecklistItemTemplate,
  PlanoAtivo,
} from "@/types"
import { REFEICOES_CEDO } from "@/banco-opcoes"
import { montarRefeicoes }    from "./selecao-refeicoes"
import { montarSessoesTreino } from "./selecao-treino"

// Content of a Plano without persistence-layer metadata
// (id, usuario_id, autor_id, criado_em, vigencia — assigned by Camada de Persistência).
export type ConteudoDoPlano = Omit<
  PlanoAtivo,
  "id" | "usuario_id" | "autor_id" | "criado_em" | "vigencia"
>

export interface EntradaMontagem {
  readonly kcal_meta:  number
  readonly macros:     Macros
  readonly objetivo:   ObjetivoDePlano
  readonly peso_kg:    number
  readonly dias_treino?: readonly DiaDaSemana[]
  readonly dias_jj?:    readonly DiaDaSemana[]
}

// Default training schedule — 5 gym days, 3 JJ days (Seg/Qua/Sex).
// Sexta is JJ-only (no gym template in SESSOES_SEMANA) → no SessaoTreino for Sex.
const DIAS_TREINO_PADRAO: readonly DiaDaSemana[] = [
  "Segunda", "Terca", "Quarta", "Quinta", "Sabado",
]
const DIAS_JJ_PADRAO: readonly DiaDaSemana[] = ["Segunda", "Quarta", "Sexta"]

const CHECKLIST_PADRAO: readonly ChecklistItemTemplate[] = [
  { id: "agua-completa",      descricao: "Beber toda a água do dia" },
  { id: "dormir-7h",          descricao: "Dormir pelo menos 7 horas" },
  { id: "sem-pular-refeicao", descricao: "Não pular nenhuma refeição" },
  { id: "suplementacao",      descricao: "Tomar creatina e vitaminas" },
]

// ADR-0010: hydration target is fixed at 35 ml/kg — does not vary by training or JJ day.
const ML_POR_KG_HIDRATACAO = 35

function metaAgua(peso_kg: number): number {
  return ML_POR_KG_HIDRATACAO * peso_kg
}

export function montarConteudoDoPlano(entrada: EntradaMontagem): ConteudoDoPlano {
  const {
    kcal_meta,
    macros,
    objetivo,
    peso_kg,
    dias_treino = DIAS_TREINO_PADRAO,
    dias_jj     = DIAS_JJ_PADRAO,
  } = entrada

  return {
    objetivo,
    meta_calorica_diaria:       Math.round(kcal_meta),
    meta_proteina_diaria_g:     macros.proteina_g,
    meta_carboidrato_diaria_g:  macros.carboidrato_g,
    meta_gordura_diaria_g:      macros.gordura_g,
    meta_agua_diaria_ml:        metaAgua(peso_kg),
    refeicoes:                  montarRefeicoes(REFEICOES_CEDO, kcal_meta),
    sessoes_treino:             montarSessoesTreino(dias_treino, dias_jj),
    checklist_template:         CHECKLIST_PADRAO,
  }
}
