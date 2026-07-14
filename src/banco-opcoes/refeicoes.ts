// Banco de Opções — Refeições
//
// Source: legacy/index.html (three day-panels: cedo, tarde, sabado)
//
// ⚠ MACRO DISCLAIMER: The legacy only stored one kcal total per meal card
// (e.g. "~430 kcal" for the whole Café da manhã card). Individual options
// had no per-option macro breakdown. All macros below were CALCULATED from
// the ingredient lists using standard Brazilian food composition tables
// (TACO 4ª edição / IBGE). They are estimates, not legacy data.
// The user should review and correct values before using in a real plan.
//
// Structural decisions:
//   - "Hidratação inicial" (0 kcal water reminder) is OMITTED — water is
//     tracked via RegistroDeAderencia.agua_consumida_ml.
//   - Almoço/Jantar "mix and match" (choose carb + choose protein) is
//     modelled as a small set of representative complete-meal OpcaoDeRefeicao
//     entries (e.g. "Arroz + Feijão + Frango"). Combinatorial explosion avoided.
//   - "Refeição Livre" (free meal, fim de semana) is modelled with placeholder
//     macros (~900 kcal) since it is intentionally variable. User logs actual
//     macros via RegistroDeAderencia.registros_refeicao[].macros_reais on that day.
//   - Jantar shares the same Refeicao structure and options as Almoço for
//     "dias cedo" since the legacy says "varie os itens do almoço".
//   - REFEICOES_TARDE was split into REFEICOES_TERCA (no pré-treino) and
//     REFEICOES_SEXTA (pré-treino JJ at 16:15). They share all slots except
//     the pré-treino, which only applies on Sexta (JJ 17h).

import type { Refeicao, PerfilDeRefeicao } from "@/types"

// ─── REFEICOES_CEDO — Seg / Qua / Qui ────────────────────────────────────────

export const REFEICOES_CEDO: readonly Refeicao[] = [
  {
    id: "cafe-da-manha",
    nome: "Café da manhã",
    horario: "07:00",
    opcoes: [
      {
        id: "shake-proteico",
        descricao: "Shake (150g banana · 200ml leite desnatado · 30g whey · 20g aveia)",
        macros: { kcal: 390, proteina_g: 34, carboidrato_g: 61, gordura_g: 4 },
      },
      {
        id: "pao-com-ovos",
        descricao: "Pão francês (50g) · 3 ovos mexidos · 1 fruta",
        macros: { kcal: 430, proteina_g: 24, carboidrato_g: 51, gordura_g: 16 },
      },
    ],
  },
  {
    id: "lanche",
    nome: "Lanche",
    horario: "11:30",
    opcoes: [
      {
        id: "iogurte-whey-fruta",
        descricao: "200g iogurte zero gordura · 30g whey · 1 fruta",
        macros: { kcal: 280, proteina_g: 35, carboidrato_g: 36, gordura_g: 2 },
      },
      {
        id: "pao-queijo-frango",
        descricao: "Pão francês · 20g queijo · 100g frango desfiado",
        macros: { kcal: 368, proteina_g: 41, carboidrato_g: 27, gordura_g: 10 },
      },
      {
        id: "overnight-oats",
        descricao: "Overnight oats (40g aveia · 30g whey · 150ml leite desnatado · 1 fruta)",
        macros: { kcal: 403, proteina_g: 34, carboidrato_g: 60, gordura_g: 5 },
      },
    ],
  },
  {
    id: "almoco",
    nome: "Almoço",
    horario: "14:00",
    opcoes: [
      {
        id: "arroz-feijao-frango",
        descricao: "Arroz branco (150g) · Feijão (100g) · Frango grelhado (150g) · Salada à vontade",
        macros: { kcal: 520, proteina_g: 55, carboidrato_g: 57, gordura_g: 8 },
      },
      {
        id: "arroz-feijao-carne",
        descricao: "Arroz branco (150g) · Feijão (100g) · Carne bovina (150g) · Salada à vontade",
        macros: { kcal: 482, proteina_g: 44, carboidrato_g: 57, gordura_g: 9 },
      },
      {
        id: "hamburguer-caseiro",
        descricao: "Pão hambúrguer (50g) · Patinho moído (150g) · 20g queijo · Alface/tomate · 1 fruta",
        macros: { kcal: 502, proteina_g: 45, carboidrato_g: 50, gordura_g: 15 },
      },
    ],
  },
  {
    id: "pre-treino",
    nome: "Pré-treino",
    horario: "16:15",
    opcoes: [
      {
        id: "aveia-whey-fruta",
        descricao: "40g aveia · 30g whey · 1 fruta",
        macros: { kcal: 351, proteina_g: 29, carboidrato_g: 52, gordura_g: 5 },
      },
      {
        id: "pao-whey-agua",
        descricao: "Pão francês (50g) · 30g whey com água",
        macros: { kcal: 243, proteina_g: 27, carboidrato_g: 29, gordura_g: 3 },
      },
    ],
  },
  {
    id: "jantar",
    nome: "Jantar",
    horario: "20:00",
    opcoes: [
      {
        id: "arroz-feijao-frango",
        descricao: "Arroz branco (150g) · Feijão (100g) · Frango grelhado (150g) · Salada à vontade",
        macros: { kcal: 520, proteina_g: 55, carboidrato_g: 57, gordura_g: 8 },
      },
      {
        id: "hamburguer-caseiro",
        descricao: "Pão hambúrguer (50g) · Patinho moído (150g) · 20g queijo · Alface/tomate · 1 fruta",
        macros: { kcal: 502, proteina_g: 45, carboidrato_g: 50, gordura_g: 15 },
      },
    ],
  },
  {
    id: "ceia",
    nome: "Ceia",
    horario: "22:00",
    opcoes: [
      {
        id: "iogurte-whey-fruta",
        descricao: "200g iogurte zero gordura · 30g whey · 1 fruta (caseína natural)",
        macros: { kcal: 280, proteina_g: 35, carboidrato_g: 36, gordura_g: 2 },
      },
      {
        id: "iogurte-whey-leve",
        descricao: "200g iogurte desnatado · 30g whey (mais leve)",
        macros: { kcal: 190, proteina_g: 30, carboidrato_g: 15, gordura_g: 2 },
      },
    ],
  },
]

