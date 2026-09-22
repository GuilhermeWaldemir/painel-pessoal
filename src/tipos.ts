// Formato de todos os dados que o painel guarda.

export type Periodo = 'dia' | 'semana'

export type Tarefa = {
  id: string
  texto: string
  periodo: Periodo
  /** true = volta a ficar pendente todo dia (ou toda semana) */
  repete: boolean
  /** Chave do período em que foi concluída ('AAAA-MM-DD'), ou null se pendente */
  feitaEm: string | null
  criadaEm: number
}

export type Disciplina = {
  id: string
  nome: string
  cor: string
  metaMinSemana: number
}

export type Sessao = {
  id: string
  /** null = foco livre, sem disciplina */
  disciplinaId: string | null
  data: string
  minutos: number
}

export type StatusLivro = 'lendo' | 'quero' | 'lido'

export type Livro = {
  id: string
  titulo: string
  autor: string
  paginas: number
  paginaAtual: number
  status: StatusLivro
  terminadoEm: string | null
  criadoEm: number
}

export type TipoEvento = 'evento' | 'prova' | 'trabalho' | 'lembrete'

export type Evento = {
  id: string
  titulo: string
  data: string
  /** 'HH:MM' ou '' para o dia todo */
  hora: string
  tipo: TipoEvento
}

// O timer tem três situações possíveis, e cada uma guarda só o que precisa.
// sessaoId é criado ao iniciar: se o PC e o celular terminarem o mesmo foco,
// os dois gravam a sessão com o mesmo id e ela não fica duplicada.
type TimerBase = { disciplinaId: string | null; duracaoMin: number }
export type TimerFoco =
  | (TimerBase & { estado: 'parado' })
  | (TimerBase & { estado: 'rodando'; fimEm: number; sessaoId: string })
  | (TimerBase & { estado: 'pausado'; restanteMs: number; sessaoId: string })
