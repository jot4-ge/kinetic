// Entrada do harness de verificação visual — NÃO é a entrada do app.
//
// index.html (produção) carrega /src/main.tsx, que abre o IndexedDB. Este
// arquivo é uma entrada paralela, carregada só por e2e/harness/index.html, e a
// única diferença é de onde vêm os dados: criarAdapterMemoria em vez de
// createIdbAdapter(openDb()). Nenhum banco é aberto aqui.
//
// Usa MemoryRouter, não BrowserRouter: a rota inicial vem de ?rota=/historico,
// então o teste abre qualquer tela direto, sem depender do caminho em que o
// dev server serve este HTML.

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import "@/styles/theme.css"
import "@/styles/header.css"
import "@/styles/esculturas.css"
import "@/styles/indicador-aderencia.css"
import "@/styles/calendario.css"
import "@/styles/historico.css"
import "@/styles/tela-hoje.css"
import "@/styles/perfil.css"
import "@/styles/progresso.css"
import { PersistenciaProvider } from "@/providers/persistencia"
import App from "@/App"
import { criarAdapterMemoria } from "./adapter-memoria"
import { montarSemente, type CenarioPesos } from "./semente"

const params = new URLSearchParams(location.search)
const rota = params.get("rota") ?? "/historico"
// ?pesos=vazio|unico|serie — só usado por /progresso (verificação visual da
// fase 2b); omitido, o resto da fixture não muda (equivale a "vazio").
const cenarioPesos = (params.get("pesos") ?? undefined) as CenarioPesos | undefined
const persistencia = criarAdapterMemoria(montarSemente(cenarioPesos))

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistenciaProvider persistencia={persistencia}>
      <MemoryRouter initialEntries={[rota]}>
        <App />
      </MemoryRouter>
    </PersistenciaProvider>
  </StrictMode>,
)

// Sinaliza ao Playwright que a árvore montou — o teste espera por isto em vez
// de dormir um tempo arbitrário.
document.documentElement.dataset.harnessPronto = "sim"
