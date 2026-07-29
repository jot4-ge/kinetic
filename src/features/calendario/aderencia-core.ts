// Métrica de aderência de um dia — núcleo puro, sem React, sem persistência.
//
// Traduz um Registro de Aderência no indicador de 3 níveis do calendário: um
// relance de QUÃO BEM o dia foi cumprido, em vez do ponto binário "tem registro".
// O detalhe completo (água, treino/JJ, checklist) fica na tela do dia, que tem
// espaço para mostrá-lo — aqui só refeições, a única dimensão com denominador
// bem definido todo dia.
//
// Por que o denominador vem do PLANO e não do Registro: registros_refeicao é
// ESPARSO — desmarcar uma refeição remove a entrada (hoje-core.alternarStatusRefeicao)
// e um registro novo nasce com o array vazio. Um dia com 1 refeição marcada entre
// 5 previstas teria length 1 e daria 100%, o oposto da verdade. O total real são
// as refeições que o Plano prescreve para aquele dia da semana.
//
// O Plano certo é o do próprio Registro (registro.plano_id, imutável, ADR-0015) —
// não o Plano Ativo de hoje. Um dia de julho registrado sob um Plano hoje
// arquivado é medido contra as refeições daquele Plano, não contra as atuais.

import type { ISODate, Plano, RegistroDeAderencia, Refeicao } from "@/types"
import { diaDaSemanaDeISO } from "@/utils/data"
import { resolverPerfilDia } from "@/motor-geracao/selecao-refeicoes"
import { statusDaRefeicao } from "@/features/hoje/hoje-core"
import { diasNoMes, primeiroDia, ultimoDia } from "./calendario-core"

// Quantos pontos do indicador ficam acesos. Ver LIMIARES abaixo.
export type NivelAderencia = 0 | 1 | 2 | 3

// Proporção mínima para cada nível. Cortes em terços porque o medidor tem três
// posições: cada ponto vale um terço do dia. O nível 3 é a exceção deliberada —
// exige a proporção EXATA de 1, sem arredondar, para que "todos os pontos acesos"
// nunca signifique "quase tudo" (5/6 = 0,83 acende dois, não três).
export const LIMIAR_NIVEL_2 = 2 / 3

// Refeições que o Plano prescreve para o dia da semana da data. Usa o mesmo
// resolverPerfilDia da tela do dia, então o denominador é exatamente a lista de
// refeições que o usuário viu ao registrar. Dia sem Perfil que o cubra → vazio.
export function refeicoesPlanejadasEm(plano: Plano, data: ISODate): readonly Refeicao[] {
  return resolverPerfilDia(plano.perfis_refeicao, diaDaSemanaDeISO(data))?.refeicoes ?? []
}

// Proporção de refeições planejadas com status "Seguiu", em [0, 1].
//
// null = INDETERMINADA, que não é o mesmo que zero: zero afirma "não cumpriu
// nenhuma refeição", null diz "não dá para saber". Acontece quando o Plano do
// Registro não foi encontrado (registro órfão) ou quando o dia não tem refeições
// previstas — caso em que a divisão nem chega a acontecer.
//
// O numerador é a INTERSEÇÃO (refeições previstas que foram Seguidas), não a
// contagem de entradas "Seguiu" do Registro: assim um id que saiu do Plano em
// uma regeneração não infla a conta acima de 1.
export function proporcaoRefeicoesSeguidas(
  registro: RegistroDeAderencia,
  plano: Plano | null,
): number | null {
  if (!plano) return null

  const previstas = refeicoesPlanejadasEm(plano, registro.data)
  if (previstas.length === 0) return null

  const seguidas = previstas.filter((r) => statusDaRefeicao(registro, r.id) === "Seguiu").length
  return seguidas / previstas.length
}

// Nível do indicador de 3 pontos. null = indeterminada (o componente cai no
// ponto único "com registro", que continua honesto onde a proporção não existe).
//
// Cortes:
//   3 — proporção exatamente 1        (dia cheio)
//   2 — proporção ≥ 2/3               (maior parte do dia)
//   1 — proporção > 0                 (cumpriu alguma coisa)
//   0 — proporção exatamente 0        (registrou o dia, não cumpriu refeição alguma)
//
// O nível 1 tem PISO: qualquer progresso acende ao menos um ponto, mesmo abaixo
// de 1/3 (1 de 6 = 0,17). O corte uniforme deixaria esse dia com zero pontos,
// visualmente idêntico a um dia em que nada foi feito — e "fez pouco" ≠ "não fez
// nada" é justamente o que o indicador existe para mostrar. O nível 0 fica
// reservado ao seu significado próprio.
export function nivelDeAderencia(
  registro: RegistroDeAderencia,
  plano: Plano | null,
): NivelAderencia | null {
  const proporcao = proporcaoRefeicoesSeguidas(registro, plano)
  if (proporcao === null) return null

  if (proporcao >= 1) return 3
  if (proporcao >= LIMIAR_NIVEL_2) return 2
  if (proporcao > 0) return 1
  return 0
}

// Rótulo do nível para leitor de tela — o indicador é visual (pontos), então o
// significado precisa existir em texto. Compõe o aria-label da célula do dia.
export function rotuloNivelAderencia(nivel: NivelAderencia): string {
  switch (nivel) {
    case 3: return "todas as refeições seguidas"
    case 2: return "maior parte das refeições seguidas"
    case 1: return "parte das refeições seguidas"
    case 0: return "nenhuma refeição seguida"
  }
}

