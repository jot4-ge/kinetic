// Calendário — grade de um mês, componente próprio (não biblioteca). Peça visual
// de destaque (ADR-0015): navega entre meses, destaca hoje, indica QUÃO BEM cada
// dia registrado foi cumprido e mostra dias futuros desabilitados (não se registra
// o que ainda não aconteceu). Toda a matemática de calendário e a métrica de
// aderência são puras (calendario-core.ts, aderencia-core.ts); aqui só há estado
// de visão (mês exibido, dia com foco), apresentação e teclado.
//
// Ornamentação (ADR-0016 — "voz contida, visual expressivo"): meandro grego no
// topo e no rodapé, colunas de ambiente nas laterais, título em frontão, células
// emolduradas. Todo o ornamento vive na MOLDURA; nenhum passa por cima dos dados
// — os números dos dias e os números do resumo ficam limpos e em mono.
//
// Acessibilidade no escopo: table[role=grid] com roving tabindex (um só dia
// focável por vez), navegação por setas / PageUp-Down / Home-End, foco visível
// (calendario.css) e rótulos aria com data + estado + aderência. Dias futuros
// usam aria-disabled (não o atributo disabled) para permanecerem focáveis e serem
// anunciados como desabilitados. Os pontos do indicador são aria-hidden: seu
// significado já vai por escrito no aria-label da célula.

import { useCallback, useEffect, useRef, useState } from "react"
import type { ISODate } from "@/types"
import { IndicadorAderencia } from "@/components/IndicadorAderencia"
import {
  gerarGradeMes,
  mesAnterior,
  mesProximo,
  primeiroDia,
  diasNoMes,
  rotuloMes,
  partesRotuloMes,
  mesDe,
  somarDias,
  indiceDiaSemana,
  ehDataFutura,
  CABECALHOS_SEMANA,
  type MesAno,
} from "./calendario-core"
import {
  rotuloNivelAderencia,
  formatarDiasRegistrados,
  type ResumoDia,
  type ResumoMes,
} from "./aderencia-core"

// Dados de um mês já agregados pelo chamador (que resolve persistência): o
// resumo de cada dia COM registro, e o resumo do mês inteiro. Dias sem registro
// simplesmente não estão no mapa.
export interface DadosDoMes {
  readonly dias: ReadonlyMap<ISODate, ResumoDia>
  readonly resumo: ResumoMes
}

const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
] as const

// Indexado por getDay() (0 = domingo … 6 = sábado).
const SEMANA_LONGA = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
] as const

// "12 de julho de 2026, quinta-feira" — a data por extenso para o leitor de tela.
function rotuloDataCompleto(data: ISODate): string {
  const [ano, mes, dia] = data.split("-").map(Number)
  return `${dia} de ${MESES_LONGOS[mes - 1]} de ${ano}, ${SEMANA_LONGA[indiceDiaSemana(data)]}`
}

// "12 de julho" — cabeçalho do painel do dia.
function rotuloDataCurto(data: ISODate): string {
  const [, mes, dia] = data.split("-").map(Number)
  return `${dia} de ${MESES_LONGOS[mes - 1]}`
}

function IconeChevron({ direcao }: { direcao: "esquerda" | "direita" }) {
  const d = direcao === "esquerda" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

// Uma linha "rótulo · valor" do painel lateral. O valor em mono, sem ornamento.
function LinhaResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="calendario__linha">
      <span className="calendario__linha-rotulo">{rotulo}</span>
      <span className="calendario__linha-valor">{valor}</span>
    </div>
  )
}

