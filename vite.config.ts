import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Own service worker (src/sw/sw.ts): pinned GIF cache for favourites and routines.
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      // A new version waits for «Recargar» (src/app/UpdatePrompt.tsx), never mid-session.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'miRutina',
        short_name: 'miRutina',
        description: 'Registro personal de entrenamiento de fuerza.',
        lang: 'es-ES',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0c1626',
        theme_color: '#0c1626',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        // Shell + the 1.324 still images (~12 MB). GIFs are cached on demand (127 MB in total).
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,woff2,webmanifest}',
          'exercises/images/*.jpg',
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./src/test/pwaRegisterMock.ts', import.meta.url),
      ),
    },
    exclude: [...configDefaults.exclude, 'e2e/**'],
    css: { include: [/.+/], modules: { classNameStrategy: 'non-scoped' } },
  },
})
