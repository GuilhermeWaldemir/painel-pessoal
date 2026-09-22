import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { avisarFimDoFoco } from '../lib/aviso'
import { CORES_DISCIPLINA } from '../lib/constantes'
import { chavePeriodo, hojeISO, paraISO } from '../lib/datas'
import { gerarId } from '../lib/id'
import {
  CHAVES_LOCAIS,
  TABELAS,
  doBanco,
  enviarParaNuvem,
  lerLocal,
  ouvirTabela,
  paraBanco,
  type Colecoes,
  type Tabela,
} from '../lib/sincronizacao'
import { supabase } from '../lib/supabase'
import { concluidaEmPeriodoAnterior, tarefaFeita } from '../lib/tarefas'
import type { Disciplina, Evento, Livro, Periodo, Sessao, StatusLivro, Tarefa, TimerFoco } from '../tipos'
import { DadosContext } from './DadosContext'

const TIMER_INICIAL: TimerFoco = { estado: 'parado', disciplinaId: null, duracaoMin: 25 }

export type EstadoSync = 'sincronizando' | 'ok' | 'erro'

type Requisicao = PromiseLike<{ error: unknown }>

/**
 * Uma coleção (tarefas, livros...) com "atualização otimista": a mudança aparece na tela
 * na hora e é enviada ao banco em seguida. O localStorage funciona como cache, para o app
 * abrir instantâneo mesmo antes de a internet responder.
 */
function useColecao<T extends { id: string }>(tabela: Tabela, enviar: (requisicao: Requisicao) => void) {
  const [itens, setItens] = useLocalStorage<T[]>(CHAVES_LOCAIS[tabela], [])

  return {
    itens,
    setItens,
    inserir(item: T) {
      setItens((atuais) => [...atuais.filter((i) => i.id !== item.id), item])
      // ignoreDuplicates: se o id já existe no banco, não faz nada (evita duplicar).
      enviar(supabase.from(tabela).upsert(paraBanco(item), { ignoreDuplicates: true }))
    },
    atualizar(id: string, mudancas: Partial<T>) {
      setItens((atuais) => atuais.map((i) => (i.id === id ? { ...i, ...mudancas } : i)))
      enviar(supabase.from(tabela).update(paraBanco(mudancas)).eq('id', id))
    },
    remover(id: string) {
      setItens((atuais) => atuais.filter((i) => i.id !== id))
      enviar(supabase.from(tabela).delete().eq('id', id))
    },
  }
}

