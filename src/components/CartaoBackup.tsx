import { Cloud, CloudOff, Download, LogOut, RefreshCw, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useDados } from '../contexto/DadosContext'
import { exportarBackup, lerBackup } from '../lib/backup'
import { Cartao } from './Cartao'

const ROTULO_SYNC = {
  ok: 'Sincronizado',
  sincronizando: 'Sincronizando…',
  erro: 'Sem conexão',
}

export function CartaoBackup() {
  const { email, estadoSync, sincronizar, importar, sair } = useDados()
  // useRef guarda uma referência ao <input type="file"> escondido, para "clicar" nele pelo botão bonito.
  const inputArquivo = useRef<HTMLInputElement>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function aoEscolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!arquivo) return

    try {
      await importar(await lerBackup(arquivo))
      setMensagem({ tipo: 'ok', texto: 'Backup importado e enviado para a nuvem.' })
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível importar.' })
    }
  }

  return (
    <Cartao
      titulo="Conta e dados"
      acao={
        <span className={estadoSync === 'erro' ? 'pilula pilula-erro' : 'pilula'}>
          {estadoSync === 'erro' ? <CloudOff size={12} /> : <Cloud size={12} />} {ROTULO_SYNC[estadoSync]}
        </span>
      }
    >
      <p className="legenda">
        Conectado como <strong>{email}</strong>. Tudo o que você faz aqui aparece nos outros aparelhos em que você
        entrar com esta conta.
      </p>

      <div className="linha-botoes">
        <button className="botao botao-secundario" onClick={() => sincronizar()}>
          <RefreshCw size={16} /> Sincronizar
        </button>
        <button className="botao botao-secundario" onClick={sair}>
          <LogOut size={16} /> Sair
        </button>
      </div>

      <p className="legenda">
        Backup: exporte uma cópia em arquivo, ou importe um backup antigo — os dados dele são somados aos da nuvem.
      </p>
      <div className="linha-botoes">
        <button className="botao botao-secundario" onClick={exportarBackup}>
          <Download size={16} /> Exportar
        </button>
        <button className="botao botao-secundario" onClick={() => inputArquivo.current?.click()}>
          <Upload size={16} /> Importar
        </button>
      </div>
      <input ref={inputArquivo} type="file" accept="application/json,.json" onChange={aoEscolherArquivo} hidden />
      {mensagem && <p className={mensagem.tipo === 'erro' ? 'texto-erro' : 'texto-ok'}>{mensagem.texto}</p>}
    </Cartao>
  )
}
