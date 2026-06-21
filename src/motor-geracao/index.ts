// Motor de Geração — ADR-0005: determinístico, sem IA
// Etapa 1: cálculo nutricional (TMB → TDEE → kcal_meta → macros)
// Etapa 2: seleção do Banco de Opções (refeições + treinos → ConteudoDoPlano)

// ─── Etapa 1 — funções e constantes ──────────────────────────────────────────
export { calcularTMB }                                                         from "./calculo-tmb"
export { calcularTDEE, calcularKcalMeta, FATORES_ATIVIDADE, AJUSTES_OBJETIVO } from "./calculo-calorico"
export { calcularMacros, PROTEINA_G_POR_KG, GORDURA_MIN_G_POR_KG }            from "./calculo-macros"

// ─── Etapa 2 — funções e tipos ────────────────────────────────────────────────
export { selecionarOpcao, montarRefeicoes }   from "./selecao-refeicoes"
export { montarSessoesTreino }                from "./selecao-treino"
export { montarConteudoDoPlano }              from "./montar-plano"
export type { ConteudoDoPlano, EntradaMontagem } from "./montar-plano"

// ─── Tipos intermediários ─────────────────────────────────────────────────────
import type { Macros, ObjetivoDePlano, FatorAtividade, DiaDaSemana } from "@/types"

export interface ResultadoNutricional {
  readonly tmb_kcal:  number
  readonly tdee_kcal: number
  readonly kcal_meta: number
  readonly macros:    Macros
}

export interface EntradaCalculo {
  readonly peso_kg:         number
  readonly altura_cm:       number
  readonly idade:           number
  readonly sexo:            "M" | "F"
  readonly fator_atividade: FatorAtividade
  readonly objetivo:        ObjetivoDePlano
}

// ─── Pipelines ────────────────────────────────────────────────────────────────
import { calcularTMB }                   from "./calculo-tmb"
import { calcularTDEE, calcularKcalMeta } from "./calculo-calorico"
import { calcularMacros }                from "./calculo-macros"
import { montarConteudoDoPlano }         from "./montar-plano"
import type { ConteudoDoPlano }          from "./montar-plano"

// Etapa 1: biometria + objetivo → resultado nutricional completo
export function calcularNutricao(entrada: EntradaCalculo): ResultadoNutricional {
  const tmb_kcal  = calcularTMB(entrada)
  const tdee_kcal = calcularTDEE(tmb_kcal, entrada.fator_atividade)
  const kcal_meta = calcularKcalMeta(tdee_kcal, entrada.objetivo)
  const macros    = calcularMacros({ kcal_meta, peso_kg: entrada.peso_kg, objetivo: entrada.objetivo })
  return { tmb_kcal, tdee_kcal, kcal_meta, macros }
}

// Full pipeline (Etapa 1 + Etapa 2): entrada do Usuário → ConteudoDoPlano pronto
// para ser persistido pela Camada de Persistência com id, usuario_id, criado_em, etc.
export interface EntradaGerarPlano extends EntradaCalculo {
  readonly dias_treino?: readonly DiaDaSemana[]
  readonly dias_jj?:     readonly DiaDaSemana[]
}

export function gerarPlano(entrada: EntradaGerarPlano): ConteudoDoPlano {
  const nutricao = calcularNutricao(entrada)
  return montarConteudoDoPlano({
    kcal_meta:   nutricao.kcal_meta,
    macros:      nutricao.macros,
    objetivo:    entrada.objetivo,
    peso_kg:     entrada.peso_kg,
    dias_treino: entrada.dias_treino,
    dias_jj:     entrada.dias_jj,
  })
}
