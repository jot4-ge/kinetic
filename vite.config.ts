import { defineConfig, mergeConfig } from 'vite'
import { defineConfig as defineTestConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

const viteConfig = defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Precache do build via Workbox (generateSW) — sem SW manual.
      // registerType 'prompt': a app decide quando ativar a versão nova
      // (useRegisterSW em @/components/AtualizacaoPWA), em vez de recarregar
      // sozinha e derrubar um formulário no meio do preenchimento.
      registerType: 'prompt',
      // Registro feito à mão via virtual:pwa-register/react (useRegisterSW),
      // não pelo script auto-injetado padrão do plugin.
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'Kinetic',
        short_name: 'Kinetic',
        description: 'Plano de treino e dieta, registro diário e progresso — local, sem nuvem.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // .app-shell--ampla já tem layout de duas colunas ≥768px (tela
        // "hoje" no desktop) — travar em portrait bloquearia esse layout em
        // tablets/foldables landscape. Sem trava: o SO/usuário decide.
        orientation: 'any',
        // Negro (brand §4.2) — combina com a Splash (sempre escura,
        // independente do tema) e com o wordmark sobre fundo negro.
        background_color: '#0A0806',
        theme_color: '#0A0806',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache de tudo que o build gera: HTML/JS/CSS, ícones, fontes
        // auto-hospedadas (woff2) e as esculturas (webp) — offline-first
        // completo, sem exceção de asset.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webp,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})

export default mergeConfig(
  viteConfig,
  defineTestConfig({
    test: {
      environment: 'node',
      // Só os testes de unidade/integração de src. e2e/ é do Playwright (roda em
      // navegador, com `npm run test:visual`); sem este recorte o Vitest tenta
      // executar os .spec.ts de lá e quebra.
      include: ['src/**/*.test.{ts,tsx}'],
    },
  })
)
