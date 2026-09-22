import { useEffect, useState } from 'react'

/** Devolve a data/hora atual, atualizada a cada `intervaloMs`. Com null, para de atualizar. */
export function useAgora(intervaloMs: number | null) {
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    if (intervaloMs === null) return
    const atualizar = () => setAgora(new Date())
    // Atualiza logo em seguida (o valor guardado pode estar velho) e depois a cada intervalo.
    const primeira = setTimeout(atualizar, 0)
    const id = setInterval(atualizar, intervaloMs)
    return () => {
      clearTimeout(primeira)
      clearInterval(id)
    }
  }, [intervaloMs])

  return agora
}
