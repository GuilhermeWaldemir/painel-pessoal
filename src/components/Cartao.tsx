import type { ReactNode } from 'react'

type CartaoProps = {
  titulo?: ReactNode
  acao?: ReactNode
  className?: string
  children: ReactNode
}

export function Cartao({ titulo, acao, className, children }: CartaoProps) {
  return (
    <section className={['cartao', className].filter(Boolean).join(' ')}>
      {(titulo || acao) && (
        <div className="cartao-cabecalho">
          {titulo && <h2>{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  )
}

export function CabecalhoPagina({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <header className="cabecalho-pagina">
      <h1>{titulo}</h1>
      {subtitulo && <p>{subtitulo}</p>}
    </header>
  )
}
