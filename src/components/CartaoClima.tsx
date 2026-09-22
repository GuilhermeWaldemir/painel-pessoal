import { MapPin } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { dataLonga, hojeISO, rotuloDiaSemana } from '../lib/datas'
import {
  buscarCidades,
  buscarPrevisao,
  descreverTempo,
  obterLocalizacaoAtual,
  type Local,
  type Previsao,
} from '../services/clima'
import { Cartao } from './Cartao'

// "União discriminada": o campo `tipo` diz em qual situação estamos,
// e o TypeScript só deixa acessar `previsao` quando tipo === 'ok'.
type Estado = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'ok'; local: Local; previsao: Previsao }

export function CartaoClima({ className }: { className?: string }) {
  // null = usar a localização do aparelho
  const [cidadeSalva, setCidadeSalva] = useLocalStorage<Local | null>('painel:cidade', null)
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })
  const [tentativa, setTentativa] = useState(0)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    // Evita atualizar o estado se a resposta chegar depois de o efeito ter sido refeito.
    let cancelado = false

    async function carregar() {
      setEstado({ tipo: 'carregando' })
      try {
        const local = cidadeSalva ?? (await obterLocalizacaoAtual())
        const previsao = await buscarPrevisao(local)
        if (!cancelado) setEstado({ tipo: 'ok', local, previsao })
      } catch {
        if (!cancelado) setEstado({ tipo: 'erro' })
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [cidadeSalva, tentativa])

  function escolherCidade(local: Local | null) {
    setCidadeSalva(local)
    setEditando(false)
  }

  return (
    <Cartao
      className={className}
      titulo={dataLonga(hojeISO())}
      acao={
        <button className="link" onClick={() => setEditando((v) => !v)}>
          {editando ? 'Cancelar' : 'Trocar cidade'}
        </button>
      }
    >
      {editando && <BuscaCidade onEscolher={escolherCidade} />}

      {estado.tipo === 'carregando' && <p className="vazio">Carregando previsão…</p>}

      {estado.tipo === 'erro' && (
        <p className="vazio">
          Não foi possível carregar o clima.{' '}
          <button className="link link-destaque" onClick={() => setTentativa((n) => n + 1)}>
            Tentar de novo
          </button>
        </p>
      )}

      {estado.tipo === 'ok' && <ResumoClima local={estado.local} previsao={estado.previsao} />}
    </Cartao>
  )
}

function ResumoClima({ local, previsao }: { local: Local; previsao: Previsao }) {
  const atual = descreverTempo(previsao.codigo)
  const [hoje, ...proximos] = previsao.dias

  return (
    <>
      <div className="clima-atual">
        <span className="clima-icone" aria-hidden="true">
          {atual.icone}
        </span>
        <div>
          <p className="clima-temp">{Math.round(previsao.temperatura)}°</p>
          <p className="clima-desc">{atual.texto}</p>
        </div>
      </div>

      <p className="clima-linha">
        <span>
          Máx <strong>{Math.round(hoje.maxima)}°</strong>
        </span>
        <span>
          Mín <strong>{Math.round(hoje.minima)}°</strong>
        </span>
        <span>
          Chuva <strong>{hoje.chanceChuva}%</strong>
        </span>
        <span>
          Sensação <strong>{Math.round(previsao.sensacao)}°</strong>
        </span>
      </p>

      <ul className="clima-dias">
        {proximos.map((dia) => (
          <li key={dia.data}>
            <span className="texto-suave">{rotuloDiaSemana(dia.data)}</span>
            <span aria-hidden="true">{descreverTempo(dia.codigo).icone}</span>
            <span>
              {Math.round(dia.maxima)}° <span className="texto-fraco">{Math.round(dia.minima)}°</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="clima-local">
        <MapPin size={12} aria-hidden="true" /> {local.nome}
      </p>
    </>
  )
}

function BuscaCidade({ onEscolher }: { onEscolher: (local: Local | null) => void }) {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<Local[] | null>(null)

  async function buscar(evento: FormEvent) {
    evento.preventDefault()
    if (!termo.trim()) return
    try {
      setResultados(await buscarCidades(termo.trim()))
    } catch {
      setResultados([])
    }
  }

  return (
    <div className="busca-cidade">
      <form onSubmit={buscar} className="linha-form">
        <input
          className="campo"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Nome da cidade"
          aria-label="Nome da cidade"
        />
        <button type="submit" className="botao">
          Buscar
        </button>
      </form>

      <button className="link link-destaque" onClick={() => onEscolher(null)}>
        <MapPin size={14} aria-hidden="true" /> Usar minha localização
      </button>

      {resultados?.length === 0 && <p className="vazio">Nenhuma cidade encontrada.</p>}
      {resultados && resultados.length > 0 && (
        <ul className="lista-resultados">
          {resultados.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button onClick={() => onEscolher(r)}>{r.nome}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
