import { Repeat } from 'lucide-react'
import { CabecalhoPagina, Cartao } from '../components/Cartao'
import { BarraProgresso } from '../components/graficos'
import { ListaDeTarefas } from '../components/ListaDeTarefas'
import { useDados } from '../contexto/DadosContext'
import { dataCurta, diasDaSemana } from '../lib/datas'
import { tarefaFeita } from '../lib/tarefas'
import type { Periodo } from '../tipos'

export function Tarefas() {
  const semana = diasDaSemana()
  return (
    <>
      <CabecalhoPagina titulo="Tarefas" subtitulo={`Semana de ${dataCurta(semana[0])} a ${dataCurta(semana[6])}`} />
      <div className="grade-pagina">
        <CartaoPeriodo periodo="dia" />
        <CartaoPeriodo periodo="semana" />
      </div>
    </>
  )
}

const TEXTOS: Record<Periodo, { titulo: string; volta: string; some: string }> = {
  dia: { titulo: 'Do dia', volta: 'todo dia', some: 'no dia seguinte' },
  semana: { titulo: 'Da semana', volta: 'toda segunda-feira', some: 'na semana seguinte' },
}

function CartaoPeriodo({ periodo }: { periodo: Periodo }) {
  const { tarefas } = useDados()
  const lista = tarefas.filter((t) => t.periodo === periodo)
  const feitas = lista.filter(tarefaFeita).length
  const textos = TEXTOS[periodo]

  return (
    <Cartao
      titulo={textos.titulo}
      acao={
        <span className="pilula">
          {feitas}/{lista.length}
        </span>
      }
    >
      <BarraProgresso valor={lista.length ? feitas / lista.length : 0} />
      <ListaDeTarefas periodo={periodo} />
      <p className="legenda">
        Com <Repeat size={12} aria-label="repetir" /> a tarefa volta {textos.volta}. Sem ele, depois de concluída ela
        some {textos.some}.
      </p>
    </Cartao>
  )
}
