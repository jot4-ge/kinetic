// Shell da aplicação. A rota "/" decide o destino (RotaRaiz); /onboarding, /hoje
// e /perfil são as telas de produto.

import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { ThemeToggle } from "@/components/ThemeToggle"
import { BotaoIcone } from "@/components/BotaoIcone"
import { OnboardingPage } from "@/features/onboarding/OnboardingPage"
import { RotaRaiz } from "@/features/onboarding/RotaRaiz"
import { HojePage } from "@/features/hoje/HojePage"
import { DiaPage } from "@/features/hoje/DiaPage"
import { PerfilPage } from "@/features/perfil/PerfilPage"
import { HistoricoPage } from "@/features/historico/HistoricoPage"
import { PlanoRegistrosPage } from "@/features/historico/PlanoRegistrosPage"
import { CalendarioPage } from "@/features/calendario/CalendarioPage"

// Ícones do header — traço fino, herdam currentColor (cor de texto, nunca ouro).
function IconePerfil() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  )
}

function IconeVoltar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

// Ação do header conforme a rota — padrão reutilizável de navegação para áreas
// secundárias: uma única ação por tela, sempre no header. /hoje expõe a entrada
// para /perfil; as demais expõem o retorno, um salto por vez (master → detail):
//   /perfil            → /hoje
//   /historico         → /perfil   (entrada mora no card de Plano do Perfil)
//   /historico/:plano  → /historico
//   /calendario        → /hoje     (entrada mora no ícone de calendário do dia)
//   /dia/:data         → /calendario
// Telas "pré-app" (raiz, onboarding) não têm ação secundária.
function AcaoHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (pathname === "/hoje") {
    return (
      <BotaoIcone rotulo="Perfil" onClick={() => navigate("/perfil")}>
        <IconePerfil />
      </BotaoIcone>
    )
  }

  let voltarPara: string | null = null
  if (pathname === "/perfil") voltarPara = "/hoje"
  else if (pathname === "/historico") voltarPara = "/perfil"
  else if (pathname.startsWith("/historico/")) voltarPara = "/historico"
  else if (pathname === "/calendario") voltarPara = "/hoje"
  else if (pathname.startsWith("/dia/")) voltarPara = "/calendario"

  if (voltarPara) {
    return (
      <BotaoIcone rotulo="Voltar" onClick={() => navigate(voltarPara)}>
        <IconeVoltar />
      </BotaoIcone>
    )
  }
  return null
}

function Shell({ children }: { children: React.ReactNode }) {
  // Telas de duas colunas no desktop (/hoje, /dia/:data e /calendario, que tem
  // grade + painel do mês) abrem a largura; as demais rotas seguem estreitas.
  const { pathname } = useLocation()
  const ampla =
    pathname === "/hoje" || pathname === "/calendario" || pathname.startsWith("/dia/")
  return (
    <div className={ampla ? "app-shell app-shell--ampla" : "app-shell"}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <AcaoHeader />
          <ThemeToggle />
        </div>
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
        <Route path="/calendario" element={<CalendarioPage />} />
        <Route path="/dia/:data" element={<DiaPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/historico" element={<HistoricoPage />} />
        <Route path="/historico/:planoId" element={<PlanoRegistrosPage />} />
      </Routes>
    </Shell>
  )
}

export default App
