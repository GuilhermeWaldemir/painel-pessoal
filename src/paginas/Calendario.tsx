import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { CabecalhoPagina, Cartao } from '../components/Cartao'
import { ItemEvento } from '../components/ItemEvento'
import { useDados } from '../contexto/DadosContext'
import { TIPOS_EVENTO } from '../lib/constantes'
import { dataLonga, hojeISO, inicioDaSemana, mesAno, paraISO, somarDias } from '../lib/datas'
import { compararEventos } from '../lib/eventos'
import type { Evento, TipoEvento } from '../tipos'

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const primeiroDoMes = (data: Date) => new Date(data.getFullYear(), data.getMonth(), 1)

export function Calendario() {
  const { eventos } = useDados()
  const [mes, setMes] = useState(() => primeiroDoMes(new Date()))
  const [selecionado, setSelecionado] = useState(hojeISO)
  const hoje = hojeISO()

  // A grade começa na segunda-feira da semana do dia 1 e tem 6 semanas (42 dias).
  // Se a última semana já for toda do mês seguinte, ela é cortada.
  const inicio = inicioDaSemana(mes)
  let dias = Array.from({ length: 42 }, (_, i) => somarDias(inicio, i))
  if (dias[35].getMonth() !== mes.getMonth()) dias = dias.slice(0, 35)

  // Agrupa os eventos por dia uma vez só, em vez de filtrar a lista inteira para cada quadradinho.
  const porDia = new Map<string, Evento[]>()
  for (const evento of eventos) {
    porDia.set(evento.data, [...(porDia.get(evento.data) ?? []), evento])
  }

  function mudarMes(delta: number) {
    setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1))
  }

  function irParaHoje() {
    setMes(primeiroDoMes(new Date()))
    setSelecionado(hoje)
  }

  return (
    <>
      <CabecalhoPagina titulo="Agenda" subtitulo="Eventos, provas, trabalhos e lembretes" />
      <div className="grade-pagina">
        <Cartao>
          <div className="cal-topo">
            <button className="botao-icone" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
              <ChevronLeft size={20} />
            </button>
            <p className="cal-titulo">{mesAno(mes)}</p>
            <button className="botao-icone" onClick={() => mudarMes(1)} aria-label="Próximo mês">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="cal-grade">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="cal-semana">
                {d}
              </span>
            ))}
            {dias.map((dia) => {
              const iso = paraISO(dia)
              const doDia = porDia.get(iso) ?? []
              const classes = [
                'cal-dia',
                dia.getMonth() !== mes.getMonth() && 'fora',
                iso === hoje && 'hoje',
                iso === selecionado && 'selecionado',
              ]
              return (
                <button
                  key={iso}
                  className={classes.filter(Boolean).join(' ')}
                  onClick={() => setSelecionado(iso)}
                  aria-pressed={iso === selecionado}
                  aria-label={`${dataLonga(iso)}${doDia.length ? `, ${doDia.length} evento(s)` : ''}`}
                >
                  {dia.getDate()}
                  <span className="cal-pontos" aria-hidden="true">
                    {doDia.slice(0, 3).map((e) => (
                      <span key={e.id} style={{ '--cor': TIPOS_EVENTO[e.tipo].cor } as CSSProperties} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>

          <button className="link link-destaque" onClick={irParaHoje}>
            Ir para hoje
          </button>
        </Cartao>

        <DiaSelecionado data={selecionado} eventos={[...(porDia.get(selecionado) ?? [])].sort(compararEventos)} />
      </div>
    </>
  )
}

function DiaSelecionado({ data, eventos }: { data: string; eventos: Evento[] }) {
  const { adicionarEvento, removerEvento } = useDados()
  const [titulo, setTitulo] = useState('')
  const [hora, setHora] = useState('')
  const [tipo, setTipo] = useState<TipoEvento>('evento')

  function adicionar(evento: FormEvent) {
    evento.preventDefault()
    if (!titulo.trim()) return
    adicionarEvento({ titulo: titulo.trim(), data, hora, tipo })
    setTitulo('')
    setHora('')
  }

  return (
    <Cartao titulo={dataLonga(data)}>
      {eventos.length === 0 ? (
        <p className="vazio">Nada marcado neste dia.</p>
      ) : (
        <ul className="lista-eventos">
          {eventos.map((e) => (
            <ItemEvento key={e.id} evento={e} onRemover={() => removerEvento(e.id)} />
          ))}
        </ul>
      )}

      <form onSubmit={adicionar} className="form-grade">
        <input
          className="campo inteiro"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="O que vai acontecer?"
          aria-label="Título do evento"
        />
        <input
          className="campo"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          aria-label="Horário (opcional)"
        />
        <select
          className="campo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoEvento)}
          aria-label="Tipo"
        >
          {Object.entries(TIPOS_EVENTO).map(([valor, { rotulo }]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <button type="submit" className="botao inteiro">
          <Plus size={16} /> Adicionar neste dia
        </button>
      </form>
    </Cartao>
  )
}
