import { LayoutGrid } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

// As mensagens de erro do Supabase vêm em inglês; traduzimos as mais comuns.
function traduzirErro(mensagem: string) {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(mensagem)) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (/already registered/i.test(mensagem)) return 'Já existe uma conta com esse e-mail. Use "Entrar".'
  if (/password should be at least/i.test(mensagem)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/rate limit/i.test(mensagem)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  if (/failed to fetch/i.test(mensagem)) return 'Sem conexão com a internet.'
  return mensagem
}

export function Login() {
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setAviso('')
    setEnviando(true)

    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
        // Deu certo: o useSessao percebe o login e o painel aparece sozinho.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) {
          setAviso(`Enviamos um link de confirmação para ${email}. Clique nele e depois entre aqui com sua senha.`)
          setModo('entrar')
        }
      }
    } catch (e) {
      setErro(traduzirErro(e instanceof Error ? e.message : String(e)))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login">
      <div className="cartao login-cartao">
        <span className="login-logo" aria-hidden="true">
          <LayoutGrid size={26} />
        </span>
        <div className="centro">
          <h1>Painel pessoal</h1>
          <p className="texto-suave">
            {modo === 'entrar' ? 'Entre para ver seus dados em qualquer aparelho.' : 'Crie sua conta.'}
          </p>
        </div>

        <form onSubmit={enviar} className="login-form">
          <input
            className="campo"
            type="email"
            autoComplete="email"
            placeholder="E-mail"
            aria-label="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="campo"
            type="password"
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            placeholder="Senha (mínimo 6 caracteres)"
            aria-label="Senha"
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button type="submit" className="botao" disabled={enviando}>
            {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {erro && <p className="texto-erro centro">{erro}</p>}
        {aviso && <p className="texto-ok centro">{aviso}</p>}

        <button
          className="link centro"
          onClick={() => {
            setModo(modo === 'entrar' ? 'criar' : 'entrar')
            setErro('')
          }}
        >
          {modo === 'entrar' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </main>
  )
}
