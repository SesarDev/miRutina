/** Cache names shared by the service worker and the app (no DOM or worker APIs here). */

/** GIFs of favourites and of exercises in my routines: managed by the app (src/sync/offlineGifs). */
export const PINNED_GIF_CACHE = 'mirutina-gifs-pinned'

/** GIFs opened on demand: kept by the service worker, oldest dropped first. */
export const VIEWED_GIF_CACHE = 'mirutina-gifs-viewed'

export const GIF_PATH_PREFIX = '/exercises/gifs/'
