import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./styles/theme.css"
import { createIdbAdapter, openDb } from "@/persistencia"
import { PersistenciaProvider } from "@/providers/persistencia"
import App from "./App.tsx"

// Bootstrap: abre o banco e constrói o adapter ANTES do primeiro render, para
// que a árvore receba uma CamadaDePersistencia pronta por injeção (ADR-0007).
// Trocar o adapter (Camada 2 / Supabase) é uma mudança isolada aqui.

const raiz = createRoot(document.getElementById("root")!)

try {
  const db = await openDb()
  const persistencia = createIdbAdapter(db)

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
