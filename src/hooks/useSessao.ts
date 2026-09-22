import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Sessão de login atual.
 * undefined = ainda verificando, null = ninguém logado, Session = logado.
 */
export function useSessao() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    // Dispara na hora com a sessão salva no aparelho, e de novo a cada login/logout.
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => setSessao(novaSessao))
    return () => data.subscription.unsubscribe()
  }, [])

  return sessao
}
