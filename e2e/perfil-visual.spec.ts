// Capturas do Perfil ("página de identidade") nos dois temas e nos dois
// tamanhos — última tela alinhada ao brand expressivo (ADR-0016). Mesmo
// padrão de e2e/historico-visual.spec.ts e hoje-visual.spec.ts: harness em
// memória, sem banco, tema emulado por prefers-color-scheme.

import { test, expect, type Page } from "@playwright/test"

async function abrir(page: Page, rota: string, tema: "light" | "dark") {
  await page.emulateMedia({ colorScheme: tema })
  await page.goto(`/e2e/harness/index.html?rota=${encodeURIComponent(rota)}`)
  await page.waitForSelector("html[data-harness-pronto='sim']")
  await page.waitForSelector(".perfil__titulo")
  await page.evaluate(() => document.fonts.ready)
}

const TEMAS = ["light", "dark"] as const

for (const tema of TEMAS) {
  test(`perfil — ${tema}`, async ({ page }, testInfo) => {
    await abrir(page, "/perfil", tema)

    // Bloco de identidade populado a partir da fixture (Plano Ativo = Bulk).
    await expect(page.getByText("Bulk", { exact: true })).toBeVisible()
    await expect(page.locator(".perfil__metrica")).toHaveCount(3)
    await expect(page.getByText("Progresso de peso")).toBeVisible()
    await expect(page.getByText("Gerar novo plano")).toBeVisible()
    await expect(page.getByText("Ver histórico de planos")).toBeVisible()

    // Mesma disciplina de header do refino da home: sem scroll horizontal.
    const larguras = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(larguras.scrollWidth).toBeLessThanOrEqual(larguras.innerWidth)

    await page.screenshot({
      path: `e2e/capturas/perfil-${tema}-${testInfo.project.name}.png`,
      fullPage: true,
    })
  })
}
