import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./styles/theme.css"
import "./styles/header.css"
import "./styles/esculturas.css"
import "./styles/indicador-aderencia.css"
import "./styles/calendario.css"
import "./styles/historico.css"
import "./styles/tela-hoje.css"
import { createIdbAdapter, openDb } from "@/persistencia"
import { PersistenciaProvider } from "@/providers/persistencia"
import { Splash } from "@/components/Splash"
import App from "./App.tsx"

// Bootstrap: abre o banco e constrói o adapter ANTES do primeiro render, para
// que a árvore receba uma CamadaDePersistencia pronta por injeção (ADR-0007).
// Trocar o adapter (Camada 2 / Supabase) é uma mudança isolada aqui.

const raiz = createRoot(document.getElementById("root")!)

// Splash com guarda de ~150ms: só é renderizada se o bootstrap demorar mais que
// isso (primeira carga semeia o IndexedDB). Em carga quente o openDb resolve
// antes do timer, que é cancelado, e a splash nunca aparece — sem piscar e sem
// atraso artificial (o app nunca espera pela splash).
const ATRASO_SPLASH_MS = 150
const timerSplash = setTimeout(() => {
  raiz.render(
    <StrictMode>
      <Splash />
    </StrictMode>,
  )
}, ATRASO_SPLASH_MS)

try {
  const db = await openDb()
  const persistencia = createIdbAdapter(db)
  clearTimeout(timerSplash)

  raiz.render(
    <StrictMode>
      <PersistenciaProvider persistencia={persistencia}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistenciaProvider>
    </StrictMode>,
  )
} catch (erro) {
  clearTimeout(timerSplash)
  console.error("Falha ao abrir a Camada de Persistência:", erro)
  raiz.render(
    <main
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "var(--space-6) var(--space-5)",
      }}
    >
      <p>Não foi possível iniciar o armazenamento local.</p>
    </main>,
  )
}
