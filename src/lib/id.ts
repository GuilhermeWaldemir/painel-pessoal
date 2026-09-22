// crypto.randomUUID() só existe em contexto seguro (HTTPS ou localhost).
// Acessando pelo IP da rede local (http://192.168...) ele não existe, então há um plano B.
export function gerarId() {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
