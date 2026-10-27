import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'prompt',

      includeAssets: [
        'favicon.ico',
        'logo.png',
      ],

      manifest: {
        name: 'EasyVacc - Caderneta Digital de Vacinação',
        short_name: 'EasyVacc',
        description:
          'Sua caderneta digital de vacinação e da sua família.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#020817',
        theme_color: '#126ca8',
        lang: 'pt-BR',

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api(?:\/|$)/,
          /^\/auth\/callback(?:\/|$)/,
        ],
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,woff2}',
        ],
        cleanupOutdatedCaches: true,
        runtimeCaching: [],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
})