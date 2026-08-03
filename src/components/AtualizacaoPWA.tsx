// Aviso de nova versão do Service Worker (registerType: 'prompt' em
// vite.config.ts) — a app nunca recarrega sozinha: um reload surpresa
// derrubaria quem está no meio de preencher o onboarding ou registrar uma
// refeição. useRegisterSW regista o SW e expõe needRefresh quando uma versão
// nova já baixou e está esperando para assumir.
//
// "Depois" só esconde o aviso nesta sessão — o SW novo continua esperando e
// assume normalmente na próxima vez que todas as abas fecharem (padrão do
// Workbox), sem exigir nada do usuário.

import { useRegisterSW } from "virtual:pwa-register/react"

export function AtualizacaoPWA() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(erro) {
      console.error("Falha ao registrar o service worker:", erro)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="atualizacao-pwa" role="status">
      <p className="atualizacao-pwa__texto">Nova versão disponível.</p>
      <div className="atualizacao-pwa__acoes">
        <button
          type="button"
          className="atualizacao-pwa__depois"
          onClick={() => setNeedRefresh(false)}
        >
          Depois
        </button>
        <button
          type="button"
          className="atualizacao-pwa__atualizar"
          onClick={() => void updateServiceWorker(true)}
        >
          Atualizar
        </button>
      </div>
    </div>
  )
}
