// Capturas das duas visões do Histórico, nos dois temas, nos dois tamanhos.
//
// Não são testes de asserção visual (sem baseline de comparação): são um
// gerador de evidência para revisão humana do refino, mais algumas asserções
// mínimas que garantem que a tela capturada é a tela certa e está populada — uma
// captura de página vazia passaria despercebida no meio de oito arquivos.
//
// O tema claro/escuro é emulado por prefers-color-scheme, que é exatamente como
// o app resolve a preferência "sistema" (useTheme): sem mexer em localStorage.
//
// Este arquivo deliberadamente não importa nada de src/ nem do harness: o
// carregador do Playwright não passa pelo alias "@" do Vite. O id abaixo é o
// contrato com e2e/harness/semente.ts (ID_ERA_ATIVA).

import { test, expect, type Page } from "@playwright/test"

const ID_ERA_ATIVA = "fixture-plano-3"
const DIAS_DA_ERA_ATIVA = 18

const VISOES = [
  { nome: "eras", rota: "/historico" },
  { nome: "dias", rota: `/historico/${ID_ERA_ATIVA}` },
] as const

const TEMAS = ["light", "dark"] as const

async function abrir(page: Page, rota: string, tema: "light" | "dark") {
  await page.emulateMedia({ colorScheme: tema })
  await page.goto(`/e2e/harness/index.html?rota=${encodeURIComponent(rota)}`)
  await page.waitForSelector("html[data-harness-pronto='sim']")
  // As páginas carregam via efeito assíncrono e renderizam null enquanto isso;
  // esperar o frontão é esperar o conteúdo real, não o shell.
  await page.waitForSelector(".historico__frontao")
  // Fontes assentadas antes da captura, para o texto não sair meio renderizado.
  await page.evaluate(() => document.fonts.ready)
}

// A garantia central desta montagem, verificada em vez de prometida: rodar o
// harness não cria banco algum. Se alguém um dia trocar o adapter em memória
// por createIdbAdapter, ou importar um módulo que abra o banco na carga, este
// teste falha — a lição do ideias.md deixa de depender de disciplina.
test("harness não abre banco nenhum", async ({ page }) => {
  await abrir(page, "/historico", "light")

  const bancos = await page.evaluate(async () => {
    const lista = await indexedDB.databases()
    return lista.map((b) => b.name ?? "(sem nome)")
  })
  expect(bancos).toEqual([])

  // localStorage também intocado — o app real guarda a preferência de tema ali,
  // e o harness emula prefers-color-scheme justamente para não escrever nada.
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

for (const visao of VISOES) {
  for (const tema of TEMAS) {
    test(`${visao.nome} — ${tema}`, async ({ page }, testInfo) => {
      await abrir(page, visao.rota, tema)

      if (visao.nome === "eras") {
        // Três eras, a ativa selada como "Atual".
        await expect(page.locator(".eras__item")).toHaveCount(3)
        await expect(page.locator(".eras__item.is-ativa")).toHaveCount(1)
        await expect(page.getByText("Atual", { exact: true })).toBeVisible()
      } else {
        // Os quatro níveis do indicador aparecem nesta era — é o que a captura
        // precisa provar que está sendo exercitado, não só que a tela abriu.
        await expect(page.locator(".dias__item")).toHaveCount(DIAS_DA_ERA_ATIVA)
        for (const rotulo of [
          "todas as refeições seguidas",
          "maior parte das refeições seguidas",
          "parte das refeições seguidas",
          "nenhuma refeição seguida",
        ]) {
          await expect(page.getByText(rotulo).first()).toBeAttached()
        }
      }

      // ATENÇÃO ao ler estas capturas: fullPage expande a viewport até a altura
      // do documento, e `position: sticky` não tem contra o que grudar quando a
      // viewport é do tamanho da página. Todo elemento sticky aparece aqui na
      // sua posição estática, no topo — é artefato da captura, não do layout.
      // A prova de que o painel acompanha a rolagem está nas capturas "-rolado".
      await page.screenshot({
        path: `e2e/capturas/${visao.nome}-${tema}-${testInfo.project.name}.png`,
        fullPage: true,
      })
    })
  }
}

// Capturas com a página rolada, em viewport real: é onde o aside sticky aparece
// fazendo o que faz. Só desktop — abaixo de 768px o layout é de uma coluna e o
// painel fica abaixo da lista, por desenho (mesmo ritmo do calendário e da tela
// "hoje"), então não há sticky para mostrar.
for (const tema of TEMAS) {
  test(`dias rolado — ${tema}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "o aside sticky só existe ≥768px")

    await abrir(page, `/historico/${ID_ERA_ATIVA}`, tema)
    await page.evaluate(() => window.scrollTo(0, 1800))
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(1800)

    // O painel continua inteiramente na viewport depois da rolagem — se alguém
    // remover o `position: sticky` de .historico__painel, isto falha.
    const painel = page.locator(".historico__painel")
    const caixa = await painel.boundingBox()
    const topo = await painel.evaluate((el) => el.getBoundingClientRect().top)
    const altura = page.viewportSize()!.height
    expect(topo).toBeGreaterThanOrEqual(0)
    expect(topo + (caixa?.height ?? 0)).toBeLessThanOrEqual(altura)

    await page.screenshot({
      path: `e2e/capturas/dias-rolado-${tema}-${testInfo.project.name}.png`,
      fullPage: false,
    })
  })
}
