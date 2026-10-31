import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Inlines the entry CSS (~10 kB) into index.html so it no longer blocks the first paint, and
 * preloads the two fonts the first screen uses. CSS of lazy screens still loads with them.
 */
function inlineEntryCss(): Plugin {
  return {
    name: 'mirutina:inline-entry-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        const fonts = Object.keys(bundle)
          .filter((f) => /barlow-(latin-400|condensed-latin-700)-normal-.*\.woff2$/.test(f))
          .map((f) => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin>`)
          .join('')
        return html
          .replace(
            /<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g,
            (tag, file) => {
              const asset = bundle[file]
              return asset?.type === 'asset' ? `<style>${String(asset.source)}</style>` : tag
            },
          )
          .replace('</head>', `${fonts}</head>`)
      },
    },
  }
}
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    inlineEntryCss(),
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
