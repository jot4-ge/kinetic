// Lógica pura do Progresso de peso — sem React, sem persistência, sem DOM.
//
// O Plano permanece imutável (ADR-0003): peso nunca recalcula um Plano
// automaticamente. O que existe aqui é só a DETECÇÃO — uma função pura que
// sinaliza quando vale sugerir um novo Plano, deixando a UI decidir se e
// como oferece o fluxo de arquivamento (ADR-0002) que já existe.
//
// Fase 2b acrescenta: o estado da tela conforme a quantidade de pesos, a
// geometria do gráfico SVG (coordenadas puras — o componente só desenha) e a
// edição do peso do dia (mesmo padrão ADR-0008 de hoje-core.carimbarEdicao).

import type { ISODate, ISOTimestamp, UsuarioId, RegistroPesoId, RegistroDePeso } from "@/types"
import { FAIXA_PESO_KG } from "@/features/onboarding/onboarding-core"

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

// ─── Estado da tela conforme a quantidade de pesos registrados ────────────
// Decisão de UX: 0 pesos → estado de entrada convidativo, sem gráfico nem
// variação; 1 peso → mostra Atual/Base mas ainda sem gráfico (dois pontos não
// é curva); 2+ → gráfico completo. Nomeada e testável em vez de condicionais
// espalhadas no componente.

export type EstadoProgresso = "vazio" | "unico" | "serie"

export function estadoProgresso(quantidadeDePesos: number): EstadoProgresso {
  if (quantidadeDePesos <= 0) return "vazio"
  if (quantidadeDePesos === 1) return "unico"
  return "serie"
}

// ─── Geometria do gráfico SVG ──────────────────────────────────────────────
// Transformação pura de dados → coordenadas; o componente só desenha. Y
// invertido (peso maior = ponto mais alto na tela, convenção usual de gráfico).

export interface PontoSvg {
  readonly x: number
  readonly y: number
  readonly data: ISODate
  readonly peso_kg: number
}

export interface EscalaGrafico {
  readonly largura: number
  readonly altura: number
  readonly paddingX?: number
  readonly paddingY?: number
}

export function pontosSvg(serie: SeriePeso, escala: EscalaGrafico): readonly PontoSvg[] {
  const { largura, altura } = escala
  const paddingX = escala.paddingX ?? 12
  const paddingY = escala.paddingY ?? 12
  const { pontos, minKg, maxKg } = serie

  const usavelX = largura - 2 * paddingX
  const usavelY = altura - 2 * paddingY
  const amplitude = maxKg - minKg

  return pontos.map((p, i) => {
    const x = pontos.length === 1
      ? largura / 2
      : paddingX + (i / (pontos.length - 1)) * usavelX
    // Amplitude zero (todos os pesos iguais): linha reta no centro vertical —
    // não uma divisão por zero disfarçada de gráfico.
    const y = amplitude === 0
      ? altura / 2
      : paddingY + (1 - (p.peso_kg - minKg) / amplitude) * usavelY
    return { x, y, data: p.data, peso_kg: p.peso_kg }
  })
}

export function linhaSvgPath(pontos: readonly PontoSvg[]): string {
  return pontos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
}

// Área preenchida sob a linha, fechada até a base do gráfico — usada com um
// gradiente que desvanece. É ornamento de AMBIENTE (brand §3.2), não um
// segundo dado: por isso não carrega informação própria além da linha.
export function areaSvgPath(pontos: readonly PontoSvg[], altura: number): string {
  if (pontos.length === 0) return ""
  const linha = linhaSvgPath(pontos)
  const primeiro = pontos[0]
  const ultimo = pontos[pontos.length - 1]
  return `${linha} L${ultimo.x.toFixed(2)},${altura} L${primeiro.x.toFixed(2)},${altura} Z`
}

// ─── Lista "Últimos" ────────────────────────────────────────────────────────
// Mais recente primeiro, sem o dia de hoje (que tem sua própria seção
// "Registrar" — mostrá-lo nas duas listas seria o mesmo dado duas vezes).

export function pesosRecentes(
  registros: readonly RegistroDePeso[],
  hoje: ISODate,
  limite = 14,
): readonly RegistroDePeso[] {
  return [...registros]
    .filter((r) => r.data !== hoje)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite)
}

// ─── Edição do peso do dia ──────────────────────────────────────────────────
// Mesmo padrão de ADR-0008 do Registro de Aderência (hoje-core.ts:
// criarRegistroVazio / resolverRegistroDoDia / carimbarEdicao), sem o caso
// "retroativo" da Aderência: Registrar é sempre o peso de HOJE, então a
// primeira gravação do dia nunca carimba. Editar um dia já existente (hoje ou
// um dos Últimos) sempre carimba — é sempre uma correção posterior à gravação
// original, nunca a gravação em si.

export interface ContextoRegistroPeso {
  readonly id: RegistroPesoId
  readonly usuario_id: UsuarioId
  readonly data: ISODate
  readonly criado_em: ISOTimestamp
}

export function criarRegistroPesoVazio(peso_kg: number, ctx: ContextoRegistroPeso): RegistroDePeso {
  return {
    id: ctx.id,
    usuario_id: ctx.usuario_id,
    data: ctx.data,
    peso_kg,
    criado_em: ctx.criado_em,
    editado_em: null,
  }
}

// Carrega o registro de hoje se já existe (edita); senão cria um novo.
export function resolverRegistroPeso(
  existente: RegistroDePeso | null,
  peso_kg: number,
  ctx: ContextoRegistroPeso,
): RegistroDePeso {
  return existente ? { ...existente, peso_kg } : criarRegistroPesoVazio(peso_kg, ctx)
}

export function carimbarEdicaoPeso(
  registro: RegistroDePeso,
  jaPersistido: boolean,
  agora: () => Date,
): RegistroDePeso {
  if (!jaPersistido) return registro
  return { ...registro, editado_em: agora().toISOString() as ISOTimestamp }
}

// ─── Validação do input de peso ────────────────────────────────────────────
// Mesma faixa plausível do onboarding (FAIXA_PESO_KG) — um peso implausível
// não é mais válido aqui do que era ao criar o Plano. Aceita vírgula decimal
// (tom de voz do brand §3: direto, sem "por favor").

export type ResultadoValidacaoPeso = { valor: number } | { erro: string }

export function validarPesoInput(bruto: string): ResultadoValidacaoPeso {
  const limpo = bruto.trim().replace(",", ".")
  if (limpo === "") return { erro: "Informe o peso." }
  const n = Number(limpo)
  if (!Number.isFinite(n)) return { erro: "Use apenas números." }
  if (n < FAIXA_PESO_KG.min || n > FAIXA_PESO_KG.max) {
    return { erro: `Valor fora da faixa (${FAIXA_PESO_KG.min}–${FAIXA_PESO_KG.max}).` }
  }
  return { valor: n }
}
