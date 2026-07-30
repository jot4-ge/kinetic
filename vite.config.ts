import { defineConfig, mergeConfig } from 'vite'
import { defineConfig as defineTestConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const viteConfig = defineConfig({
  plugins: [react()],
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
