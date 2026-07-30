// Histórico — os dias registrados de UMA era (/historico/:planoId). Cada dia é
// um card com o mesmo indicador de aderência de 3 pontos do calendário: o
// usuário já aprendeu ali que "3 pontos = como foi o dia", e reencontra o mesmo
// desenho aqui. A regra do nível é a de aderencia-core, reusada — não há lógica
// de aderência nesta tela.
//
// Um Registro feito num Plano antigo aparece sob ELE, não sob o Plano novo: o
// vínculo é o plano_id imutável do Registro (ADR-0002/0003). Por isso o nível de
// cada dia é medido contra o Plano DESTA era, que é exatamente o Plano ao qual o
// Registro está vinculado.
//
// Sem gráficos nem agregação nova: só a listagem que já existia, agora
// emoldurada. Lógica de ordenar/resumir vive em historico-core.ts; o painel
// lateral e o cabeçalho são compartilhados com a tela de eras (HistoricoPage).

import { useEffect, useState, type ReactNode } from "react"
import { Navigate, useParams } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { EstadoVazio } from "@/components/EstadoVazio"
import { IndicadorAderencia } from "@/components/IndicadorAderencia"
import {
  nivelDeAderencia,
  rotuloNivelAderencia,
  type NivelAderencia,
} from "@/features/calendario/aderencia-core"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type { Plano, RegistroDeAderencia, PlanoId, ObjetivoDePlano } from "@/types"
import { CabecalhoHistorico, PainelEra } from "./HistoricoPage"
import {
  ordenarPlanosRecentesPrimeiro,
  numerarEras,
  ordenarRegistrosCronologico,
  nomesRefeicoesDoPlano,
  resumirRegistro,
  type Era,
  type ResumoRegistro,
} from "./historico-core"

const OBJETIVO_LABEL: Record<ObjetivoDePlano, string> = {
  Cutting: "Cutting",
  Manutencao: "Manutenção",
  Bulk: "Bulk",
  Recomposicao: "Recomposição",
}

// Um dia já pronto para exibição: o resumo cru + o nível de aderência daquele
// dia. O nível fica fora do ResumoRegistro porque depende do Plano (o
// denominador de refeições previstas vive nele, não no Registro).
interface DiaExibicao {
  readonly resumo: ResumoRegistro
  readonly nivel: NivelAderencia | null
}

// Uma linha de atributo do dia: rótulo curto + valor. Feito/não feito sem cor
// semântica vibrante — o brand reserva ouro a métricas-chave e evita verde/
// vermelho puros. "sim/não" carrega o estado; o mono carrega os números.
function Atributo({ rotulo, mono, children }: {
  rotulo: string
  mono?: boolean
  children: ReactNode
}) {
  return (
    <div className="dias__atributo">
      <span className="dias__atributo-rotulo">{rotulo}</span>
      <span className={mono ? "dias__atributo-valor is-mono" : "dias__atributo-valor"}>
        {children}
      </span>
    </div>
  )
}

function CardDia({ dia, metaAguaMl }: { dia: DiaExibicao; metaAguaMl: number }) {
  const { resumo, nivel } = dia
  const seguidas = resumo.refeicoesSeguidas

  return (
    <li className="dias__item">
      <div className="dias__cabecalho">
        <span className="dias__data">{resumo.data}</span>
        {/* Os pontos são aria-hidden; o significado vai em texto ao lado deles
            (oculto visualmente, porque o desenho já o diz a quem enxerga). */}
        <span>
          <span className="visualmente-oculto">
            {nivel === null ? "Com registro" : rotuloNivelAderencia(nivel)}
          </span>
          <IndicadorAderencia nivel={nivel} />
        </span>
      </div>

      <Atributo rotulo="Refeições seguidas">
        {seguidas.length === 0 ? (
          <span className="dias__ausente">nenhuma</span>
        ) : (
          seguidas.join(", ")
        )}
      </Atributo>
      <Atributo rotulo="Treino">{resumo.treinoRealizado ? "sim" : "não"}</Atributo>
      <Atributo rotulo="Jiu-jitsu">{resumo.jjRealizado ? "sim" : "não"}</Atributo>
      <Atributo rotulo="Água" mono>
        {resumo.aguaConsumidaMl}
        <span className="dias__ausente"> / {metaAguaMl} ml</span>
      </Atributo>
    </li>
  )
}

interface EstadoCarregado {
  era: Era
  dias: DiaExibicao[]
}

export function PlanoRegistrosPage() {
  const persistencia = usePersistencia()
  const { planoId } = useParams<{ planoId: string }>()

  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [estado, setEstado] = useState<EstadoCarregado | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      if (!planoId) {
        setNaoEncontrado(true)
        setCarregando(false)
        return
      }

      // Todos os Planos, porque o NÚMERO da era é cronológico: saber que este é
      // o capítulo 2 exige saber quantos vieram antes (historico-core.numerarEras).
      const [planos, registros] = await Promise.all([
        persistencia.planos.listarPorUsuario(ID_USUARIO_LOCAL),
        persistencia.registros.listarPorPlano(planoId as PlanoId),
      ])
      if (!ativo) return

      const eras = numerarEras(
        ordenarPlanosRecentesPrimeiro(planos),
        (p: Plano) => (p.id === planoId ? registros.length : 0),
      )
      const era = eras.find((e) => e.plano.id === planoId)
      if (!era) {
        setNaoEncontrado(true)
        setCarregando(false)
        return
      }

      const nomes = nomesRefeicoesDoPlano(era.plano)
      setEstado({
        era,
        dias: ordenarRegistrosCronologico(registros).map((r: RegistroDeAderencia) => ({
          resumo: resumirRegistro(r, nomes),
          nivel: nivelDeAderencia(r, era.plano),
        })),
      })
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia, planoId])

  if (carregando) return null
  if (naoEncontrado || !estado) return <Navigate to="/historico" replace />

  const { era, dias } = estado
  const { plano, vigencia } = era

  return (
    <section className="historico">
      <CabecalhoHistorico
        titulo={`Era ${era.numero}`}
        subtitulo={
          <>
            {OBJETIVO_LABEL[plano.objetivo]} · {vigencia.inicio}{" "}
            <span aria-hidden="true">→</span>{" "}
            <span className={era.ativa ? "eras__vigencia-atual" : undefined}>{vigencia.fim}</span>
          </>
        }
      />

      <div className="historico__grid">
        <div>
          {dias.length === 0 ? (
            <div className="historico__vazio">
              <EstadoVazio>
                <p className="historico__vazio-titulo">Nenhum registro neste plano.</p>
                <p className="historico__vazio-texto">
                  {vigencia.ativo
                    ? "Registre sua aderência na tela de hoje e ela aparece aqui."
                    : "Este plano foi arquivado sem registros de aderência."}
                </p>
              </EstadoVazio>
            </div>
          ) : (
            <ol className="dias">
              {dias.map((dia) => (
                <CardDia
                  key={dia.resumo.registroId}
                  dia={dia}
                  metaAguaMl={plano.meta_agua_diaria_ml}
                />
              ))}
            </ol>
          )}
        </div>

        <aside className="historico__painel">
          <PainelEra era={era} />
        </aside>
      </div>
    </section>
  )
}
