// Preferência de tema — dark/light seguindo prefers-color-scheme por padrão,
// com override manual persistido (brand §9; tokens em src/styles/theme.css).
//
// Como o CSS resolve cada valor:
//   'sistema' → sem atributo data-theme → prefers-color-scheme decide
//   'light'   → data-theme="light" → força claro (exclui o bloco @media dark)
//   'dark'    → data-theme="dark"  → força escuro
//
// theme.css já contém as três regras; este hook alterna o atributo no <html>
// e também mantém <meta name="theme-color"> (index.html) sincronizado — a
// barra do sistema/PWA instalado deve acompanhar o tema em uso, não só o
// valor estático de manifest.theme_color (que só vale para a splash nativa).

import { useCallback, useEffect, useState } from "react"

export type PreferenciaTema = "sistema" | "light" | "dark"

const STORAGE_KEY = "kinetic-tema"

// Espelham --bg de theme.css (light "Carrara" / dark "Negro") — só para o
// meta theme-color; a fonte da verdade visual continua sendo o CSS.
const BG_CLARO = "#F5F3EE"
const BG_ESCURO = "#0A0806"

function lerPreferencia(): PreferenciaTema {
  const salvo = localStorage.getItem(STORAGE_KEY)
  return salvo === "light" || salvo === "dark" ? salvo : "sistema"
}

function prefereSistemaEscuro(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function aplicarThemeColor(pref: PreferenciaTema): void {
  const cor = pref === "light" ? BG_CLARO : pref === "dark" ? BG_ESCURO : prefereSistemaEscuro() ? BG_ESCURO : BG_CLARO
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", cor)
}

function aplicar(pref: PreferenciaTema): void {
  const raiz = document.documentElement
  if (pref === "sistema") {
    raiz.removeAttribute("data-theme")
  } else {
    raiz.setAttribute("data-theme", pref)
  }
  aplicarThemeColor(pref)
}

export function useTheme() {
  const [preferencia, setPreferenciaState] = useState<PreferenciaTema>(lerPreferencia)

  // Reaplica quando a preferência muda (e no mount, cobrindo o valor inicial).
  useEffect(() => {
    aplicar(preferencia)
  }, [preferencia])

  // Em 'sistema', o SO pode trocar de tema com a app aberta — sem isto, o
  // CSS (media query) acompanha ao vivo mas o theme-color ficaria parado no
  // valor de quando a preferência foi setada por último.
  useEffect(() => {
    if (preferencia !== "sistema") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const ouvir = () => aplicarThemeColor(preferencia)
    mq.addEventListener("change", ouvir)
    return () => mq.removeEventListener("change", ouvir)
  }, [preferencia])

  const setPreferencia = useCallback((pref: PreferenciaTema) => {
    if (pref === "sistema") {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, pref)
    }
    setPreferenciaState(pref)
  }, [])

  return { preferencia, setPreferencia }
}
