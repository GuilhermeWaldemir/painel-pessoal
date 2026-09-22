import { useEffect, useState } from 'react'

export const ABAS = ['inicio', 'tarefas', 'estudos', 'livros', 'calendario'] as const
export type Aba = (typeof ABAS)[number]

function lerAba(): Aba {
  const hash = window.location.hash.slice(1)
  return (ABAS as readonly string[]).includes(hash) ? (hash as Aba) : 'inicio'
}

/**
 * A aba atual fica no "hash" da URL (ex.: /#estudos).
 * Assim o botão "voltar" do celular volta para a aba anterior em vez de fechar o app,
 * sem precisar de uma biblioteca de rotas.
 */
export function useAba() {
  const [aba, setAba] = useState(lerAba)

  useEffect(() => {
    function aoMudar() {
      setAba(lerAba())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])

  return aba
}
