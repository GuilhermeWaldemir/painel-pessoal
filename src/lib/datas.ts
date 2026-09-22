import type { Periodo } from '../tipos'

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/**
 * Data no formato 'AAAA-MM-DD' usando o fuso do aparelho.
 * Não usamos toISOString() porque ele converte para UTC: às 22h no Brasil já seria "amanhã".
 */
export function paraISO(data: Date) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`
}

export function deISO(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export const hojeISO = () => paraISO(new Date())

export function somarDias(data: Date, dias: number) {
  const nova = new Date(data)
  nova.setDate(nova.getDate() + dias)
  return nova
}

/** Segunda-feira da semana. (getDay() devolve domingo = 0, por isso o ajuste.) */
export function inicioDaSemana(data = new Date()) {
  const dia = new Date(data.getFullYear(), data.getMonth(), data.getDate())
  return somarDias(dia, -((dia.getDay() + 6) % 7))
}

export function diasDaSemana(data = new Date()) {
  const inicio = inicioDaSemana(data)
  return Array.from({ length: 7 }, (_, i) => paraISO(somarDias(inicio, i)))
}

/** Identifica "hoje" (para tarefas diárias) ou "esta semana" (para semanais). */
export function chavePeriodo(periodo: Periodo, data = new Date()) {
  return periodo === 'dia' ? paraISO(data) : paraISO(inicioDaSemana(data))
}

/** Quantos dias faltam até a data (negativo = já passou). */
export function diasAte(iso: string) {
  // Math.round compensa dias com 23h/25h (horário de verão).
  return Math.round((deISO(iso).getTime() - deISO(hojeISO()).getTime()) / 86_400_000)
}

export function quandoRelativo(iso: string) {
  const dias = diasAte(iso)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  return dias > 0 ? `em ${dias} dias` : `há ${-dias} dias`
}

export function formatarMinutos(minutos: number) {
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// Intl.DateTimeFormat já sabe os nomes de dias e meses em português.
const fmtDiaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const fmtDataLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtDataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const fmtMesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
export const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

const semPonto = (texto: string) => texto.replace('.', '')
const maiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

export const rotuloDiaSemana = (iso: string) => maiuscula(semPonto(fmtDiaSemana.format(deISO(iso))))
export const rotuloMes = (iso: string) => semPonto(fmtMes.format(deISO(iso)))
export const dataLonga = (iso: string) => maiuscula(fmtDataLonga.format(deISO(iso)))
export const dataCurta = (iso: string) => fmtDataCurta.format(deISO(iso))
export const mesAno = (data: Date) => maiuscula(fmtMesAno.format(data))
