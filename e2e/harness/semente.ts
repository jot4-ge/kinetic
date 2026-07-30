// Fixtures do harness visual — três eras e seus Registros, em memória.
//
// Os Planos são construídos pelo MOTOR REAL (construirUsuarioEPlano → gerarPlano),
// não escritos à mão: assim as refeições, macros e metas são as que o app
// produziria de verdade, e a densidade que aparece na tela é a densidade real.
// Só a vigência é reescrita, para transformar Planos ativos em arquivados e
// montar uma linha do tempo com passado.
//
// Nada aqui é persistido: o consumidor é o criarAdapterMemoria.

import { construirUsuarioEPlano, ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type { EntradaCalculo } from "@/motor-geracao"
import { resolverPerfilDia } from "@/motor-geracao/selecao-refeicoes"
import { diaDaSemanaDeISO } from "@/utils/data"
import type {
  Usuario, Plano, PlanoAtivo, RegistroDeAderencia,
  RegistroDeRefeicao, ISODate, ISOTimestamp, PlanoId, RegistroId,
} from "@/types"
import type { DadosSemente } from "./adapter-memoria"

// "Hoje" fixo da fixture — as datas abaixo são relativas a ele, para as
// capturas serem idênticas em qualquer dia em que rodem.
export const HOJE = "2026-07-29" as ISODate

// ─── Datas ──────────────────────────────────────────────────────────────────
// Aritmética de dias sem passar pelo parse UTC de new Date(iso).

function somarDias(iso: ISODate, dias: number): ISODate {
  const [ano, mes, dia] = iso.split("-").map(Number)
  const d = new Date(ano, mes - 1, dia + dias)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` as ISODate
}

// ─── Planos ─────────────────────────────────────────────────────────────────

function gerarPlanoAtivo(entrada: EntradaCalculo, id: string, inicio: ISODate): PlanoAtivo {
  const { plano } = construirUsuarioEPlano(entrada, {
    gerarId: () => id,
    // criado_em cravado ao meio-dia local do dia de início: é a chave de
    // ordenação da timeline (historico-core.ordenarPlanosRecentesPrimeiro).
    agora: () => new Date(`${inicio}T12:00:00`),
  })
  return plano
}

function arquivar(plano: PlanoAtivo, fim: ISODate): Plano {
  return { ...plano, vigencia: { status: "arquivado", inicio: plano.vigencia.inicio, fim } }
}

// ─── Registros ──────────────────────────────────────────────────────────────

// Quantas refeições marcar como "Seguiu" para o dia cair no nível pedido.
// Deriva do total previsto no Plano para AQUELE dia da semana, que é o
// denominador que aderencia-core usa — então o nível sai exato, sem chutar
// (os perfis têm 4, 5 ou 6 refeições conforme o dia).
//
//   3 — todas          (proporção exatamente 1)
//   2 — a menor contagem que atinge 2/3 sem chegar a 1
//   1 — uma só         (qualquer progresso acende um ponto)
//   0 — nenhuma        (dia registrado, nenhuma refeição seguida)
function quantasSeguir(previstas: number, nivel: 0 | 1 | 2 | 3): number {
  if (nivel === 3) return previstas
  if (nivel === 0) return 0
  if (nivel === 1) return Math.min(1, previstas)
  const k = Math.ceil((previstas * 2) / 3)
  return k >= previstas ? previstas - 1 : k
}

interface DiaSemente {
  readonly data: ISODate
  readonly nivel: 0 | 1 | 2 | 3
  readonly aguaMl: number
  readonly treino: boolean
  readonly jj: boolean
}

function registroDe(plano: Plano, dia: DiaSemente, seq: number): RegistroDeAderencia {
  const previstas = resolverPerfilDia(plano.perfis_refeicao, diaDaSemanaDeISO(dia.data))?.refeicoes ?? []
  const n = quantasSeguir(previstas.length, dia.nivel)

  const registros_refeicao: RegistroDeRefeicao[] = previstas.slice(0, n).map((r) => ({
    refeicao_id: r.id,
    status: "Seguiu",
    opcao_seguida_id: r.opcoes[0].id,
  }))

  // Checklist: os dois primeiros itens do template marcados, para o dado existir
  // sem virar ruído (a tela de dias não o exibe; o painel do calendário sim).
  const checklist: Record<string, boolean> = {}
  plano.checklist_template.forEach((item, i) => { checklist[item.id] = i < 2 })

  return {
    id: `fixture-reg-${seq}` as RegistroId,
    usuario_id: ID_USUARIO_LOCAL,
    plano_id: plano.id,
    data: dia.data,
    editado_em: null,
    registros_refeicao,
    agua_consumida_ml: dia.aguaMl,
    treino_realizado: dia.treino,
    jj_realizado: dia.jj,
    checklist,
    registros_exercicio: [],
  }
}

// Gera uma sequência de dias a partir de `inicio`, seguindo um padrão de níveis
// que se repete, pulando os `saltos` (dias sem registro — ninguém registra
// todos os dias, e a lista precisa parecer real).
function diasCorridos(
  inicio: ISODate,
  total: number,
  padraoNiveis: readonly (0 | 1 | 2 | 3)[],
  saltos: readonly number[] = [],
): DiaSemente[] {
  const dias: DiaSemente[] = []
  let offset = 0
  while (dias.length < total) {
    if (!saltos.includes(offset)) {
      const i = dias.length
      dias.push({
        data: somarDias(inicio, offset),
        nivel: padraoNiveis[i % padraoNiveis.length],
        aguaMl: [3200, 2800, 2000, 3500, 1500, 3000][i % 6],
        treino: i % 3 !== 2,
        jj: i % 4 === 1,
      })
    }
    offset++
  }
  return dias
}

// ─── A jornada ──────────────────────────────────────────────────────────────
// Três eras, do começo ao presente. Objetivos diferentes para os cards não
// serem cópias, e comprimentos diferentes para a timeline ter ritmo.

const ERA_1_INICIO = "2026-03-02" as ISODate
const ERA_2_INICIO = "2026-05-11" as ISODate
const ERA_3_INICIO = "2026-07-06" as ISODate

const entradaCutting: EntradaCalculo = {
  peso_kg: 84, altura_cm: 178, idade: 28, sexo: "M",
  fator_atividade: "ModeramenteAtivo", objetivo: "Cutting",
}
const entradaRecomposicao: EntradaCalculo = {
  peso_kg: 79, altura_cm: 178, idade: 28, sexo: "M",
  fator_atividade: "MuitoAtivo", objetivo: "Recomposicao",
}
const entradaBulk: EntradaCalculo = {
  peso_kg: 76, altura_cm: 178, idade: 28, sexo: "M",
  fator_atividade: "MuitoAtivo", objetivo: "Bulk",
}

export function montarSemente(): DadosSemente {
  const plano1 = arquivar(gerarPlanoAtivo(entradaCutting, "fixture-plano-1", ERA_1_INICIO), ERA_2_INICIO)
  const plano2 = arquivar(gerarPlanoAtivo(entradaRecomposicao, "fixture-plano-2", ERA_2_INICIO), ERA_3_INICIO)
  const plano3 = gerarPlanoAtivo(entradaBulk, "fixture-plano-3", ERA_3_INICIO)

  // Era 1 — começo hesitante: muitos dias parciais, faltas frequentes.
  const dias1 = diasCorridos(ERA_1_INICIO, 31, [1, 2, 1, 0, 2, 1, 2], [3, 9, 10, 17, 24, 25, 31, 38, 45, 52])
  // Era 2 — consolidando: maioria alta, poucos tropeços.
  const dias2 = diasCorridos(ERA_2_INICIO, 42, [3, 2, 3, 3, 2, 1, 3, 2], [6, 13, 20, 27, 34, 41])
  // Era 3 — a era ativa, densa e recente: é a que será aberta na tela de dias.
  const dias3 = diasCorridos(ERA_3_INICIO, 18, [3, 3, 2, 3, 1, 3, 2, 3, 3, 0, 2, 3], [5, 12, 16])

  let seq = 0
  const registros = [
    ...dias1.map((d) => registroDe(plano1, d, seq++)),
    ...dias2.map((d) => registroDe(plano2, d, seq++)),
    ...dias3.map((d) => registroDe(plano3, d, seq++)),
  ]

  const usuario: Usuario = {
    id: ID_USUARIO_LOCAL,
    nome: "Você",
    email: "usuario@exemplo.invalid",
    peso_kg: 76,
    altura_cm: 178,
    idade: 28,
    sexo: "M",
    fator_atividade: "MuitoAtivo",
    objetivo: "Bulk",
    plano_ativo_id: plano3.id as PlanoId,
    criado_em: `${ERA_1_INICIO}T12:00:00.000Z` as ISOTimestamp,
  }

  return { usuario, planos: [plano1, plano2, plano3], registros }
}

// Ids estáveis, para o teste navegar direto a uma era sem depender de clique.
export const ID_ERA_ATIVA = "fixture-plano-3"
export const ID_ERA_ARQUIVADA = "fixture-plano-1"
