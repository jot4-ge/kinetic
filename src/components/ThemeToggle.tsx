// Toggle de tema — teste de fumaça da aplicação dos design tokens nos dois
// modos (brand §9). Não é UI de produto: valida que theme.css responde a
// prefers-color-scheme e ao override data-theme. O visual definitivo vem em
// fase posterior.

import { useTheme, type PreferenciaTema } from "@/hooks/useTheme"

const OPCOES: readonly { valor: PreferenciaTema; rotulo: string }[] = [
  { valor: "sistema", rotulo: "Sistema" },
  { valor: "light", rotulo: "Claro" },
  { valor: "dark", rotulo: "Escuro" },
]

export function ThemeToggle() {
  const { preferencia, setPreferencia } = useTheme()

  return (
    <div
      role="group"
      aria-label="Tema"
      style={{ display: "inline-flex", gap: "var(--space-1)" }}
    >
      {OPCOES.map(({ valor, rotulo }) => {
        const ativo = preferencia === valor
        return (
          <button
            key={valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => setPreferencia(valor)}
            style={{
              minHeight: "var(--touch-target-min)",
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-hairline)",
              background: ativo ? "var(--accent)" : "transparent",
              color: ativo ? "var(--on-accent)" : "var(--text)",
              fontFamily: "var(--font-body)",
              fontWeight: ativo
                ? "var(--font-weight-emphasis)"
                : "var(--font-weight-regular)",
              cursor: "pointer",
            }}
          >
            {rotulo}
          </button>
        )
      })}
    </div>
  )
}
