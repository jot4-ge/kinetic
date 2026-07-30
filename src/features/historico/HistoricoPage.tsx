// Histórico — "Suas eras": os Planos do usuário como uma TIMELINE de capítulos,
// do presente (topo) para o começo da jornada. Cada Plano é uma era numerada; a
// era ativa é o marco em ouro, as arquivadas são marcos sóbrios mas íntegros —
// capítulo encerrado não é capítulo apagado (ADR-0002: Planos são arquivados,
// não substituídos).
//
// "Era" é vocabulário de APRESENTAÇÃO. O domínio continua falando Plano, e esta
// tela continua só lendo: o Plano é imutável e o histórico não escreve nada
// (ADR-0002/0003). Selecionar uma era leva a /historico/:planoId.
//
// Ornamentação (ADR-0016): frontão no título, meandro sob o cabeçalho, linha do
// tempo em ouro desvanecendo para o passado, marcos e molduras de card. Todo o
// ornamento é AMBIENTE; os dados (vigência, kcal, macros) ficam limpos, em mono,
// dentro de suas caixas — a linha inegociável do brand §3.2.
//
// A numeração e a ordem são semânticas, não visuais: a timeline é uma <ol>, de
// modo que a sequência dos capítulos existe para o leitor de tela sem depender
// da linha desenhada.
//
// Lógica pura (numerar, resumir, formatar) vive em historico-core.ts; aqui só há
// carga, apresentação e navegação.

import { useEffect, useState, type ReactNode } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type { Plano, ObjetivoDePlano } from "@/types"
import {
  ordenarPlanosRecentesPrimeiro,
  numerarEras,
  resumirEras,
  formatarContagemEras,
  type Era,
  type ResumoEras,
} from "./historico-core"

const OBJETIVO_LABEL: Record<ObjetivoDePlano, string> = {
  Cutting: "Cutting",
  Manutencao: "Manutenção",
  Bulk: "Bulk",
  Recomposicao: "Recomposição",
}

// Métrica compacta do card (número mono em cima, rótulo pequeno embaixo). O
// número é o protagonista (brand §8) e nada o ornamenta.
function Meta({ valor, unidade, rotulo, destaque }: {
  valor: number
  unidade: string
  rotulo: string
  destaque?: boolean
}) {
  return (
    <div className="eras__meta">
      <span className={destaque ? "eras__meta-valor is-destaque" : "eras__meta-valor"}>
        {valor}
        <span className="eras__meta-unidade"> {unidade}</span>
      </span>
      <span className="eras__meta-rotulo">{rotulo}</span>
    </div>
  )
}

// Um capítulo da timeline: o marco numerado na linha + o card da era.
function ItemEra({ era, onAbrir, onFocar, onDesfocar }: {
  era: Era
  onAbrir: () => void
  onFocar: () => void
  onDesfocar: () => void
}) {
  const { plano, vigencia, ativa, numero } = era

  return (
    <li className={ativa ? "eras__item is-ativa" : "eras__item"}>
      {/* O marco carrega o numeral, que é dado ("qual capítulo é este"). O
          prefixo em texto oculto dá sentido ao número fora do desenho. */}
      <span className="eras__marco">
        <span className="eras__numero">
          <span className="visualmente-oculto">Era </span>
          {numero}
        </span>
      </span>

      <button
        type="button"
        className="eras__card"
        onClick={onAbrir}
        onMouseEnter={onFocar}
        onMouseLeave={onDesfocar}
        onFocus={onFocar}
        onBlur={onDesfocar}
      >
        <span className="eras__topo">
          <span className="eras__vigencia">
            {vigencia.inicio} <span aria-hidden="true">→</span>{" "}
            <span className={ativa ? "eras__vigencia-atual" : undefined}>{vigencia.fim}</span>
          </span>
          {ativa && <span className="eras__selo">Atual</span>}
        </span>

        {/* Span, não heading: o conteúdo de um <button> é achatado num rótulo
            só — um título ali não navega nada e ainda seria HTML inválido. */}
        <span className="eras__objetivo">{OBJETIVO_LABEL[plano.objetivo]}</span>

        <span className="eras__metas">
          <Meta valor={plano.meta_calorica_diaria} unidade="kcal" rotulo="META" destaque={ativa} />
          <Meta valor={plano.meta_proteina_diaria_g} unidade="g" rotulo="PROT" />
          <Meta valor={plano.meta_carboidrato_diaria_g} unidade="g" rotulo="CARB" />
          <Meta valor={plano.meta_gordura_diaria_g} unidade="g" rotulo="GORD" />
          <Meta valor={plano.meta_agua_diaria_ml} unidade="ml" rotulo="ÁGUA" />
        </span>
      </button>
    </li>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="historico__linha">
      <span className="historico__linha-rotulo">{rotulo}</span>
      <span className="historico__linha-valor">{valor}</span>
    </div>
  )
}

