import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Dispatch, SetStateAction } from 'react'
import type { Disciplina, Evento, Livro, Sessao, Tarefa } from '../tipos'
import { supabase } from './supabase'

export type Tabela = 'tarefas' | 'disciplinas' | 'sessoes' | 'livros' | 'eventos'

/** Disciplinas primeiro: as sessões apontam para elas (chave estrangeira). */
export const TABELAS: Tabela[] = ['disciplinas', 'tarefas', 'sessoes', 'livros', 'eventos']

/** Onde cada coleção fica guardada no aparelho (cache local). */
export const CHAVES_LOCAIS = {
  tarefas: 'painel:tarefas-v2',
  disciplinas: 'painel:disciplinas',
  sessoes: 'painel:sessoes',
  livros: 'painel:livros',
  eventos: 'painel:eventos',
  timer: 'painel:timer',
} as const

export type Colecoes = {
  tarefas: Tarefa[]
  disciplinas: Disciplina[]
  sessoes: Sessao[]
  livros: Livro[]
  eventos: Evento[]
}

// No app os nomes são camelCase (feitaEm); no banco, snake_case (feita_em) — a convenção do SQL.
const paraSnake = (nome: string) => nome.replace(/[A-Z]/g, (letra) => '_' + letra.toLowerCase())
const paraCamel = (nome: string) => nome.replace(/_([a-z])/g, (_, letra: string) => letra.toUpperCase())

export function paraBanco(objeto: object) {
  return Object.fromEntries(Object.entries(objeto).map(([chave, valor]) => [paraSnake(chave), valor]))
}

export function doBanco<T>(linha: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(linha)
      .filter(([chave]) => chave !== 'user_id')
      .map(([chave, valor]) => [paraCamel(chave), valor]),
  ) as T
}

export function lerLocal<T>(chave: string, padrao: T): T {
  try {
    const salvo = localStorage.getItem(chave)
    return salvo !== null ? (JSON.parse(salvo) as T) : padrao
  } catch {
    return padrao
  }
}

/** Envia coleções inteiras para o banco. "upsert" = insere, ou atualiza se o id já existir. */
export async function enviarParaNuvem(colecoes: Partial<Colecoes>) {
  // Sessões que apontam para uma disciplina que não existe mais virariam erro de chave estrangeira.
  const { data: noBanco, error } = await supabase.from('disciplinas').select('id')
  if (error) throw error
  const disciplinasValidas = new Set([...(noBanco ?? []).map((d) => d.id), ...(colecoes.disciplinas ?? []).map((d) => d.id)])

  for (const tabela of TABELAS) {
    let linhas: object[] = colecoes[tabela] ?? []
    if (linhas.length === 0) continue
    if (tabela === 'sessoes') {
      linhas = (linhas as Sessao[]).map((s) =>
        s.disciplinaId && !disciplinasValidas.has(s.disciplinaId) ? { ...s, disciplinaId: null } : s,
      )
    }
    const { error: erroEnvio } = await supabase.from(tabela).upsert(linhas.map(paraBanco))
    if (erroEnvio) throw erroEnvio
  }
}

/** Escuta mudanças numa tabela (vindas de outro aparelho) e aplica na lista local. */
export function ouvirTabela<T extends { id: string }>(
  canal: RealtimeChannel,
  tabela: Tabela,
  setItens: Dispatch<SetStateAction<T[]>>,
) {
  canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, (payload) =>
    aplicarMudanca(setItens, payload),
  )
}

function aplicarMudanca<T extends { id: string }>(
  setItens: Dispatch<SetStateAction<T[]>>,
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
) {
  if (payload.eventType === 'DELETE') {
    const id = (payload.old as { id?: string }).id
    setItens((atuais) => atuais.filter((item) => item.id !== id))
    return
  }
  const novo = doBanco<T>(payload.new)
  setItens((atuais) =>
    atuais.some((item) => item.id === novo.id)
      ? atuais.map((item) => (item.id === novo.id ? novo : item))
      : [...atuais, novo],
  )
}
