// Lógica pura do Progresso de peso — sem React, sem persistência, sem DOM
// (fase 2a — a tela /progresso é a 2b).
//
// O Plano permanece imutável (ADR-0003): peso nunca recalcula um Plano
// automaticamente. O que existe aqui é só a DETECÇÃO — uma função pura que
// sinaliza quando vale sugerir um novo Plano, deixando a UI (2b) decidir se e
// como oferece o fluxo de arquivamento (ADR-0002) que já existe.

import type { ISODate, RegistroDePeso } from "@/types"

// 5% de divergência do peso-base do Plano ativo. Nomeada e ajustável (ADR-0018) —
// não um número mágico espalhado pelas chamadas.
export const LIMIAR_DIVERGENCIA_PESO = 0.05

// ─── Variação em relação ao peso-base ──────────────────────────────────────
// pesoBase é o peso que gerou o Plano ativo (Usuario.peso_kg — ver ADR-0018);
// esta função não sabe de onde ele vem, só compara dois números.

export interface VariacaoPeso {
  readonly diferencaKg: number
  readonly diferencaPct: number  // fração, não percentual — 0.05 = 5%
}

export function variacaoDesdeBase(pesoAtual: number, pesoBase: number): VariacaoPeso {
  const diferencaKg = pesoAtual - pesoBase
  return {
    diferencaKg,
    diferencaPct: diferencaKg / pesoBase,
  }
}

// >= no limiar: "diverge 5%" inclui exatamente 5%, não só acima dele.
export function divergenciaExigeSugestao(
  pesoAtual: number,
  pesoBase: number,
  limiar: number = LIMIAR_DIVERGENCIA_PESO,
): boolean {
  return Math.abs(variacaoDesdeBase(pesoAtual, pesoBase).diferencaPct) >= limiar
}

// ─── Composição com os casos de borda reais ────────────────────────────────
// Sem Plano ativo (pesoBase null) ou sem nenhum peso registrado ainda
// (pesoMaisRecente null): nunca sugere, e não lança — "sem sugestão" é uma
// resposta válida, não uma falha.

export function sugerirNovoPlano(
  pesoMaisRecente: RegistroDePeso | null,
  pesoBase: number | null,
  limiar: number = LIMIAR_DIVERGENCIA_PESO,
): boolean {
  if (pesoMaisRecente === null || pesoBase === null) return false
  return divergenciaExigeSugestao(pesoMaisRecente.peso_kg, pesoBase, limiar)
}

// ─── Agregação para o gráfico (2b renderiza; aqui só a transformação) ──────

export interface PontoDaSerie {
  readonly data: ISODate
  readonly peso_kg: number
}

export interface SeriePeso {
  readonly pontos: readonly PontoDaSerie[]  // ordenados por data crescente
  readonly minKg: number
  readonly maxKg: number
}

// null = sem pesos ainda. Distinto de uma série com lista vazia: o chamador
// não precisa inventar min/max para um estado que não existe — é o mesmo
// "estado progressivo" que a 2b vai precisar exibir como vazio.
export function serieParaGrafico(registros: readonly RegistroDePeso[]): SeriePeso | null {
  if (registros.length === 0) return null

  const pontos = [...registros]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((r) => ({ data: r.data, peso_kg: r.peso_kg }))

  const pesos = pontos.map((p) => p.peso_kg)
  return {
    pontos,
    minKg: Math.min(...pesos),
    maxKg: Math.max(...pesos),
  }
}
