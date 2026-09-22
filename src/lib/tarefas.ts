import type { Tarefa } from '../tipos'
import { chavePeriodo } from './datas'

/**
 * Tarefas que repetem só contam como feitas no período atual:
 * marcou ontem → hoje ela volta a ficar pendente, sem precisar "resetar" nada.
 */
export function tarefaFeita(tarefa: Tarefa) {
  if (tarefa.feitaEm === null) return false
  return tarefa.repete ? tarefa.feitaEm === chavePeriodo(tarefa.periodo) : true
}

/** Tarefa única concluída num dia/semana que já passou — pode sair da lista. */
export function concluidaEmPeriodoAnterior(tarefa: Tarefa) {
  return !tarefa.repete && tarefa.feitaEm !== null && tarefa.feitaEm < chavePeriodo(tarefa.periodo)
}
