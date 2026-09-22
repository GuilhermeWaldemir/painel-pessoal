import { Pause, Play, Square } from 'lucide-react'
import { useDados } from '../contexto/DadosContext'
import { useAgora } from '../hooks/useAgora'
import { Anel } from './graficos'

const DURACOES = [15, 25, 45, 60]

function formatarRelogio(ms: number) {
  const segundos = Math.ceil(ms / 1000)
  return `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`
}

/** Timer Pomodoro. `completo` mostra também a escolha de duração (usado na aba Estudos). */
export function TimerFoco({ completo = false }: { completo?: boolean }) {
  const { timer, disciplinas, configurarTimer, iniciarTimer, pausarTimer, retomarTimer, encerrarTimer } = useDados()
  const agora = useAgora(timer.estado === 'rodando' ? 1000 : null)

  // O tempo restante é calculado a partir do horário de término salvo, não "descontando 1 por segundo".
  // Assim o timer continua certo mesmo se o celular bloquear a tela ou você fechar o app.
  const totalMs = timer.duracaoMin * 60_000
  const restanteMs =
    timer.estado === 'rodando'
      ? Math.min(totalMs, Math.max(0, timer.fimEm - agora.getTime()))
      : timer.estado === 'pausado'
        ? timer.restanteMs
        : totalMs

  const parado = timer.estado === 'parado'
  const nomeDisciplina = disciplinas.find((d) => d.id === timer.disciplinaId)?.nome ?? 'Foco livre'

  return (
    <div className={completo ? 'timer timer-completo' : 'timer'}>
      <Anel
        valor={1 - restanteMs / totalMs}
        tamanho={completo ? 200 : 124}
        espessura={completo ? 12 : 9}
        cores={['#ff8a4c', '#6d8bff']}
      >
        <span className="timer-tempo">{formatarRelogio(restanteMs)}</span>
        <span className="timer-rotulo">{timer.estado === 'pausado' ? 'Pausado' : nomeDisciplina}</span>
      </Anel>

      {parado && (completo || disciplinas.length > 0) && (
        <select
          className="campo"
          value={timer.disciplinaId ?? ''}
          onChange={(e) => configurarTimer({ disciplinaId: e.target.value || null })}
          aria-label="Disciplina do foco"
        >
          <option value="">Foco livre</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      )}

      {parado && completo && (
        <div className="chips" role="group" aria-label="Duração">
          {DURACOES.map((minutos) => (
            <button
              key={minutos}
              className={timer.duracaoMin === minutos ? 'chip ativo' : 'chip'}
              onClick={() => configurarTimer({ duracaoMin: minutos })}
            >
              {minutos} min
            </button>
          ))}
        </div>
      )}

      <div className="timer-botoes">
        {parado && (
          <button className="botao" onClick={iniciarTimer}>
            <Play size={16} /> Iniciar
          </button>
        )}
        {timer.estado === 'rodando' && (
          <button className="botao botao-secundario" onClick={pausarTimer} aria-label="Pausar">
            <Pause size={16} /> {completo && 'Pausar'}
          </button>
        )}
        {timer.estado === 'pausado' && (
          <button className="botao" onClick={retomarTimer} aria-label="Continuar">
            <Play size={16} /> {completo && 'Continuar'}
          </button>
        )}
        {!parado && (
          <button
            className="botao botao-secundario"
            onClick={encerrarTimer}
            aria-label="Parar e salvar o tempo estudado"
            title="Parar e salvar o tempo estudado"
          >
            <Square size={14} /> {completo && 'Parar'}
          </button>
        )}
      </div>
    </div>
  )
}