// ─── Shared slots — Terça and Sexta ──────────────────────────────────────────
// Defined once to avoid duplication; both REFEICOES_TERCA and REFEICOES_SEXTA
// reference the same objects (readonly — safe to share).

const tardeCafe: Refeicao = {
  id: "cafe-da-manha",
  nome: "Café da manhã",
  horario: "08:30",
  opcoes: [
    {
      id: "mingau-aveia-whey-fruta",
      descricao: "Mingau: 55g aveia em flocos · 30g whey · 1 fruta fatiada · canela + adoçante",
      macros: { kcal: 408, proteina_g: 31, carboidrato_g: 62, gordura_g: 6 },
    },
    {
      id: "bolo-microondas",
      descricao: "Bolo de microondas: 80g banana amassada · 1 ovo · 40g aveia · 30g whey (cobertura)",
      macros: { kcal: 403, proteina_g: 35, carboidrato_g: 48, gordura_g: 10 },
    },
    {
      id: "pao-queijo-frango-fruta",
      descricao: "Pão francês · 20g queijo · 100g frango desfiado · 1 fruta",
      macros: { kcal: 457, proteina_g: 42, carboidrato_g: 50, gordura_g: 10 },
    },
  ],
}

const tardeLanche: Refeicao = {
  id: "lanche",
  nome: "Lanche",
  horario: "12:30",
  opcoes: [
    {
      id: "iogurte-whey-fruta",
      descricao: "200g iogurte zero gordura · 30g whey · 1 fruta",
      macros: { kcal: 280, proteina_g: 35, carboidrato_g: 36, gordura_g: 2 },
    },
  ],
}

// Applies to Sexta only (JJ 17h). Not included in REFEICOES_TERCA.
const tardePreTreino: Refeicao = {
  id: "pre-treino",
  nome: "Pré-treino",
  horario: "16:15",
  opcoes: [
    {
      id: "aveia-whey-fruta",
      descricao: "40g aveia · 30g whey · 1 fruta (antes do JJ das 17h)",
      macros: { kcal: 351, proteina_g: 29, carboidrato_g: 52, gordura_g: 5 },
    },
  ],
}

const tardeAlmocoJantar: Refeicao = {
  id: "almoco-jantar",
  nome: "Almoço / Jantar",
  horario: "18:00",
  opcoes: [
    {
      id: "arroz-feijao-frango",
      descricao: "Arroz branco (150g) · Feijão (100g) · Frango grelhado (150g) · Salada à vontade",
      macros: { kcal: 520, proteina_g: 55, carboidrato_g: 57, gordura_g: 8 },
    },
    {
      id: "arroz-feijao-carne",
      descricao: "Arroz branco (150g) · Feijão (100g) · Carne bovina (150g) · Salada à vontade",
      macros: { kcal: 482, proteina_g: 44, carboidrato_g: 57, gordura_g: 9 },
    },
  ],
}

