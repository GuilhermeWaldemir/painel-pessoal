import { Plus, Trash2 } from 'lucide-react'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { CabecalhoPagina, Cartao } from '../components/Cartao'
import { BarraProgresso } from '../components/graficos'
import { GraficoSemana } from '../components/GraficoSemana'
import { ItemEvento } from '../components/ItemEvento'
import { TimerFoco } from '../components/TimerFoco'
import { useDados } from '../contexto/DadosContext'
import { dataCurta, formatarMinutos, hojeISO } from '../lib/datas'
import { minutosNaSemana } from '../lib/estudos'
import { proximosEventos } from '../lib/eventos'

export function Estudos() {
  return (
    <>
      <CabecalhoPagina titulo="Estudos" subtitulo="Foco, metas da semana e provas" />
      <div className="grade-pagina">
        <Cartao titulo="Timer de foco">
          <TimerFoco completo />
        </Cartao>
        <CartaoSemana />
        <CartaoDisciplinas />
        <CartaoProvas />
        <CartaoSessoes />
      </div>
    </>
  )
}

function CartaoSemana() {
  const { sessoes, disciplinas } = useDados()
  const total = minutosNaSemana(sessoes)
  const meta = disciplinas.reduce((soma, d) => soma + d.metaMinSemana, 0)

  return (
    <Cartao
      titulo="Esta semana"
      acao={
        <span className="pilula">
          {formatarMinutos(total)}
          {meta > 0 && ` de ${formatarMinutos(meta)}`}
        </span>
      }
    >
      <GraficoSemana />
    </Cartao>
  )
}

function CartaoDisciplinas() {
  const { disciplinas, sessoes, adicionarDisciplina, removerDisciplina } = useDados()
  const [nome, setNome] = useState('')
  const [metaHoras, setMetaHoras] = useState('4')

  function adicionar(evento: FormEvent) {
    evento.preventDefault()
    if (!nome.trim()) return
    adicionarDisciplina(nome.trim(), Number(metaHoras) || 0)
    setNome('')
  }

  return (
    <Cartao titulo="Disciplinas">
      <form onSubmit={adicionar} className="linha-form">
        <input
          className="campo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Cálculo I"
          aria-label="Nome da disciplina"
        />
        <input
          className="campo campo-curto"
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={metaHoras}
          onChange={(e) => setMetaHoras(e.target.value)}
          aria-label="Meta de horas por semana"
          title="Meta de horas por semana"
        />
        <button type="submit" className="botao botao-quadrado" aria-label="Adicionar disciplina">
          <Plus size={20} />
        </button>
      </form>
      <p className="legenda">O número é a meta de horas por semana.</p>

      {disciplinas.length === 0 ? (
        <p className="vazio">Cadastre suas matérias para acompanhar as horas de cada uma.</p>
      ) : (
        <ul className="lista-simples">
          {disciplinas.map((d) => {
            const feito = minutosNaSemana(sessoes, d.id)
            return (
              <li key={d.id}>
                <div className="disciplina-topo">
                  <span className="ponto" style={{ '--cor': d.cor } as CSSProperties} aria-hidden="true" />
                  <span className="disciplina-nome">{d.nome}</span>
                  <span className="legenda">
                    {formatarMinutos(feito)}
                    {d.metaMinSemana > 0 && ` / ${formatarMinutos(d.metaMinSemana)}`}
                  </span>
                  <button
                    className="botao-icone"
                    onClick={() => removerDisciplina(d.id)}
                    aria-label={`Remover ${d.nome}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <BarraProgresso valor={d.metaMinSemana ? feito / d.metaMinSemana : 0} cor={d.cor} />
              </li>
            )
          })}
        </ul>
      )}
    </Cartao>
  )
}

function CartaoProvas() {
  const { eventos } = useDados()
  const provas = proximosEventos(eventos, (e) => e.tipo === 'prova' || e.tipo === 'trabalho').slice(0, 5)

  return (
    <Cartao titulo="Provas e trabalhos" acao={<a href="#calendario" className="link">Agenda</a>}>
      {provas.length === 0 ? (
        <p className="vazio">
          Nenhuma prova marcada. Adicione na <a href="#calendario">agenda</a> com o tipo "Prova" ou "Trabalho".
        </p>
      ) : (
        <ul className="lista-eventos">
          {provas.map((e) => (
            <ItemEvento key={e.id} evento={e} />
          ))}
        </ul>
      )}
    </Cartao>
  )
}

function CartaoSessoes() {
  const { sessoes, disciplinas, registrarSessao, removerSessao } = useDados()
  const [disciplinaId, setDisciplinaId] = useState('')
  const [minutos, setMinutos] = useState('30')
  const [data, setData] = useState(hojeISO)

  const recentes = [...sessoes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8)
  const nomeDe = (id: string | null) => disciplinas.find((d) => d.id === id)
  const nomeDisciplina = (id: string | null) => nomeDe(id)?.nome ?? 'Foco livre'

  function registrar(evento: FormEvent) {
    evento.preventDefault()
    const valor = Number(minutos)
    if (!valor || valor <= 0) return
    registrarSessao(disciplinaId || null, valor, data || hojeISO())
  }

  return (
    <Cartao titulo="Sessões" className="largo">
      <form onSubmit={registrar} className="form-grade">
        <select
          className="campo inteiro"
          value={disciplinaId}
          onChange={(e) => setDisciplinaId(e.target.value)}
          aria-label="Disciplina"
        >
          <option value="">Foco livre</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
        <input
          className="campo"
          type="number"
          min="1"
          inputMode="numeric"
          value={minutos}
          onChange={(e) => setMinutos(e.target.value)}
          aria-label="Minutos"
        />
        <input className="campo" type="date" value={data} onChange={(e) => setData(e.target.value)} aria-label="Data" />
        <button type="submit" className="botao inteiro">
          <Plus size={16} /> Registrar sessão manual
        </button>
      </form>

      {recentes.length === 0 ? (
        <p className="vazio">As sessões do timer aparecem aqui automaticamente.</p>
      ) : (
        <ul className="lista-simples">
          {recentes.map((s) => (
            <li key={s.id} className="sessao">
              <span
                className="ponto"
                style={{ '--cor': nomeDe(s.disciplinaId)?.cor ?? 'var(--suave)' } as CSSProperties}
                aria-hidden="true"
              />
              <div className="sessao-info">
                <p>{nomeDisciplina(s.disciplinaId)}</p>
                <p className="legenda">{dataCurta(s.data)}</p>
              </div>
              <strong>{formatarMinutos(s.minutos)}</strong>
              <button className="botao-icone" onClick={() => removerSessao(s.id)} aria-label="Remover sessão">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  )
}
