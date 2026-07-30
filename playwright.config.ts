// Playwright — verificação visual das telas que dependem de histórico acumulado.
//
// O dev server serve o harness (e2e/harness/index.html), que injeta fixtures em
// memória. Nenhum teste daqui abre o IndexedDB do navegador.

import { defineConfig, devices } from "@playwright/test"

const PORTA = 5174

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.saida",
  fullyParallel: true,
  reporter: [["list"]],

  use: {
    baseURL: `http://localhost:${PORTA}`,
    // Sem trace/vídeo: o produto destes testes são as capturas.
    trace: "off",
  },

  webServer: {
    command: `npm run dev -- --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}/e2e/harness/index.html`,
    reuseExistingServer: true,
    timeout: 120_000,
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 960 } },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
})
