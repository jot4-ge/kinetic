// Indicador de aderência de um dia — os três pontos que o Calendário introduziu
// (ADR-0015/0016) e que o Histórico reusa nos cards de dia.
//
// Vive em components/ porque é linguagem visual compartilhada, não peça de uma
// tela: o usuário aprende "3 pontos = como foi o dia" no calendário e reencontra
// exatamente o mesmo desenho no histórico. O NÍVEL vem de aderencia-core
// (nivelDeAderencia) — aqui não há regra nenhuma, só o desenho.
//
// aria-hidden porque os pontos são visuais: o significado vai por escrito, em
// rotuloNivelAderencia, no rótulo de quem contém o indicador (célula do
// calendário, card do dia). Um indicador sem esse texto ao redor é um bug de
// acessibilidade, não uma escolha.

import type { NivelAderencia } from "@/features/calendario/aderencia-core"

export function IndicadorAderencia({ nivel }: { nivel: NivelAderencia | null }) {
  // Dia registrado cuja proporção não é calculável (sem Plano resolvível, ou dia
  // sem refeições previstas): ponto único — afirma "tem registro" sem afirmar
  // quanto.
  if (nivel === null) {
    return <span className="indicador-aderencia__unico" aria-hidden="true" />
  }

  return (
    <span className="indicador-aderencia" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < nivel ? "indicador-aderencia__ponto is-aceso" : "indicador-aderencia__ponto"}
        />
      ))}
    </span>
  )
}
