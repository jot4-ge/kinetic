// Capturas da tela "hoje" (RegistroDoDia) e do header compartilhado, nos dois
// temas e nos dois tamanhos — refino de ornamentação (ADR-0016) + quitação do
// bug de scroll horizontal do header em mobile (docs/ideias.md).
//
// Mesmo padrão de e2e/historico-visual.spec.ts: harness em memória, sem banco,
// tema emulado por prefers-color-scheme (como useTheme resolve "sistema").

import { test, expect, type Page } from "@playwright/test"

async function abrir(page: Page, rota: string, tema: "light" | "dark") {
  await page.emulateMedia({ colorScheme: tema })
  await page.goto(`/e2e/harness/index.html?rota=${encodeURIComponent(rota)}`)
  await page.waitForSelector("html[data-harness-pronto='sim']")
  await page.waitForSelector(".hoje__titulo")
  await page.evaluate(() => document.fonts.ready)
}

const TEMAS = ["light", "dark"] as const

for (const tema of TEMAS) {
  test(`hoje — ${tema}`, async ({ page }, testInfo) => {
    await abrir(page, "/hoje", tema)

    // A tela real, não um esqueleto: título do dia, seções e cards do aside.
    await expect(page.locator(".hoje__titulo")).toBeVisible()
    await expect(page.locator(".refeicao")).toHaveCount(6)
    await expect(page.getByText("Hidratação")).toBeVisible()
    await expect(page.getByText("Atividade")).toBeVisible()
    await expect(page.getByText("Checklist")).toBeVisible()

    // O bug registrado em docs/ideias.md: o header não pode forçar scroll
    // horizontal na página. Medição real, não suposição.
    const larguras = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(larguras.scrollWidth).toBeLessThanOrEqual(larguras.innerWidth)

    await page.screenshot({
      path: `e2e/capturas/hoje-${tema}-${testInfo.project.name}.png`,
      fullPage: true,
    })
  })
}
