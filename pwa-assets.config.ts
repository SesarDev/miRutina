import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// `npx pwa-assets-generator` regenerates the app icons from public/icon.svg.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#0c1626' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#0c1626' } },
  },
  images: ['public/icon.svg'],
})