// Painel padrão: a jornada inteira. Quantas eras, de quando a quando, e quantos
// dias registrados no total — factual, sem adjetivo (o app registra, não julga).
function PainelJornada({ resumo }: { resumo: ResumoEras }) {
  return (
    <>
      <h2 className="historico__painel-titulo">Sua jornada</h2>
      <span className="historico__painel-legenda">
        {formatarContagemEras(resumo.totalEras, resumo.desde)}
      </span>

      <div className="historico__metrica">
        <span className="historico__metrica-valor">{resumo.totalEras}</span>
        <span className="historico__metrica-rotulo">
          {resumo.totalEras === 1 ? "Era" : "Eras"}
        </span>
      </div>

      <Linha rotulo="Período" valor={resumo.periodo} />
      <Linha rotulo="Dias registrados" valor={String(resumo.diasRegistrados)} />
    </>
  )
}

// Painel da era sob foco (mouse ou teclado). Espelha o padrão do calendário:
// o foco troca o conteúdo do painel; só o clique navega.
export function PainelEra({ era }: { era: Era }) {
  const { plano, vigencia, numero } = era
  return (
    <>
      <h2 className="historico__painel-titulo">Era {numero}</h2>
      <span className="historico__painel-legenda">
        {vigencia.inicio} <span aria-hidden="true">→</span> {vigencia.fim}
      </span>

      <div className="historico__metrica">
        <span className="historico__metrica-valor">
          {plano.meta_calorica_diaria}
          <span className="historico__metrica-unidade"> kcal</span>
        </span>
        <span className="historico__metrica-rotulo">Meta diária</span>
      </div>

      <Linha rotulo="Objetivo" valor={OBJETIVO_LABEL[plano.objetivo]} />
      <Linha rotulo="Proteína" valor={`${plano.meta_proteina_diaria_g} g`} />
      <Linha rotulo="Carboidrato" valor={`${plano.meta_carboidrato_diaria_g} g`} />
      <Linha rotulo="Gordura" valor={`${plano.meta_gordura_diaria_g} g`} />
      <Linha rotulo="Água" valor={`${plano.meta_agua_diaria_ml} ml`} />
      <Linha rotulo="Dias registrados" valor={String(era.diasRegistrados)} />
    </>
  )
}

// Cabeçalho de tela reusado pelas duas visões do Histórico: frontão + meandro.
export function CabecalhoHistorico({ titulo, subtitulo }: {
  titulo: ReactNode
  subtitulo: ReactNode
}) {
  return (
    <>
      <h1 className="historico__frontao">
        <span className="historico__frontao-filete historico__frontao-filete--esq" aria-hidden="true" />
        <span className="historico__frontao-texto">{titulo}</span>
        <span className="historico__frontao-filete" aria-hidden="true" />
      </h1>
      <p className="historico__subtitulo">{subtitulo}</p>
      <span className="historico__meandro" aria-hidden="true" />
    </>
  )
}

export function HistoricoPage() {
  const persistencia = usePersistencia()
  const navigate = useNavigate()

  const [carregando, setCarregando] = useState(true)
  const [eras, setEras] = useState<Era[]>([])
  // Era sob foco/hover. Alimenta o painel SEM alterar a navegação: clicar
  // continua abrindo a era; só o foco troca o conteúdo do painel.
  const [emFoco, setEmFoco] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const planos = await persistencia.planos.listarPorUsuario(ID_USUARIO_LOCAL)
      if (!ativo) return

      const ordenados = ordenarPlanosRecentesPrimeiro(planos)
      // Dias registrados por Plano: o Registro é vinculado ao Plano vigente na
      // época (plano_id imutável, ADR-0003), então contar por Plano é contar os
      // dias daquele capítulo — não os dias do período.
      const contagens = await Promise.all(
        ordenados.map(async (p) => [p.id, (await persistencia.registros.listarPorPlano(p.id)).length] as const),
      )
      if (!ativo) return

      const dias = new Map(contagens)
      setEras(numerarEras(ordenados, (p: Plano) => dias.get(p.id) ?? 0))
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia])

  if (carregando) return null

  // Sem nenhum Plano: quem chega aqui deveria ter ao menos o Ativo, mas tratamos
  // o caso com clareza em vez de renderizar uma lista vazia sem explicação.
  if (eras.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  const resumo = resumirEras(eras)
  const eraEmFoco = eras.find((e) => e.plano.id === emFoco) ?? null

  return (
    <section className="historico">
      <CabecalhoHistorico
        titulo="Suas eras"
        subtitulo="Cada Plano é um capítulo. Selecione uma era para ver seus registros."
      />

      <div className="historico__grid">
        <ol className="eras">
          {eras.map((era) => (
            <ItemEra
              key={era.plano.id}
              era={era}
              onAbrir={() => navigate(`/historico/${era.plano.id}`)}
              onFocar={() => setEmFoco(era.plano.id)}
              onDesfocar={() => setEmFoco((atual) => (atual === era.plano.id ? null : atual))}
            />
          ))}
        </ol>

        {/* Sem aria-live: o conteúdo espelha a era que o próprio foco acabou de
            anunciar. */}
        <aside className="historico__painel">
          {eraEmFoco ? <PainelEra era={eraEmFoco} /> : <PainelJornada resumo={resumo} />}
        </aside>
      </div>
    </section>
  )
}
