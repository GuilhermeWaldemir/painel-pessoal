import { AvisoSincronizacao } from './components/AvisoSincronizacao'
import { Navegacao } from './components/Navegacao'
import { DadosProvider } from './contexto/DadosProvider'
import { useAba } from './hooks/useAba'
import { useSessao } from './hooks/useSessao'
import { Calendario } from './paginas/Calendario'
import { Estudos } from './paginas/Estudos'
import { Inicio } from './paginas/Inicio'
import { Livros } from './paginas/Livros'
import { Login } from './paginas/Login'
import { Tarefas } from './paginas/Tarefas'

export default function App() {
  const aba = useAba()
  const sessao = useSessao()

  return (
    <>
      <div className="fundo-brilho" aria-hidden="true" />

      {/* undefined = ainda verificando o login salvo: não mostra nada por um instante */}
      {sessao === null && <Login />}

      {sessao && (
        // key: se outra conta entrar, o provider é recriado do zero
        <DadosProvider key={sessao.user.id} usuario={sessao.user}>
          <div className="app">
            <Navegacao abaAtual={aba} />
            <main className="conteudo">
              <AvisoSincronizacao />
              {aba === 'inicio' && <Inicio />}
              {aba === 'tarefas' && <Tarefas />}
              {aba === 'estudos' && <Estudos />}
              {aba === 'livros' && <Livros />}
              {aba === 'calendario' && <Calendario />}
            </main>
          </div>
        </DadosProvider>
      )}
    </>
  )
}