// ─── Resumo de um dia (painel lateral) ───────────────────────────────────────
// O painel mostra o DETALHE do dia sob foco: aqui sim entram água, treino/JJ e
// checklist, que ficaram de fora dos 3 pontos. O relance é simples (refeições);
// o detalhe é completo — e o detalhe completo mesmo vive na tela do dia.

export interface ResumoDia {
  readonly data: ISODate
  readonly temRegistro: boolean
  readonly nivel: NivelAderencia | null
  readonly refeicoesSeguidas: number
  readonly refeicoesPrevistas: number
  readonly aguaMl: number | null
  readonly treino: boolean | null
  readonly jj: boolean | null
  readonly checklistFeitos: number
  readonly checklistTotal: number
}

export function resumirDia(
  data: ISODate,
  registro: RegistroDeAderencia | null,
  plano: Plano | null,
): ResumoDia {
  const previstas = plano ? refeicoesPlanejadasEm(plano, data) : []

  if (!registro) {
    return {
      data,
      temRegistro: false,
      nivel: null,
      refeicoesSeguidas: 0,
      refeicoesPrevistas: previstas.length,
      aguaMl: null,
      treino: null,
      jj: null,
      checklistFeitos: 0,
      checklistTotal: plano?.checklist_template.length ?? 0,
    }
  }

  const itens = Object.values(registro.checklist)

  return {
    data,
    temRegistro: true,
    nivel: nivelDeAderencia(registro, plano),
    refeicoesSeguidas: previstas.filter((r) => statusDaRefeicao(registro, r.id) === "Seguiu").length,
    refeicoesPrevistas: previstas.length,
    aguaMl: registro.agua_consumida_ml,
    treino: registro.treino_realizado,
    jj: registro.jj_realizado,
    checklistFeitos: itens.filter(Boolean).length,
    checklistTotal: itens.length,
  }
}

// ─── Resumo do mês (painel lateral, estado padrão) ───────────────────────────

export interface ResumoMes {
  readonly diasRegistrados: number
  // Dias do mês que já aconteceram — o denominador honesto de "quantos dias
  // registrei". Um mês futuro tem 0; o mês corrente vai até hoje.
  readonly diasDecorridos: number
  // Média das proporções dos dias COM registro, em % inteiro. null = nenhum dia
  // mensurável no mês. Deliberadamente não conta dia sem registro como zero:
  // constância já é diasRegistrados/diasDecorridos, e misturar as duas produziria
  // um número que não significa nem uma coisa nem outra.
  readonly aderenciaMediaPct: number | null
  readonly diasCheios: number
  // Contagem por nível, indexada pelo próprio nível: [nível 0, 1, 2, 3].
  readonly distribuicao: readonly [number, number, number, number]
}

// "4 de 28" para o painel. Um mês inteiramente no futuro tem zero dias
// decorridos: "0 de 0" é factual, mas lê como defeito — vira travessão, que é
// como o painel já grafa toda métrica sem valor.
export function formatarDiasRegistrados(
  diasRegistrados: number,
  diasDecorridos: number,
): string {
  if (diasDecorridos === 0) return "—"
  return `${diasRegistrados} de ${diasDecorridos}`
}

// Quantos dias do mês já aconteceram, relativo a HOJE. Comparação lexical de
// ISODate (largura fixa, ordem alfabética = cronológica).
export function diasDecorridosNoMes(ano: number, mes: number, hoje: ISODate): number {
  if (primeiroDia(ano, mes) > hoje) return 0                 // mês inteiro no futuro
  if (ultimoDia(ano, mes) <= hoje) return diasNoMes(ano, mes) // mês inteiro no passado
  return Number(hoje.split("-")[2])                           // mês corrente: até hoje
}

// Agrega os Registros de um mês. `planoDoRegistro` resolve o Plano de cada
// Registro (por registro.plano_id) — passado como função para o núcleo não
// depender de como o chamador guarda os Planos, e para os testes não precisarem
// montar um Map.
export function resumirMes(
  registros: readonly RegistroDeAderencia[],
  planoDoRegistro: (registro: RegistroDeAderencia) => Plano | null,
  ano: number,
  mes: number,
  hoje: ISODate,
): ResumoMes {
  const prefixo = `${ano}-${String(mes).padStart(2, "0")}-`
  const doMes = registros.filter((r) => r.data.startsWith(prefixo))

  const distribuicao: [number, number, number, number] = [0, 0, 0, 0]
  let somaProporcoes = 0
  let mensuraveis = 0

  for (const registro of doMes) {
    const plano = planoDoRegistro(registro)
    const proporcao = proporcaoRefeicoesSeguidas(registro, plano)
    if (proporcao === null) continue

    somaProporcoes += proporcao
    mensuraveis++
    distribuicao[nivelDeAderencia(registro, plano) as NivelAderencia]++
  }

  return {
    diasRegistrados: doMes.length,
    diasDecorridos: diasDecorridosNoMes(ano, mes, hoje),
    aderenciaMediaPct: mensuraveis === 0 ? null : Math.round((somaProporcoes / mensuraveis) * 100),
    diasCheios: distribuicao[3],
    distribuicao,
  }
}
