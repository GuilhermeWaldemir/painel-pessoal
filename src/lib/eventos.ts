import type { Evento } from '../tipos'
import { hojeISO } from './datas'

/** Ordena por data e, no mesmo dia, por horário (eventos "dia todo" primeiro). */
export function compararEventos(a: Evento, b: Evento) {
  return a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora)
}

export function proximosEventos(eventos: Evento[], filtro?: (e: Evento) => boolean) {
  const hoje = hojeISO()
  return eventos.filter((e) => e.data >= hoje && (!filtro || filtro(e))).sort(compararEventos)
}