const tardeCeia: Refeicao = {
  id: "ceia",
  nome: "Ceia",
  horario: "21:00",
  opcoes: [
    {
      id: "iogurte-whey-frutas",
      descricao: "200g iogurte zero gordura · 30g whey · 1~2 frutas",
      macros: { kcal: 324, proteina_g: 36, carboidrato_g: 48, gordura_g: 2 },
    },
  ],
}

// ─── REFEICOES_TERCA — Sem treino, sem JJ ────────────────────────────────────

export const REFEICOES_TERCA: readonly Refeicao[] = [
  tardeCafe, tardeLanche, tardeAlmocoJantar, tardeCeia,
]

// ─── REFEICOES_SEXTA — JJ às 17h (pré-treino incluído) ───────────────────────

export const REFEICOES_SEXTA: readonly Refeicao[] = [
  tardeCafe, tardeLanche, tardePreTreino, tardeAlmocoJantar, tardeCeia,
]

// ─── REFEICOES_FIM_DE_SEMANA — Sáb / Dom ─────────────────────────────────────
// Sábado: academia à tarde + Refeição Livre no almoço.
// Domingo: mesmo perfil alimentar (sem padrão próprio documentado — ADR-0012).

export const REFEICOES_FIM_DE_SEMANA: readonly Refeicao[] = [
  {
    id: "cafe-da-manha",
    nome: "Café da manhã",
    horario: "09:00",
    opcoes: [
      {
        id: "aveia-whey-fruta",
        descricao: "55g aveia + 30g whey + 1 fruta",
        macros: { kcal: 408, proteina_g: 31, carboidrato_g: 62, gordura_g: 6 },
      },
      {
        id: "ovos-pao-fruta",
        descricao: "3 ovos + pão francês (50g) + 1 fruta",
        macros: { kcal: 430, proteina_g: 24, carboidrato_g: 51, gordura_g: 16 },
      },
    ],
  },
  {
    id: "almoco",
    nome: "Almoço",
    horario: "12:00",
    opcoes: [
      {
        id: "arroz-feijao-frango",
        descricao: "Arroz (150g) · Feijão (100g) · Frango grelhado (150g) · Salada",
        macros: { kcal: 520, proteina_g: 55, carboidrato_g: 57, gordura_g: 8 },
      },
      {
        // ⚠ Refeição Livre: macros are placeholder only.
        // User must override with macros_reais in RegistroDeAderencia on this day.
        id: "refeicao-livre",
        descricao: "Refeição livre (o que quiser — abaixo de 1000 kcal)",
        macros: { kcal: 900, proteina_g: 30, carboidrato_g: 110, gordura_g: 40 },
      },
    ],
  },
  {
    id: "lanche-pre-treino",
    nome: "Lanche / Pré-treino",
    horario: "15:30",
    opcoes: [
      {
        id: "aveia-whey",
        descricao: "40g aveia · 30g whey (sem fruta — treino em seguida)",
        macros: { kcal: 262, proteina_g: 28, carboidrato_g: 29, gordura_g: 5 },
      },
    ],
  },
  {
    id: "jantar-ceia",
    nome: "Jantar + Ceia",
    horario: "20:00",
    opcoes: [
      {
        id: "jantar-ceia-padrao",
        descricao: "Refeição padrão (carb + proteína + salada) · iogurte/whey na ceia",
        macros: { kcal: 710, proteina_g: 85, carboidrato_g: 72, gordura_g: 10 },
      },
    ],
  },
]

// ─── PERFIS_REFEICAO_PADRAO ───────────────────────────────────────────────────
// Default day-to-profile mapping used by the Motor de Geração (ADR-0012).
// Motor reads this constant and produces perfis_refeicao in the Plano.

export const PERFIS_REFEICAO_PADRAO: readonly PerfilDeRefeicao[] = [
  { dias: ["Segunda", "Quarta", "Quinta"], refeicoes: REFEICOES_CEDO         },
  { dias: ["Terca"],                       refeicoes: REFEICOES_TERCA        },
  { dias: ["Sexta"],                       refeicoes: REFEICOES_SEXTA        },
  { dias: ["Sabado", "Domingo"],           refeicoes: REFEICOES_FIM_DE_SEMANA },
]
