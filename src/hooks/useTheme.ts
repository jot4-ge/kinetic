// Preferência de tema — dark/light seguindo prefers-color-scheme por padrão,
// com override manual persistido (brand §9; tokens em src/styles/theme.css).
//
// Como o CSS resolve cada valor:
//   'sistema' → sem atributo data-theme → prefers-color-scheme decide
//   'light'   → data-theme="light" → força claro (exclui o bloco @media dark)
//   'dark'    → data-theme="dark"  → força escuro
//
// theme.css já contém as três regras; este hook só alterna o atributo no <html>.

import { useCallback, useEffect, useState } from "react"

export type PreferenciaTema = "sistema" | "light" | "dark"

const STORAGE_KEY = "kinetic-tema"

function lerPreferencia(): PreferenciaTema {
  const salvo = localStorage.getItem(STORAGE_KEY)
  return salvo === "light" || salvo === "dark" ? salvo : "sistema"
}

function aplicar(pref: PreferenciaTema): void {
  const raiz = document.documentElement
  if (pref === "sistema") {
    raiz.removeAttribute("data-theme")
  } else {
    raiz.setAttribute("data-theme", pref)
  }
}

export function useTheme() {
  const [preferencia, setPreferenciaState] = useState<PreferenciaTema>(lerPreferencia)

  // Reaplica quando a preferência muda (e no mount, cobrindo o valor inicial).
  useEffect(() => {
    aplicar(preferencia)
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
