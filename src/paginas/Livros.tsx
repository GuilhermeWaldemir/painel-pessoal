import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Capa } from '../components/Capa'
import { CabecalhoPagina, Cartao } from '../components/Cartao'
import { BarraProgresso } from '../components/graficos'
import { useDados } from '../contexto/DadosContext'
import { STATUS_LIVRO } from '../lib/constantes'
import type { Livro, StatusLivro } from '../tipos'

type Filtro = StatusLivro | 'todos'

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'lendo', rotulo: 'Lendo' },
  { valor: 'quero', rotulo: 'Quero ler' },
  { valor: 'lido', rotulo: 'Lidos' },
]

const ORDEM_STATUS: Record<StatusLivro, number> = { lendo: 0, quero: 1, lido: 2 }

export function Livros() {
  const { livros } = useDados()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const ano = String(new Date().getFullYear())

  const visiveis = livros
    .filter((l) => filtro === 'todos' || l.status === filtro)
    .sort((a, b) => ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || b.criadoEm - a.criadoEm)

  return (
    <>
      <CabecalhoPagina titulo="Livros" subtitulo="Sua estante e o que está lendo" />
      <div className="grade-pagina">
        <Cartao className="largo">
          <div className="estatisticas">
            <div className="estatistica">
              <strong>{livros.filter((l) => l.status === 'lendo').length}</strong>
              <span>Lendo</span>
            </div>
            <div className="estatistica">
              <strong>{livros.filter((l) => l.status === 'quero').length}</strong>
              <span>Na fila</span>
            </div>
            <div className="estatistica">
              <strong>{livros.filter((l) => l.terminadoEm?.startsWith(ano)).length}</strong>
              <span>Lidos em {ano}</span>
            </div>
          </div>
        </Cartao>

        <Cartao titulo="Estante">
          <div className="chips chips-esquerda" role="group" aria-label="Filtrar livros">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                className={filtro === f.valor ? 'chip ativo' : 'chip'}
                onClick={() => setFiltro(f.valor)}
              >
                {f.rotulo}
              </button>
            ))}
          </div>

          {visiveis.length === 0 ? (
            <p className="vazio">Nenhum livro aqui.</p>
          ) : (
            <ul className="lista-livros">
              {visiveis.map((livro) => (
                <ItemLivro key={livro.id} livro={livro} />
              ))}
            </ul>
          )}
        </Cartao>

        <FormLivro />
      </div>
    </>
  )
}

function FormLivro() {
  const { adicionarLivro } = useDados()
  const [titulo, setTitulo] = useState('')
  const [autor, setAutor] = useState('')
  const [paginas, setPaginas] = useState('')
  const [status, setStatus] = useState<StatusLivro>('quero')

  function adicionar(evento: FormEvent) {
    evento.preventDefault()
    if (!titulo.trim()) return
    adicionarLivro({ titulo: titulo.trim(), autor: autor.trim(), paginas: Number(paginas) || 0, status })
    setTitulo('')
    setAutor('')
    setPaginas('')
  }

  return (
    <Cartao titulo="Adicionar livro">
      <form onSubmit={adicionar} className="form-grade">
        <input
          className="campo inteiro"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título"
          aria-label="Título"
        />
        <input
          className="campo inteiro"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          placeholder="Autor"
          aria-label="Autor"
        />
        <input
          className="campo"
          type="number"
          min="0"
          inputMode="numeric"
          value={paginas}
          onChange={(e) => setPaginas(e.target.value)}
          placeholder="Páginas"
          aria-label="Número de páginas"
        />
        <select
          className="campo"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusLivro)}
          aria-label="Status"
        >
          {Object.entries(STATUS_LIVRO).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <button type="submit" className="botao inteiro">
          <Plus size={16} /> Adicionar
        </button>
      </form>
    </Cartao>
  )
}

function ItemLivro({ livro }: { livro: Livro }) {
  const { mudarStatusLivro, atualizarPagina, removerLivro } = useDados()
  const fracao = livro.paginas ? livro.paginaAtual / livro.paginas : 0

  return (
    <li className="livro">
      <Capa titulo={livro.titulo} />
      <div className="livro-info">
        <p className="livro-titulo">{livro.titulo}</p>
        {livro.autor && <p className="legenda">{livro.autor}</p>}

        {livro.status === 'lendo' && (
          <>
            <BarraProgresso valor={fracao} />
            <p className="legenda">
              {livro.paginas > 0 ? `${Math.round(fracao * 100)}% · ` : ''}
              {livro.paginaAtual}
              {livro.paginas > 0 && ` de ${livro.paginas}`} páginas
            </p>
          </>
        )}

        <div className="livro-acoes">
          <select
            className="campo campo-pequeno"
            value={livro.status}
            onChange={(e) => mudarStatusLivro(livro.id, e.target.value as StatusLivro)}
            aria-label="Status do livro"
          >
            {Object.entries(STATUS_LIVRO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
          {livro.status === 'lendo' && (
            <>
              <input
                className="campo campo-pequeno campo-pagina"
                type="number"
                min="0"
                inputMode="numeric"
                value={livro.paginaAtual}
                onChange={(e) => atualizarPagina(livro.id, Number(e.target.value) || 0)}
                aria-label="Página atual"
                title="Página atual"
              />
              <button
                className="botao botao-secundario botao-pequeno"
                onClick={() => atualizarPagina(livro.id, livro.paginaAtual + 10)}
              >
                +10
              </button>
            </>
          )}
          <button className="botao-icone" onClick={() => removerLivro(livro.id)} aria-label={`Remover ${livro.titulo}`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  )
}
