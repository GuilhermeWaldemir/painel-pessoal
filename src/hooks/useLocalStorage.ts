import { useEffect, useState } from 'react'

/**
 * Funciona como o useState, mas salva o valor no localStorage do navegador.
 * Assim os dados continuam lá quando você fecha e abre a página de novo.
 *
 * Obs.: o localStorage é por aparelho/navegador. O que você salvar no celular
 * não aparece no PC — isso será resolvido quando migrarmos para o Supabase.
 */
export function useLocalStorage<T>(chave: string, valorInicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const salvo = localStorage.getItem(chave)
      return salvo !== null ? (JSON.parse(salvo) as T) : valorInicial
    } catch {
      return valorInicial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor))
    } catch {
      // Armazenamento cheio ou bloqueado (ex.: aba anônima): segue só em memória.
    }
  }, [chave, valor])

  return [valor, setValor] as const
}
