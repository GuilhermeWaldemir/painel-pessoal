import { CloudOff } from 'lucide-react'
import { useDados } from '../contexto/DadosContext'

/** Faixa no topo quando a última conversa com a nuvem falhou (sem internet, por exemplo). */
export function AvisoSincronizacao() {
  const { estadoSync, sincronizar } = useDados()
  if (estadoSync !== 'erro') return null

  return (
    <div className="aviso-sync" role="status">
      <CloudOff size={18} aria-hidden="true" />
      <p>Sem conexão com a nuvem. Mudanças feitas agora podem não chegar aos outros aparelhos.</p>
      <button className="link link-destaque" onClick={() => sincronizar()}>
        Tentar de novo
      </button>
    </div>
  )
}
