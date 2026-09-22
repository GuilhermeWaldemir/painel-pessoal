import type { StatusLivro, TipoEvento } from '../tipos'

export const TIPOS_EVENTO: Record<TipoEvento, { rotulo: string; cor: string }> = {
  evento: { rotulo: 'Evento', cor: '#6d8bff' },
  prova: { rotulo: 'Prova', cor: '#fb7185' },
  trabalho: { rotulo: 'Trabalho', cor: '#ff8a4c' },
  lembrete: { rotulo: 'Lembrete', cor: '#34d399' },
}

export const STATUS_LIVRO: Record<StatusLivro, string> = {
  lendo: 'Lendo',
  quero: 'Quero ler',
  lido: 'Lido',
}

export const CORES_DISCIPLINA = ['#6d8bff', '#ff8a4c', '#34d399', '#a78bfa', '#fb7185', '#38bdf8', '#facc15']

export const CORES_CAPA: [string, string][] = [
  ['#4f6bff', '#a78bfa'],
  ['#ff8a4c', '#fb7185'],
  ['#10b981', '#38bdf8'],
  ['#8b5cf6', '#ec4899'],
  ['#0ea5e9', '#6366f1'],
  ['#f59e0b', '#ef4444'],
]
