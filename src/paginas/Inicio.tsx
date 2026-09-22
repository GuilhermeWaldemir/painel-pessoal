import { Cartao } from '../components/Cartao'
import { CartaoBackup } from '../components/CartaoBackup'
import { CartaoClima } from '../components/CartaoClima'
import { Capa } from '../components/Capa'
import { GraficoSemana } from '../components/GraficoSemana'
import { Anel, BarraProgresso, Sparkline } from '../components/graficos'
import { ItemEvento } from '../components/ItemEvento'
import { ListaDeTarefas } from '../components/ListaDeTarefas'
import { TimerFoco } from '../components/TimerFoco'
import { useDados } from '../contexto/DadosContext'
import { useAgora } from '../hooks/useAgora'
import { fmtHora, formatarMinutos, paraISO, somarDias } from '../lib/datas'
import { minutosNaSemana, minutosNoDia } from '../lib/estudos'
import { proximosEventos } from '../lib/eventos'
import { tarefaFeita } from '../lib/tarefas'

export function Inicio() {
  return (
    <div className="grade-inicio">
      <CartaoSaudacao />
      <CartaoClima />
      <CartaoProgresso />
      <Cartao titulo="Foco" className="metade">
        <TimerFoco />
      </Cartao>
      <CartaoLendo />
      <Cartao titulo="Tarefas de hoje" acao={<a href="#tarefas" className="link">Ver todas</a>}>
        <ListaDeTarefas periodo="dia" />
      </Cartao>
      <CartaoAtividade />
      <CartaoEventos />
      <CartaoBackup />
    </div>
  )
}

function saudacao(hora: number) {
  if (hora < 5) return 'Boa madrugada'
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function CartaoSaudacao() {
  const agora = useAgora(30_000)
  const { sessoes } = useDados()

  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => paraISO(somarDias(agora, i - 6)))
  const minutosPorDia = ultimos7Dias.map((dia) => minutosNoDia(sessoes, dia))
  const total = minutosPorDia.reduce((soma, m) => soma + m, 0)

  return (
    <Cartao className="largo saudacao">
      <div className="saudacao-topo">
        <div>
          <p className="texto-suave">{saudacao(agora.getHours())},</p>
          <h1>Guilherme</h1>
          <p className="texto-suave">Foco no que importa hoje.</p>
        </div>
        <span className="pilula">{fmtHora.format(agora)}</span>
      </div>
      <Sparkline valores={minutosPorDia} />
      <p className="legenda">Estudo nos últimos 7 dias · {formatarMinutos(total)}</p>
    </Cartao>
  )
}

function CartaoProgresso() {
  const { tarefas } = useDados()
  const deHoje = tarefas.filter((t) => t.periodo === 'dia')
  const feitas = deHoje.filter(tarefaFeita).length
  const fracao = deHoje.length ? feitas / deHoje.length : 0

  return (
    <Cartao titulo="Progresso" className="metade">
      <Anel valor={fracao} tamanho={124} espessura={10}>
        <strong className="anel-numero">
          {Math.round(fracao * 100)}
          <small>%</small>
        </strong>
      </Anel>
      <p className="legenda centro">
        {feitas} de {deHoje.length} tarefas de hoje
      </p>
    </Cartao>
  )
}

function CartaoLendo() {
  const { livros } = useDados()
  const lendo = livros.filter((l) => l.status === 'lendo').slice(0, 2)

  return (
    <Cartao titulo="Lendo agora" acao={<a href="#livros" className="link">Livros</a>}>
      {lendo.length === 0 ? (
        <p className="vazio">
          Nenhum livro em andamento. <a href="#livros">Adicionar</a>
        </p>
      ) : (
        <ul className="lista-simples">
          {lendo.map((livro) => {
            const fracao = livro.paginas ? livro.paginaAtual / livro.paginas : 0
            return (
              <li key={livro.id} className="livro">
                <Capa titulo={livro.titulo} pequena />
                <div className="livro-info">
                  <p className="livro-titulo">{livro.titulo}</p>
                  <BarraProgresso valor={fracao} />
                  <p className="legenda">
                    Pág. {livro.paginaAtual}
                    {livro.paginas > 0 && ` de ${livro.paginas} · ${Math.round(fracao * 100)}%`}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Cartao>
  )
}

function CartaoAtividade() {
  const { sessoes } = useDados()
  return (
    <Cartao
      titulo="Estudo na semana"
      acao={<span className="pilula">{formatarMinutos(minutosNaSemana(sessoes))}</span>}
    >
      <GraficoSemana />
    </Cartao>
  )
}

function CartaoEventos() {
  const { eventos } = useDados()
  const proximos = proximosEventos(eventos).slice(0, 4)

  return (
    <Cartao titulo="Próximos eventos" acao={<a href="#calendario" className="link">Agenda</a>}>
      {proximos.length === 0 ? (
        <p className="vazio">
          Nada marcado. <a href="#calendario">Abrir agenda</a>
        </p>
      ) : (
        <ul className="lista-eventos">
          {proximos.map((e) => (
            <ItemEvento key={e.id} evento={e} />
          ))}
        </ul>
      )}
    </Cartao>
  )
}
