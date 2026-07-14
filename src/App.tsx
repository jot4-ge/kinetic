// Shell da aplicação. A rota "/" decide o destino (RotaRaiz); /onboarding e
// /hoje são as telas de produto (fases 2 e 3).

import { Route, Routes } from "react-router-dom"
import { ThemeToggle } from "@/components/ThemeToggle"
import { OnboardingPage } from "@/features/onboarding/OnboardingPage"
import { RotaRaiz } from "@/features/onboarding/RotaRaiz"
import { HojePage } from "@/features/hoje/HojePage"

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
        <Route path="/" element={<RotaRaiz />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/hoje" element={<HojePage />} />
      </Routes>
    </Shell>
  )
}

export default App
