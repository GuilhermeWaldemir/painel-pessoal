import { Plus, Repeat, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useDados } from '../contexto/DadosContext'
import { tarefaFeita } from '../lib/tarefas'
import type { Periodo } from '../tipos'

export function ListaDeTarefas({ periodo }: { periodo: Periodo }) {
  const { tarefas, adicionarTarefa, alternarTarefa, removerTarefa } = useDados()
  const [texto, setTexto] = useState('')
  const [repete, setRepete] = useState(false)

  const doPeriodo = tarefas.filter((t) => t.periodo === periodo)
  const ordenadas = [...doPeriodo.filter((t) => !tarefaFeita(t)), ...doPeriodo.filter(tarefaFeita)]

  function adicionar(evento: FormEvent) {
    evento.preventDefault()
    const limpo = texto.trim()
    if (!limpo) return
    adicionarTarefa(limpo, periodo, repete)
    setTexto('')
  }

  return (
    <>
      <form onSubmit={adicionar} className="linha-form">
        <input
          className="campo"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={periodo === 'dia' ? 'Nova tarefa de hoje' : 'Nova tarefa da semana'}
          aria-label="Nova tarefa"
          enterKeyHint="done"
        />
        <button
          type="button"
          className={repete ? 'botao-icone ativo' : 'botao-icone'}
          onClick={() => setRepete((r) => !r)}
          aria-pressed={repete}
          title={periodo === 'dia' ? 'Repetir todo dia' : 'Repetir toda semana'}
        >
          <Repeat size={18} />
        </button>
        <button type="submit" className="botao botao-quadrado" aria-label="Adicionar tarefa">
          <Plus size={20} />
        </button>
      </form>

      {doPeriodo.length === 0 ? (
        <p className="vazio">Nenhuma tarefa ainda.</p>
      ) : (
        <ul className="lista-tarefas">
          {ordenadas.map((t) => {
            const feita = tarefaFeita(t)
            return (
              <li key={t.id} className={feita ? 'feita' : undefined}>
                <label>
                  <input type="checkbox" className="check" checked={feita} onChange={() => alternarTarefa(t.id)} />
                  <span>{t.texto}</span>
                </label>
                {t.repete && (
                  <span className="icone-repete" title="Repete">
                    <Repeat size={14} aria-hidden="true" />
                    <span className="sr-only">(repete)</span>
                  </span>
                )}
                <button className="botao-icone" onClick={() => removerTarefa(t.id)} aria-label={`Remover "${t.texto}"`}>
                  <Trash2 size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