function useCriarDados(usuario: User) {
  const userId = usuario.id
  const [estadoSync, setEstadoSync] = useState<EstadoSync>('sincronizando')

  const avisarErro = useCallback((erro: unknown) => {
    console.error('[sincronização]', erro)
    setEstadoSync('erro')
  }, [])

  const enviar = useCallback(
    (requisicao: Requisicao) => {
      requisicao.then(({ error }) => {
        if (error) avisarErro(error)
      }, avisarErro)
    },
    [avisarErro],
  )

  const tarefas = useColecao<Tarefa>('tarefas', enviar)
  const disciplinas = useColecao<Disciplina>('disciplinas', enviar)
  const sessoes = useColecao<Sessao>('sessoes', enviar)
  const livros = useColecao<Livro>('livros', enviar)
  const eventos = useColecao<Evento>('eventos', enviar)
  const [timer, setTimer] = useLocalStorage<TimerFoco>(CHAVES_LOCAIS.timer, TIMER_INICIAL)

  // Os "set" do useState nunca mudam entre renderizações, então podem ir nas dependências sem problema.
  const { setItens: setTarefas } = tarefas
  const { setItens: setDisciplinas } = disciplinas
  const { setItens: setSessoes } = sessoes
  const { setItens: setLivros } = livros
  const { setItens: setEventos } = eventos

  /** Baixa tudo do banco e substitui o cache local. O banco é a "fonte da verdade". */
  const sincronizar = useCallback(async () => {
    try {
      // Primeiro login NESTE aparelho: soma à nuvem o que ele já tinha guardado (anotações feitas
      // antes da sincronização existir). Depois disso, a nuvem é quem manda.
      const marcaAparelho = `painel:aparelho-enviado:${userId}`
      if (!localStorage.getItem(marcaAparelho)) {
        await enviarParaNuvem({
          tarefas: lerLocal(CHAVES_LOCAIS.tarefas, []),
          disciplinas: lerLocal(CHAVES_LOCAIS.disciplinas, []),
          sessoes: lerLocal(CHAVES_LOCAIS.sessoes, []),
          livros: lerLocal(CHAVES_LOCAIS.livros, []),
          eventos: lerLocal(CHAVES_LOCAIS.eventos, []),
        })
        localStorage.setItem(marcaAparelho, '1')
      }

      const preferencias = await supabase.from('preferencias').select('timer').maybeSingle()
      if (preferencias.error) throw preferencias.error
      let timerNuvem = preferencias.data?.timer as TimerFoco | undefined
      if (!timerNuvem) {
        // Conta nova: cria a linha de preferências com o timer deste aparelho.
        timerNuvem = lerLocal(CHAVES_LOCAIS.timer, TIMER_INICIAL)
        const { error } = await supabase.from('preferencias').upsert({ user_id: userId, timer: timerNuvem })
        if (error) throw error
      }

      const respostas = await Promise.all(TABELAS.map((tabela) => supabase.from(tabela).select('*')))
      const erro = respostas.find((r) => r.error)?.error
      if (erro) throw erro
      const linhas = Object.fromEntries(TABELAS.map((tabela, i) => [tabela, respostas[i].data ?? []])) as Record<
        Tabela,
        Record<string, unknown>[]
      >

      // Tarefas únicas concluídas em dias/semanas anteriores saem da lista (e do banco).
      const todasTarefas = linhas.tarefas.map((linha) => doBanco<Tarefa>(linha))
      const antigas = todasTarefas.filter(concluidaEmPeriodoAnterior).map((t) => t.id)
      if (antigas.length > 0) await supabase.from('tarefas').delete().in('id', antigas)

      setTarefas(todasTarefas.filter((t) => !antigas.includes(t.id)))
      setDisciplinas(linhas.disciplinas.map((linha) => doBanco<Disciplina>(linha)))
      setSessoes(linhas.sessoes.map((linha) => doBanco<Sessao>(linha)))
      setLivros(linhas.livros.map((linha) => doBanco<Livro>(linha)))
      setEventos(linhas.eventos.map((linha) => doBanco<Evento>(linha)))
      setTimer(timerNuvem)
      setEstadoSync('ok')
    } catch (erro) {
      avisarErro(erro)
    }
  }, [userId, avisarErro, setTarefas, setDisciplinas, setSessoes, setLivros, setEventos, setTimer])

  // Ao entrar: sincroniza, passa a ouvir mudanças em tempo real e sincroniza de novo
  // sempre que o app volta para a tela ou a internet volta.
  useEffect(() => {
    // Falso positivo do lint: sincronizar() só muda o estado depois de a resposta do banco chegar (await).
    // oxlint-disable-next-line react/set-state-in-effect
    sincronizar()

    const canal = supabase.channel(`painel-${userId}`)
    ouvirTabela(canal, 'tarefas', setTarefas)
    ouvirTabela(canal, 'disciplinas', setDisciplinas)
    ouvirTabela(canal, 'sessoes', setSessoes)
    ouvirTabela(canal, 'livros', setLivros)
    ouvirTabela(canal, 'eventos', setEventos)
    canal.on('postgres_changes', { event: '*', schema: 'public', table: 'preferencias' }, (payload) => {
      if (payload.eventType !== 'DELETE') setTimer((payload.new as { timer: TimerFoco }).timer)
    })
    canal.subscribe()

    function aoVoltarParaTela() {
      if (document.visibilityState === 'visible') sincronizar()
    }
    document.addEventListener('visibilitychange', aoVoltarParaTela)
    window.addEventListener('online', sincronizar)

    return () => {
      supabase.removeChannel(canal)
      document.removeEventListener('visibilitychange', aoVoltarParaTela)
      window.removeEventListener('online', sincronizar)
    }
  }, [userId, sincronizar, setTarefas, setDisciplinas, setSessoes, setLivros, setEventos, setTimer])

  function salvarTimer(novo: TimerFoco) {
    setTimer(novo)
    enviar(supabase.from('preferencias').upsert({ user_id: userId, timer: novo, atualizado_em: new Date().toISOString() }))
  }

  // Quando o timer chega ao fim, registra a sessão de estudo e avisa.
  // Se o app estava fechado nessa hora, isso acontece assim que ele for aberto de novo.
  useEffect(() => {
    if (timer.estado !== 'rodando') return

    const id = setTimeout(
      () => {
        const sessao: Sessao = {
          id: timer.sessaoId ?? `foco-${timer.fimEm}`,
          disciplinaId: timer.disciplinaId,
          data: paraISO(new Date(timer.fimEm)),
          minutos: timer.duracaoMin,
        }
        const parado: TimerFoco = { estado: 'parado', disciplinaId: timer.disciplinaId, duracaoMin: timer.duracaoMin }
        setSessoes((atuais) => [...atuais.filter((s) => s.id !== sessao.id), sessao])
        setTimer(parado)
        enviar(supabase.from('sessoes').upsert(paraBanco(sessao), { ignoreDuplicates: true }))
        enviar(supabase.from('preferencias').upsert({ user_id: userId, timer: parado }))
        avisarFimDoFoco()
      },
      Math.max(0, timer.fimEm - Date.now()),
    )
    return () => clearTimeout(id)
  }, [timer, userId, enviar, setSessoes, setTimer])

  // ---------- Tarefas ----------

  function adicionarTarefa(texto: string, periodo: Periodo, repete: boolean) {
    tarefas.inserir({ id: gerarId(), texto, periodo, repete, feitaEm: null, criadaEm: Date.now() })
  }

  function alternarTarefa(id: string) {
    const tarefa = tarefas.itens.find((t) => t.id === id)
    if (!tarefa) return
    tarefas.atualizar(id, { feitaEm: tarefaFeita(tarefa) ? null : chavePeriodo(tarefa.periodo) })
  }

  function removerTarefa(id: string) {
    tarefas.remover(id)
  }

  // ---------- Estudos ----------

  function adicionarDisciplina(nome: string, metaHoras: number) {
    disciplinas.inserir({
      id: gerarId(),
      nome,
      metaMinSemana: Math.round(metaHoras * 60),
      cor: CORES_DISCIPLINA[disciplinas.itens.length % CORES_DISCIPLINA.length],
    })
  }

  function removerDisciplina(id: string) {
    disciplinas.remover(id)
    // No banco, as sessões dessa disciplina viram "foco livre" sozinhas (on delete set null).
    setSessoes((atuais) => atuais.map((s) => (s.disciplinaId === id ? { ...s, disciplinaId: null } : s)))
    if (timer.estado === 'parado' && timer.disciplinaId === id) salvarTimer({ ...timer, disciplinaId: null })
  }

  function registrarSessao(disciplinaId: string | null, minutos: number, data = hojeISO()) {
    sessoes.inserir({ id: gerarId(), disciplinaId, data, minutos })
  }

  function removerSessao(id: string) {
    sessoes.remover(id)
  }

  // ---------- Timer de foco ----------

  function configurarTimer(config: { disciplinaId?: string | null; duracaoMin?: number }) {
    if (timer.estado === 'parado') salvarTimer({ ...timer, ...config })
  }

  function iniciarTimer() {
    if (timer.estado !== 'parado') return
    salvarTimer({ ...timer, estado: 'rodando', fimEm: Date.now() + timer.duracaoMin * 60_000, sessaoId: gerarId() })
  }

  function pausarTimer() {
    if (timer.estado !== 'rodando') return
    salvarTimer({
      estado: 'pausado',
      disciplinaId: timer.disciplinaId,
      duracaoMin: timer.duracaoMin,
      restanteMs: Math.max(0, timer.fimEm - Date.now()),
      sessaoId: timer.sessaoId,
    })
  }

  function retomarTimer() {
    if (timer.estado !== 'pausado') return
    salvarTimer({
      estado: 'rodando',
      disciplinaId: timer.disciplinaId,
      duracaoMin: timer.duracaoMin,
      fimEm: Date.now() + timer.restanteMs,
      sessaoId: timer.sessaoId,
    })
  }

  /** Para antes do fim e salva o tempo já estudado (se passou de 1 minuto). */
  function encerrarTimer() {
    if (timer.estado === 'parado') return
    const restante = timer.estado === 'rodando' ? Math.max(0, timer.fimEm - Date.now()) : timer.restanteMs
    const minutos = Math.floor((timer.duracaoMin * 60_000 - restante) / 60_000)
    if (minutos >= 1) {
      sessoes.inserir({ id: timer.sessaoId ?? gerarId(), disciplinaId: timer.disciplinaId, data: hojeISO(), minutos })
    }
    salvarTimer({ estado: 'parado', disciplinaId: timer.disciplinaId, duracaoMin: timer.duracaoMin })
  }

  // ---------- Livros ----------

  function adicionarLivro(dados: { titulo: string; autor: string; paginas: number; status: StatusLivro }) {
    const lido = dados.status === 'lido'
    livros.inserir({
      id: gerarId(),
      ...dados,
      paginaAtual: lido ? dados.paginas : 0,
      terminadoEm: lido ? hojeISO() : null,
      criadoEm: Date.now(),
    })
  }

  function mudarStatusLivro(id: string, status: StatusLivro) {
    const livro = livros.itens.find((l) => l.id === id)
    if (!livro) return
    livros.atualizar(id, {
      status,
      paginaAtual: status === 'lido' ? livro.paginas : status === 'quero' ? 0 : livro.paginaAtual,
      terminadoEm: status === 'lido' ? (livro.terminadoEm ?? hojeISO()) : null,
    })
  }

  function atualizarPagina(id: string, pagina: number) {
    const livro = livros.itens.find((l) => l.id === id)
    if (!livro) return
    const paginaAtual = Math.max(0, livro.paginas > 0 ? Math.min(pagina, livro.paginas) : pagina)
    const terminou = livro.paginas > 0 && paginaAtual >= livro.paginas
    livros.atualizar(id, {
      paginaAtual,
      status: terminou ? 'lido' : livro.status,
      terminadoEm: terminou ? hojeISO() : livro.terminadoEm,
    })
  }

  function removerLivro(id: string) {
    livros.remover(id)
  }

  // ---------- Agenda ----------

  function adicionarEvento(dados: Omit<Evento, 'id'>) {
    eventos.inserir({ id: gerarId(), ...dados })
  }

  function removerEvento(id: string) {
    eventos.remover(id)
  }

  // ---------- Conta ----------

  /** Junta os dados de um backup com os da nuvem (não apaga nada). */
  async function importar(dados: Record<string, unknown>) {
    const colecoes: Partial<Record<Tabela, unknown[]>> = {}
    for (const tabela of TABELAS) {
      const valor = dados[CHAVES_LOCAIS[tabela]]
      if (Array.isArray(valor)) colecoes[tabela] = valor
    }
    await enviarParaNuvem(colecoes as Partial<Colecoes>)
    await sincronizar()
  }

  async function sair() {
    await supabase.auth.signOut()
    // Limpa o cache deste aparelho; ao entrar de novo, tudo vem da nuvem.
    for (const chave of Object.values(CHAVES_LOCAIS)) localStorage.removeItem(chave)
  }

  return {
    email: usuario.email ?? '',
    estadoSync,
    sincronizar,
    importar,
    sair,
    tarefas: tarefas.itens,
    adicionarTarefa,
    alternarTarefa,
    removerTarefa,
    disciplinas: disciplinas.itens,
    adicionarDisciplina,
    removerDisciplina,
    sessoes: sessoes.itens,
    registrarSessao,
    removerSessao,
    timer,
    configurarTimer,
    iniciarTimer,
    pausarTimer,
    retomarTimer,
    encerrarTimer,
    livros: livros.itens,
    adicionarLivro,
    mudarStatusLivro,
    atualizarPagina,
    removerLivro,
    eventos: eventos.itens,
    adicionarEvento,
    removerEvento,
  }
}

// O tipo é deduzido do que a função devolve: se eu adicionar algo lá, o tipo acompanha sozinho.
export type Dados = ReturnType<typeof useCriarDados>

export function DadosProvider({ usuario, children }: { usuario: User; children: ReactNode }) {
  const dados = useCriarDados(usuario)
  return <DadosContext value={dados}>{children}</DadosContext>
}
