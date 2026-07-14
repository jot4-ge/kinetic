// Shell da aplicação — fundação de UI. Ainda não há tela de produto: as rotas
// /onboarding e /hoje são placeholders que as próximas fases substituem.
// O shell existe para provar que os design tokens (theme.css / brand.md) e o
// roteamento estão de pé nos dois modos de tema.

import { Navigate, Route, Routes } from "react-router-dom"
import { ThemeToggle } from "@/components/ThemeToggle"

function Placeholder({ titulo }: { titulo: string }) {
  return (
    <section style={{ paddingTop: "var(--space-6)" }}>
      <p style={{ color: "var(--text-muted)" }}>{titulo} em breve</p>
    </section>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "480px",
        margin: "0 auto",
        padding: "var(--space-6) var(--space-5)",
        paddingBottom: "calc(var(--space-6) + var(--safe-bottom))",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            letterSpacing: "var(--tracking-wordmark)",
            color: "var(--text)",
          }}
        >
          KINETIC
        </span>
        <ThemeToggle />
      </header>
      {children}
    </div>
  )
}

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Placeholder titulo="Onboarding" />} />
        <Route path="/hoje" element={<Placeholder titulo="Hoje" />} />
      </Routes>
    </Shell>
  )
}

export default App
