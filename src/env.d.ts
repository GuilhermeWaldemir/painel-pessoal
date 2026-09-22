// Tipos das variáveis do .env.local (o Vite só expõe as que começam com VITE_).
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}
