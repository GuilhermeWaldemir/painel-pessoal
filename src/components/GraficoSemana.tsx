import { useDados } from '../contexto/DadosContext'
import { diasDaSemana, formatarMinutos, hojeISO, rotuloDiaSemana } from '../lib/datas'
import { minutosNoDia } from '../lib/estudos'
import { GraficoBarras } from './graficos'

/** Minutos de estudo em cada dia desta semana (segunda a domingo). */
export function GraficoSemana() {
  const { sessoes } = useDados()
  const hoje = hojeISO()

  const dados = diasDaSemana().map((dia) => ({
    rotulo: rotuloDiaSemana(dia),
    valor: minutosNoDia(sessoes, dia),
    destaque: dia === hoje,
  }))

  return <GraficoBarras dados={dados} formatar={formatarMinutos} />
}
