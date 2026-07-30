// Núcleo puro do Histórico — sem React, sem persistência, sem DOM.
//
// Duas responsabilidades, ambas testáveis isoladamente:
//   - ordenar/formatar Planos para a lista de histórico (Período de Vigência)
//   - resumir cada Registro de Aderência para exibição sob o Plano certo
//
// Nada de agregação nem métricas calculadas nesta fase (ex: "80% das refeições"):
// só listagem crua (ADR-0002/0003 dizem por que o histórico é calculável; aqui só
// o lemos). O componente (páginas de Histórico) apenas carrega, chama estas
// funções e apresenta.

import type { Plano, RegistroDeAderencia, ISODate } from "@/types"

// ─── Datas ────────────────────────────────────────────────────────────────────
// ISODate é "YYYY-MM-DD". Formatamos por manipulação de string, nunca via
// new Date(iso) — que interpreta a data como UTC e, em fusos negativos, exibe o
// dia anterior. Mesmo cuidado de fuso que src/utils/data.ts tem na escrita.

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const

// "2026-07-12" → "12 jul 2026". Dia sem zero à esquerda (número, não string).
export function formatarDataCurta(iso: ISODate): string {
  const [ano, mes, dia] = iso.split("-")
  const mesIdx = Number(mes) - 1
  const mesLabel = MESES[mesIdx] ?? mes
  return `${Number(dia)} ${mesLabel} ${ano}`
}

// "2026-07-12" → "jul 2026". Granularidade de mês para quando o dia exato não
// acrescenta nada — o começo da jornada é um marco, não um horário.
export function formatarMesAno(iso: ISODate): string {
  const [ano, mes] = iso.split("-")
  return `${MESES[Number(mes) - 1] ?? mes} ${ano}`
}

// ─── Lista de Planos ────────────────────────────────────────────────────────

// Ordena do mais recente ao mais antigo. Chave: criado_em (timestamp completo),
// monotônico com a ordem de criação — regenerar arquiva o atual e cria um novo
// depois dele, então o mais recente tem o maior criado_em, e o Plano Ativo (o
// último criado) fica sempre no topo. criado_em desempata Planos criados no
// mesmo dia, onde a data de início (granularidade de dia) empataria.
export function ordenarPlanosRecentesPrimeiro(planos: readonly Plano[]): Plano[] {
  return [...planos].sort((a, b) => b.criado_em.localeCompare(a.criado_em))
}

// Período de Vigência para exibição. Ativo: sem fim, rotulado "atual". Arquivado:
// início → fim, ambos datas reais. `ativo` deixa o componente destacar o atual
// (o ouro é apropriado aqui — ele é o Plano vigente).
export interface VigenciaExibicao {
  readonly inicio: string
  readonly fim: string
  readonly ativo: boolean
}

export function formatarVigencia(plano: Plano): VigenciaExibicao {
  const inicio = formatarDataCurta(plano.vigencia.inicio)
  if (plano.vigencia.status === "ativo") {
    return { inicio, fim: "atual", ativo: true }
  }
  return { inicio, fim: formatarDataCurta(plano.vigencia.fim), ativo: false }
}

// ─── Eras ───────────────────────────────────────────────────────────────────
// "Era" é a leitura de produto de um Plano no Histórico: cada Plano é um
// capítulo numerado da jornada. Só a apresentação ganha o nome — o domínio
// continua falando "Plano" (ADR-0002), e nada aqui altera o dado.
//
// O número é de ordem CRONOLÓGICA (1 = a primeira era), não da posição na
// lista. A lista é exibida do presente para o passado, então numerar pela
// posição faria a era 1 do usuário virar outra a cada regeneração. Numerando
// pelo começo, "minha era 1" significa sempre o mesmo capítulo.
//
// Algarismos arábicos, não romanos: a numeração escala sem virar charada
// (a 14ª era é "14", não "XIV") e cai na zona de dados, que é sempre limpa.

export interface Era {
  readonly plano: Plano
  readonly numero: number
  readonly vigencia: VigenciaExibicao
  readonly ativa: boolean
  readonly diasRegistrados: number
}

