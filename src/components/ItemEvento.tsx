import { Trash2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { TIPOS_EVENTO } from '../lib/constantes'
import { deISO, quandoRelativo, rotuloMes } from '../lib/datas'
import type { Evento } from '../tipos'

export function ItemEvento({ evento, onRemover }: { evento: Evento; onRemover?: () => void }) {
  const tipo = TIPOS_EVENTO[evento.tipo]
  const detalhes = [evento.hora || 'Dia todo', tipo.rotulo, quandoRelativo(evento.data)]

  return (
    <li className="evento">
      <div className="evento-data">
        <strong>{deISO(evento.data).getDate()}</strong>
        <span>{rotuloMes(evento.data)}</span>
      </div>
      <div className="evento-info">
        <p className="evento-titulo">{evento.titulo}</p>
        <p className="evento-sub">{detalhes.join(' · ')}</p>
      </div>
      <span className="ponto" style={{ '--cor': tipo.cor } as CSSProperties} aria-hidden="true" />
      {onRemover && (
        <button className="botao-icone" onClick={onRemover} aria-label={`Remover "${evento.titulo}"`}>
          <Trash2 size={16} />
        </button>
      )}
    </li>
  )
}
