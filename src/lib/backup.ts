// Backup dos dados do painel: tudo que está no localStorage com o prefixo "painel:".
// Serve para passar os dados de um aparelho para outro (ex.: do PC para o celular).

const PREFIXO = 'painel:'

type Backup = {
  app: 'painel-pessoal'
  versao: 1
  exportadoEm: string
  dados: Record<string, unknown>
}

export function exportarBackup() {
  const dados: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i)
    if (!chave?.startsWith(PREFIXO)) continue
    try {
      dados[chave] = JSON.parse(localStorage.getItem(chave) ?? 'null')
    } catch {
      // Valor corrompido: fica de fora do backup.
    }
  }

  const backup: Backup = { app: 'painel-pessoal', versao: 1, exportadoEm: new Date().toISOString(), dados }

  // Cria um arquivo na memória (Blob) e simula o clique num link de download.
  const arquivo = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = `painel-backup-${backup.exportadoEm.slice(0, 10)}.json`
  link.click()
  // Libera a memória depois de o navegador começar o download (o Safari precisa desse respiro).
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Lê o arquivo e confere se é um backup do painel. Lança erro se o arquivo for inválido. */
export async function lerBackup(arquivo: File) {
  let backup: Backup
  try {
    backup = JSON.parse(await arquivo.text())
  } catch {
    throw new Error('O arquivo não é um backup válido.')
  }

  if (backup?.app !== 'painel-pessoal' || typeof backup.dados !== 'object' || backup.dados === null) {
    throw new Error('Esse arquivo não é um backup do Painel pessoal.')
  }

  return backup.dados
}
