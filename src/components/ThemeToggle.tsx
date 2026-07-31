// Toggle de tema — um único botão-ícone que CICLA sistema → claro → escuro →
// sistema a cada clique. Substitui os três botões lado a lado (um por modo),
// que forçavam scroll horizontal no header em mobile (~442px de conteúdo
// contra ~375-390px de viewport — ver docs/ideias.md). O ícone reflete o modo
// ATUAL (meio-círculo = sistema, sol = claro, lua = escuro); o aria-label
// declara o modo atual e a ação, para leitor de tela e navegação por teclado
// (BotaoIcone já é um <button> nativo — focável e ativável por Enter/Espaço).
//
// A lógica de tema (useTheme) não muda — só a UI do controle.

import { useTheme, type PreferenciaTema } from "@/hooks/useTheme"
import { BotaoIcone } from "@/components/BotaoIcone"

const ORDEM_CICLO: readonly PreferenciaTema[] = ["sistema", "light", "dark"]

const ROTULO: Record<PreferenciaTema, string> = {
  sistema: "Sistema",
  light: "Claro",
  dark: "Escuro",
}

function proximaPreferencia(atual: PreferenciaTema): PreferenciaTema {
  const indice = ORDEM_CICLO.indexOf(atual)
  return ORDEM_CICLO[(indice + 1) % ORDEM_CICLO.length]
}

// Ícones — mesmo traço fino dos demais ícones do header (currentColor, 1.5px).

function IconeSistema() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconeClaro() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  )
}

function IconeEscuro() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  )
}

const ICONE: Record<PreferenciaTema, () => React.JSX.Element> = {
  sistema: IconeSistema,
  light: IconeClaro,
  dark: IconeEscuro,
}

export function ThemeToggle() {
  const { preferencia, setPreferencia } = useTheme()
  const proxima = proximaPreferencia(preferencia)
  const Icone = ICONE[preferencia]
  const rotulo = `Tema: ${ROTULO[preferencia]}. Trocar para ${ROTULO[proxima]}.`

  return (
    <BotaoIcone rotulo={rotulo} onClick={() => setPreferencia(proxima)}>
      <Icone />
    </BotaoIcone>
  )
}
