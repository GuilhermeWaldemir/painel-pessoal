import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// O service worker guarda uma cópia do app no aparelho. No celular o app quase nunca é
// aberto "do zero" (ele volta do segundo plano), então procuramos versão nova sempre que
// ele volta para a tela e a cada 30 min. Achou? O app recarrega sozinho já atualizado.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registro) {
    if (!registro) return
    const procurarAtualizacao = () => registro.update().catch(() => {})
    setInterval(procurarAtualizacao, 30 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') procurarAtualizacao()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
