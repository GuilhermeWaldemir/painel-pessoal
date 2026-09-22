import type { Sessao } from '../tipos'
import { diasDaSemana } from './datas'

const somar = (sessoes: Sessao[]) => sessoes.reduce((total, s) => total + s.minutos, 0)

export function minutosNoDia(sessoes: Sessao[], data: string) {
  return somar(sessoes.filter((s) => s.data === data))
}

/** Minutos estudados nesta semana. Sem disciplinaId, soma todas. */
export function minutosNaSemana(sessoes: Sessao[], disciplinaId?: string) {
  const semana = new Set(diasDaSemana())
  return somar(
    sessoes.filter((s) => semana.has(s.data) && (disciplinaId === undefined || s.disciplinaId === disciplinaId)),
  )
}
