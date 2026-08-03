#!/usr/bin/env node
// Gera os ícones do PWA a partir do símbolo das três colunas (brand.md §6.1,
// §6.3) — reproduzível: mudou o desenho em simbolo-kinetic.mjs, roda de novo
// (`node scripts/gerar-icones.mjs`) e os arquivos em public/ são
// re-escritos. Não roda no build (não vale adicionar o Chromium do
// Playwright a todo build de CI por um asset que só muda quando o design
// muda) — os PNGs gerados ficam versionados em public/.
//
// Rasteriza via Playwright (já devDependency do projeto para os testes
// visuais — nenhuma lib de imagem nova) em vez de escrever um encoder PNG à
// mão: o SVG é renderizado pelo próprio Chromium, exatamente como qualquer
// navegador o exibiria.

import { chromium } from "@playwright/test"
import { writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { svgAny, svgMaskable } from "./simbolo-kinetic.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.resolve(__dirname, "..", "public")

async function rasterizar(svgMarkup, tamanho, arquivo) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: tamanho, height: tamanho }, deviceScaleFactor: 1 })
    await page.setContent(
      `<!doctype html><html><head><style>html,body{margin:0;padding:0}svg{display:block}</style></head><body>${svgMarkup}</body></html>`,
    )
    const png = await page.locator("svg").screenshot({ omitBackground: false })
    await writeFile(path.join(PUBLIC_DIR, arquivo), png)
    console.log(`✓ ${arquivo} (${tamanho}×${tamanho})`)
  } finally {
    await browser.close()
  }
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true })

  // Favicon: vetor puro, sem rasterizar — escala perfeita em qualquer tamanho.
  await writeFile(path.join(PUBLIC_DIR, "favicon.svg"), svgAny(100))
  console.log("✓ favicon.svg (vetor)")

  await rasterizar(svgAny(192), 192, "pwa-192x192.png")
  await rasterizar(svgAny(512), 512, "pwa-512x512.png")
  await rasterizar(svgMaskable(192), 192, "pwa-maskable-192x192.png")
  await rasterizar(svgMaskable(512), 512, "pwa-maskable-512x512.png")
  // apple-touch-icon: iOS aplica a própria máscara/cantos — mesmo tratamento
  // "quadrado cheio" do maskable, tamanho convencional 180×180.
  await rasterizar(svgMaskable(180), 180, "apple-touch-icon.png")
}

main().catch((erro) => {
  console.error(erro)
  process.exitCode = 1
})
