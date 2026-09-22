import type { CSSProperties } from 'react'
import { CORES_CAPA } from '../lib/constantes'

/** Capa "gerada": a cor vem do título, então o mesmo livro sempre tem a mesma capa. */
export function Capa({ titulo, pequena = false }: { titulo: string; pequena?: boolean }) {
  const soma = [...titulo].reduce((total, letra) => total + letra.charCodeAt(0), 0)
  const [cor1, cor2] = CORES_CAPA[soma % CORES_CAPA.length]

  return (
    <div
      className={pequena ? 'capa capa-pequena' : 'capa'}
      style={{ '--c1': cor1, '--c2': cor2 } as CSSProperties}
      aria-hidden="true"
    >
      {titulo.trim().charAt(0).toUpperCase()}
    </div>
  )
}
