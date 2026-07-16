// Botão de ícone — primitiva reutilizável para navegação de áreas secundárias
// no header (padrão estabelecido nesta fase). Cor de texto, nunca ouro: o ouro
// é reservado a métricas e CTAs primários (brand §4.3). Alvo de toque de 44×44
// (brand §9). O rótulo acessível é obrigatório — o ícone sozinho não basta.

import type { CSSProperties, ReactNode } from "react"

const estilo: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: "var(--touch-target-min)",
  height: "var(--touch-target-min)",
  padding: 0,
  background: "transparent",
  border: "none",
  borderRadius: "var(--radius-sm)",
  color: "var(--text)",
  cursor: "pointer",
}

export function BotaoIcone({
  rotulo,
  onClick,
  children,
}: {
  rotulo: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" aria-label={rotulo} onClick={onClick} style={estilo}>
      {children}
    </button>
  )
}