// Recebe os Planos JÁ ordenados por ordenarPlanosRecentesPrimeiro e devolve as
// Eras na mesma ordem (presente → passado), cada uma com seu número
// cronológico. `diasRegistradosDe` resolve quantos dias foram registrados sob o
// Plano — passado como função para o núcleo não depender de como o chamador
// guarda os Registros, do mesmo jeito que aderencia-core.resumirMes faz.
export function numerarEras(
  planosRecentesPrimeiro: readonly Plano[],
  diasRegistradosDe: (plano: Plano) => number,
): Era[] {
  const total = planosRecentesPrimeiro.length
  return planosRecentesPrimeiro.map((plano, i) => {
    const vigencia = formatarVigencia(plano)
    return {
      plano,
      numero: total - i,
      vigencia,
      ativa: vigencia.ativo,
      diasRegistrados: diasRegistradosDe(plano),
    }
  })
}

// Resumo de todas as Eras — o painel lateral sem nenhuma era em foco.
export interface ResumoEras {
  readonly totalEras: number
  // Início da PRIMEIRA era (a mais antiga). null quando não há era alguma.
  readonly desde: ISODate | null
  // "1 jun 2026 → atual": do começo da primeira ao fim da última (que é "atual"
  // enquanto houver Plano Ativo). Travessão quando não há era alguma — a mesma
  // grafia que o painel do calendário usa para métrica sem valor.
  readonly periodo: string
  readonly diasRegistrados: number
}

// Espera as Eras na ordem de numerarEras (recente primeiro).
export function resumirEras(eras: readonly Era[]): ResumoEras {
  const primeira = eras[eras.length - 1]
  const ultima = eras[0]

  return {
    totalEras: eras.length,
    desde: primeira?.plano.vigencia.inicio ?? null,
    periodo: primeira
      ? `${formatarDataCurta(primeira.plano.vigencia.inicio)} → ${ultima.vigencia.fim}`
      : "—",
    diasRegistrados: eras.reduce((soma, era) => soma + era.diasRegistrados, 0),
  }
}

// "3 eras desde jun 2026" — a legenda do painel. Singular sem "1" solto seria
// mais bonito ("uma era"), mas contagem é dado: numeral, sempre.
export function formatarContagemEras(totalEras: number, desde: ISODate | null): string {
  if (totalEras === 0 || desde === null) return "—"
  const contagem = totalEras === 1 ? "1 era" : `${totalEras} eras`
  return `${contagem} desde ${formatarMesAno(desde)}`
}

// ─── Registros de um Plano ──────────────────────────────────────────────────

// Mapa refeicao_id → nome, varrendo todos os Perfis de Dia do Plano. Os ids de
// Refeição são únicos dentro do Plano (slug), então nomes de perfis diferentes
// não colidem. Usado para exibir QUAIS Refeições foram Seguidas — o Registro só
// guarda o id; o nome vive no Plano ao qual ele está vinculado.
export function nomesRefeicoesDoPlano(plano: Plano): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const perfil of plano.perfis_refeicao) {
    for (const refeicao of perfil.refeicoes) {
      mapa.set(refeicao.id, refeicao.nome)
    }
  }
  return mapa
}

// Ordena cronologicamente (mais antigo → mais recente). Contraste deliberado com
// a lista de Planos (recente primeiro): dentro de um Plano os dias leem melhor
// como uma linha do tempo. Empate de data desempata por id, para ordem estável.
export function ordenarRegistrosCronologico(
  registros: readonly RegistroDeAderencia[],
): RegistroDeAderencia[] {
  return [...registros].sort((a, b) => {
    const porData = a.data.localeCompare(b.data)
    return porData !== 0 ? porData : a.id.localeCompare(b.id)
  })
}

// Resumo cru de um Registro para uma linha da lista. Sem cálculo de aderência —
// só o que foi registrado: data, nomes das Refeições Seguidas, treino/JJ feitos,
// água consumida. água null (dia sem registro de água) vira 0.
export interface ResumoRegistro {
  readonly registroId: string
  readonly data: string
  readonly refeicoesSeguidas: readonly string[]
  readonly treinoRealizado: boolean
  readonly jjRealizado: boolean
  readonly aguaConsumidaMl: number
}

export function resumirRegistro(
  registro: RegistroDeAderencia,
  nomesRefeicoes: Map<string, string>,
): ResumoRegistro {
  const refeicoesSeguidas = registro.registros_refeicao
    .filter((r) => r.status === "Seguiu")
    .map((r) => nomesRefeicoes.get(r.refeicao_id) ?? r.refeicao_id)

  return {
    registroId: registro.id,
    data: formatarDataCurta(registro.data),
    refeicoesSeguidas,
    treinoRealizado: registro.treino_realizado === true,
    jjRealizado: registro.jj_realizado === true,
    aguaConsumidaMl: registro.agua_consumida_ml ?? 0,
  }
}