// Painel padrão: o mês inteiro. A aderência média é apresentada de forma FACTUAL —
// sempre o mesmo tratamento visual (ouro, mono), sem adjetivo e sem cor de alerta
// para valores baixos. Um mês de 40% e um de 90% se parecem; só o número muda.
// O app registra, não julga.
function PainelMes({ resumo, rotulo }: { resumo: ResumoMes; rotulo: string }) {
  const media = resumo.aderenciaMediaPct
  return (
    <>
      <h2 className="calendario__painel-titulo">{rotulo}</h2>

      <div className="calendario__metrica">
        <span className="calendario__metrica-valor">
          {media === null ? "—" : `${media}%`}
        </span>
        <span className="calendario__metrica-rotulo">Aderência média</span>
      </div>

      <LinhaResumo
        rotulo="Dias registrados"
        valor={formatarDiasRegistrados(resumo.diasRegistrados, resumo.diasDecorridos)}
      />
      <LinhaResumo rotulo="Dias cheios" valor={String(resumo.diasCheios)} />

      <div className="calendario__distribuicao">
        {([3, 2, 1, 0] as const).map((nivel) => (
          <div key={nivel} className="calendario__distribuicao-linha">
            <IndicadorAderencia nivel={nivel} />
            <span className="calendario__distribuicao-rotulo">{rotuloNivelAderencia(nivel)}</span>
            <span className="calendario__distribuicao-valor">{resumo.distribuicao[nivel]}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// Painel do dia sob foco. Aqui entra o detalhe que ficou de fora dos 3 pontos
// (água, treino/JJ, checklist) — relance simples na grade, detalhe no painel, e
// o detalhe completo mesmo ao abrir o dia.
function PainelDia({ data, resumo, futuro }: {
  data: ISODate
  resumo: ResumoDia | undefined
  futuro: boolean
}) {
  return (
    <>
      <h2 className="calendario__painel-titulo">{rotuloDataCurto(data)}</h2>

      {!resumo ? (
        <p className="calendario__painel-vazio">
          {futuro ? "Dia futuro — ainda não é registrável." : "Sem registro."}
        </p>
      ) : (
        <>
          <div className="calendario__metrica">
            <span className="calendario__metrica-valor">
              {resumo.refeicoesPrevistas === 0
                ? "—"
                : `${resumo.refeicoesSeguidas}/${resumo.refeicoesPrevistas}`}
            </span>
            <span className="calendario__metrica-rotulo">Refeições seguidas</span>
          </div>

          {resumo.aguaMl !== null && (
            <LinhaResumo rotulo="Água" valor={`${resumo.aguaMl} ml`} />
          )}
          {resumo.treino !== null && (
            <LinhaResumo rotulo="Treino" valor={resumo.treino ? "Feito" : "Não feito"} />
          )}
          {resumo.jj !== null && (
            <LinhaResumo rotulo="Jiu-jítsu" valor={resumo.jj ? "Feito" : "Não feito"} />
          )}
          {resumo.checklistTotal > 0 && (
            <LinhaResumo
              rotulo="Checklist"
              valor={`${resumo.checklistFeitos} de ${resumo.checklistTotal}`}
            />
          )}
        </>
      )}
    </>
  )
}

export function Calendario({
  hoje,
  obterDadosDoMes,
  onAbrirDia,
  mesInicial,
  dataAtivaInicial,
}: {
  hoje: ISODate
  // Dados agregados do mês (ano, mes). Deve ser estável (useCallback no chamador):
  // é dependência do efeito de carga.
  obterDadosDoMes: (ano: number, mes: number) => Promise<DadosDoMes>
  // Abrir um dia (não-futuro). O chamador decide a rota (hoje → /hoje; ADR-0015).
  onAbrirDia: (data: ISODate) => void
  mesInicial?: MesAno
  dataAtivaInicial?: ISODate
}) {
  const [mes, setMes] = useState<MesAno>(() => mesInicial ?? mesDe(hoje))
  // dataAtiva = o dia com roving tabindex (o único focável). Mantido sempre dentro
  // do mês exibido para que o alvo do tabindex exista na grade.
  const [dataAtiva, setDataAtiva] = useState<ISODate>(() => dataAtivaInicial ?? hoje)
  const [dados, setDados] = useState<DadosDoMes | null>(null)
  // Dia sob foco de teclado. Alimenta o painel lateral SEM alterar a navegação:
  // clicar continua abrindo o dia; só o foco troca o conteúdo do painel.
  const [dataEmFoco, setDataEmFoco] = useState<ISODate | null>(null)

  const gradeRef = useRef<HTMLTableElement>(null)
  const deveFocarRef = useRef(false)

  // Carrega os dados do mês exibido. Recarrega ao trocar de mês.
  useEffect(() => {
    let ativo = true
    void obterDadosDoMes(mes.ano, mes.mes).then((d) => {
      if (ativo) setDados(d)
    })
    return () => {
      ativo = false
    }
  }, [mes.ano, mes.mes, obterDadosDoMes])

  // Move o foco do teclado para o dia ativo — apenas quando a navegação partiu do
  // teclado (deveFocarRef), nunca no mount nem ao trocar de mês pelos botões.
  useEffect(() => {
    if (!deveFocarRef.current) return
    deveFocarRef.current = false
    gradeRef.current
      ?.querySelector<HTMLButtonElement>(`[data-data="${dataAtiva}"]`)
      ?.focus()
  }, [dataAtiva, mes])

  // Reposiciona o dia ativo em NOVA (mantendo-o dentro do mês visível) e pede foco.
  const moverFoco = useCallback((nova: ISODate) => {
    deveFocarRef.current = true
    setDataAtiva(nova)
    setMes((atual) => {
      const m = mesDe(nova)
      return m.ano === atual.ano && m.mes === atual.mes ? atual : m
    })
  }, [])

  // Troca de mês pelos botões: não rouba o foco (o usuário está no botão). Leva o
  // dia ativo para um alvo válido no novo mês — hoje, se ele cair ali; senão o
  // dia 1 — para o roving tabindex continuar apontando um dia existente.
  function irParaMes(novo: MesAno) {
    setMes(novo)
    const primeiro = primeiroDia(novo.ano, novo.mes)
    const ultimo = somarDias(primeiro, diasNoMes(novo.ano, novo.mes) - 1)
    setDataAtiva(hoje >= primeiro && hoje <= ultimo ? hoje : primeiro)
  }

  function aoTeclar(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowRight": moverFoco(somarDias(dataAtiva, 1)); break
      case "ArrowLeft":  moverFoco(somarDias(dataAtiva, -1)); break
      case "ArrowDown":  moverFoco(somarDias(dataAtiva, 7)); break
      case "ArrowUp":    moverFoco(somarDias(dataAtiva, -7)); break
      case "Home":       moverFoco(somarDias(dataAtiva, -indiceDiaSemana(dataAtiva))); break
      case "End":        moverFoco(somarDias(dataAtiva, 6 - indiceDiaSemana(dataAtiva))); break
      case "PageUp":
      case "PageDown": {
        const alvo = e.key === "PageUp" ? mesAnterior(mes) : mesProximo(mes)
        const dia = Math.min(Number(dataAtiva.split("-")[2]), diasNoMes(alvo.ano, alvo.mes))
        moverFoco(somarDias(primeiroDia(alvo.ano, alvo.mes), dia - 1))
        break
      }
      default: return
    }
    e.preventDefault()
  }

  const grade = gerarGradeMes(mes.ano, mes.mes)
  const rotulo = rotuloMes(mes.ano, mes.mes)
  const partes = partesRotuloMes(mes.ano, mes.mes)

  // O painel só mostra o dia em foco se ele pertence ao mês exibido. Trocar de
  // mês pelos botões não faz o dia perder o foco em toda rota de interação, e o
  // painel não pode ficar descrevendo um dia que saiu da grade.
  const focoNoMes =
    dataEmFoco !== null &&
    mesDe(dataEmFoco).ano === mes.ano &&
    mesDe(dataEmFoco).mes === mes.mes
      ? dataEmFoco
      : null

  return (
    <div className="calendario">
      <div className="calendario__moldura">
        {/* Ornamento de ambiente (brand §7.3): meandro no topo e no rodapé,
            colunas nas laterais. Puramente decorativo — nunca sobre os dados. */}
        <span className="calendario__meandro calendario__meandro--topo" aria-hidden="true" />
        <span className="calendario__coluna calendario__coluna--esq" aria-hidden="true" />
        <span className="calendario__coluna calendario__coluna--dir" aria-hidden="true" />

        <div className="calendario__cabecalho">
          <button
            type="button"
            className="calendario__nav"
            aria-label="Mês anterior"
            onClick={() => irParaMes(mesAnterior(mes))}
          >
            <IconeChevron direcao="esquerda" />
          </button>

          {/* Frontão: título ladeado por filetes dourados (brand §7.3). */}
          <h1 className="calendario__titulo-mes" aria-live="polite">
            <span className="calendario__frontao-filete" aria-hidden="true" />
            <span className="calendario__titulo-texto">
              {partes.mes} <span className="calendario__titulo-ano">{partes.ano}</span>
            </span>
            <span className="calendario__frontao-filete" aria-hidden="true" />
          </h1>

          <button
            type="button"
            className="calendario__nav"
            aria-label="Próximo mês"
            onClick={() => irParaMes(mesProximo(mes))}
          >
            <IconeChevron direcao="direita" />
          </button>
        </div>

        <table
          ref={gradeRef}
          className="calendario__grade"
          role="grid"
          aria-label={`Calendário — ${rotulo}`}
          onKeyDown={aoTeclar}
          onFocus={(e) => {
            const data = (e.target as HTMLElement).dataset?.data
            if (data) setDataEmFoco(data as ISODate)
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDataEmFoco(null)
          }}
        >
          <thead>
            <tr role="row">
              {CABECALHOS_SEMANA.map((c) => (
                <th key={c.longo} role="columnheader" className="calendario__col" scope="col">
                  <abbr title={c.longo} style={{ textDecoration: "none" }}>{c.curto}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grade.map((semana, i) => (
              <tr key={i} role="row">
                {semana.map((cel, j) => {
                  if (!cel) return <td key={j} role="gridcell" className="calendario__celula is-vazia" />
                  const ehHoje = cel.data === hoje
                  const futuro = ehDataFutura(cel.data, hoje)
                  const resumoDia = dados?.dias.get(cel.data)
                  const temRegistro = resumoDia !== undefined
                  const classe = [
                    "calendario__dia",
                    ehHoje && "is-hoje",
                    temRegistro && "tem-registro",
                    futuro && "is-futuro",
                  ].filter(Boolean).join(" ")

                  let rotuloAria = rotuloDataCompleto(cel.data)
                  if (ehHoje) rotuloAria += ", hoje"
                  if (resumoDia) {
                    rotuloAria += resumoDia.nivel === null
                      ? ", com registro"
                      : `, ${rotuloNivelAderencia(resumoDia.nivel)}`
                  }
                  if (futuro) rotuloAria += ", dia futuro — não registrável"

                  return (
                    <td key={j} role="gridcell" className="calendario__celula">
                      <button
                        type="button"
                        className={classe}
                        data-data={cel.data}
                        tabIndex={cel.data === dataAtiva ? 0 : -1}
                        aria-label={rotuloAria}
                        aria-current={ehHoje ? "date" : undefined}
                        aria-disabled={futuro || undefined}
                        onClick={() => {
                          if (futuro) return
                          setDataAtiva(cel.data)
                          onAbrirDia(cel.data)
                        }}
                      >
                        {ehHoje && <span className="calendario__selo" aria-hidden="true">Hoje</span>}
                        <span className="calendario__numero">{cel.dia}</span>
                        {resumoDia && <IndicadorAderencia nivel={resumoDia.nivel} />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <span className="calendario__meandro calendario__meandro--base" aria-hidden="true" />
      </div>

      {/* Painel lateral (desktop) / abaixo da grade (mobile). Sem aria-live: o
          conteúdo espelha o dia que acabou de ser anunciado pelo próprio foco. */}
      <aside className="calendario__painel">
        {dados && (
          focoNoMes
            ? <PainelDia
                data={focoNoMes}
                resumo={dados.dias.get(focoNoMes)}
                futuro={ehDataFutura(focoNoMes, hoje)}
              />
            : <PainelMes resumo={dados.resumo} rotulo={rotulo} />
        )}
      </aside>
    </div>
  )
}
