/// <reference lib="webworker" />
/**
 * Service worker (vite-plugin-pwa, injectManifest). Offline first for the app itself:
 * - precache: the shell (HTML, JS incl. the exercise catalogue chunk, CSS, fonts, icons) and the
 *   1.324 exercise images (~12 MB), so every exercise has a picture without network;
 * - GIFs: the pinned cache (favourites and routines, filled by the app) first, then cache-first
 *   on demand with a size limit;
 * - Supabase and any other origin: not touched (the sync engine handles being offline).
 * A new version waits until the app asks for it («Nueva versión disponible · Recargar»).
 */
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { GIF_PATH_PREFIX, PINNED_GIF_CACHE, VIEWED_GIF_CACHE } from './caches'

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (PrecacheEntry | string)[] }

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Client-side routes all load the app shell.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/exercises\//, /^\/sw\.js$/, /^\/manifest\.webmanifest$/],
  }),
)

const viewedGifs = new CacheFirst({
  cacheName: VIEWED_GIF_CACHE,
  plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 60 })],
})

registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith(GIF_PATH_PREFIX),
  async (options) => {
    const pinned = await caches.open(PINNED_GIF_CACHE)
    const hit = await pinned.match(options.request)
    return hit ?? viewedGifs.handle(options)
  },
)

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})
