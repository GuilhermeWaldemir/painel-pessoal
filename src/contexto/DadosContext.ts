import { createContext, useContext } from 'react'
import type { Dados } from './DadosProvider'

export const DadosContext = createContext<Dados | null>(null)

/** Acesso a todos os dados do painel e às funções que os alteram, de qualquer componente. */
export function useDados() {
  const dados = useContext(DadosContext)
  if (!dados) throw new Error('useDados precisa ser usado dentro de <DadosProvider>')
  return dados
}
