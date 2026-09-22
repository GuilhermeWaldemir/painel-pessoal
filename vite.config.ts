import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gera o manifest (nome, ícones, cores do "app") e o service worker,
    // que permite instalar o site na tela inicial do celular.
    VitePWA({
      registerType: 'autoUpdate',
      // O registro é feito à mão no main.tsx, para controlar quando procurar atualizações.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Painel pessoal',
        short_name: 'Painel',
        description: 'Meu painel pessoal: clima, tarefas, estudos, livros e agenda.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        theme_color: '#070a14',
        background_color: '#070a14',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
