// Calendário — grade de um mês, componente próprio (não biblioteca). Peça visual
// de destaque (ADR-0015): navega entre meses, destaca hoje, marca dias com
// Registro e mostra dias futuros desabilitados (não se registra o que ainda não
// aconteceu). Toda a matemática de calendário é pura (calendario-core.ts); aqui
// só há estado de visão (mês exibido, dia com foco), apresentação e teclado.
//
// Acessibilidade no escopo: table[role=grid] com roving tabindex (um só dia
// focável por vez), navegação por setas / PageUp-Down / Home-End, foco visível
// (calendario.css) e rótulos aria com data + estado. Dias futuros usam
// aria-disabled (não o atributo disabled) para permanecerem focáveis e serem
// anunciados como desabilitados.

import { useCallback, useEffect, useRef, useState } from "react"
import type { ISODate } from "@/types"
import {
  gerarGradeMes,
  mesAnterior,
  mesProximo,
  primeiroDia,
  diasNoMes,
  rotuloMes,
  mesDe,
  somarDias,
  indiceDiaSemana,
  ehDataFutura,
  CABECALHOS_SEMANA,
  type MesAno,
} from "./calendario-core"

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

function IconeChevron({ direcao }: { direcao: "esquerda" | "direita" }) {
  const d = direcao === "esquerda" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export function Calendario({
  hoje,
  obterDiasComRegistro,
  onAbrirDia,
  mesInicial,
  dataAtivaInicial,
}: {
  hoje: ISODate
  // Dias do mês (ano, mes) que já têm Registro — para marcá-los. Deve ser estável
  // (useCallback no chamador): é dependência do efeito de carga.
  obterDiasComRegistro: (ano: number, mes: number) => Promise<Set<ISODate>>
  // Abrir um dia (não-futuro). O chamador decide a rota (hoje → /hoje; ADR-0015).
  onAbrirDia: (data: ISODate) => void
  mesInicial?: MesAno
  dataAtivaInicial?: ISODate
}) {
  const [mes, setMes] = useState<MesAno>(() => mesInicial ?? mesDe(hoje))
  // dataAtiva = o dia com roving tabindex (o único focável). Mantido sempre dentro
  // do mês exibido para que o alvo do tabindex exista na grade.
  const [dataAtiva, setDataAtiva] = useState<ISODate>(() => dataAtivaInicial ?? hoje)
  const [diasComRegistro, setDiasComRegistro] = useState<Set<ISODate>>(() => new Set())

  const gradeRef = useRef<HTMLTableElement>(null)
  const deveFocarRef = useRef(false)

  // Carrega os dias com Registro do mês exibido. Recarrega ao trocar de mês.
  useEffect(() => {
    let ativo = true
    void obterDiasComRegistro(mes.ano, mes.mes).then((dias) => {
      if (ativo) setDiasComRegistro(dias)
    })
    return () => {
      ativo = false
    }
  }, [mes.ano, mes.mes, obterDiasComRegistro])

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

  return (
    <div className="calendario">
      <div className="calendario__cabecalho">
        <button
          type="button"
          className="calendario__nav"
          aria-label="Mês anterior"
          onClick={() => irParaMes(mesAnterior(mes))}
        >
          <IconeChevron direcao="esquerda" />
        </button>
        <h1 className="calendario__titulo-mes" aria-live="polite">{rotulo}</h1>
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
                if (!cel) return <td key={j} role="gridcell" className="calendario__celula" />
                const ehHoje = cel.data === hoje
                const futuro = ehDataFutura(cel.data, hoje)
                const temRegistro = diasComRegistro.has(cel.data)
                const classe = [
                  "calendario__dia",
                  ehHoje && "is-hoje",
                  temRegistro && "tem-registro",
                  futuro && "is-futuro",
                ].filter(Boolean).join(" ")

                let rotuloAria = rotuloDataCompleto(cel.data)
                if (ehHoje) rotuloAria += ", hoje"
                if (temRegistro) rotuloAria += ", com registro"
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
                      {cel.dia}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="calendario__legenda">
        <span className="calendario__legenda-item">
          <span className="calendario__legenda-anel" aria-hidden="true" />
          Hoje
        </span>
        <span className="calendario__legenda-item">
          <span className="calendario__legenda-ponto" aria-hidden="true" />
          Com registro
        </span>
      </div>
    </div>
  )
}
