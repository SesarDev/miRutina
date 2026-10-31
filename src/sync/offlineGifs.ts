/**
 * GIFs available offline (docs/NOTAS.md · F6): those of favourite exercises and of exercises in
 * my routines are kept in the pinned cache, which the service worker serves first. The cache is
 * reconciled whenever favourites or routines change (also when they arrive by sync): missing GIFs
 * are downloaded in the background, GIFs no longer needed are removed. Still images are always
 * precached, so nothing here is needed for the app to work.
 */
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db } from '@/db/schema'
import { PINNED_GIF_CACHE } from '@/sw/caches'

/** At most this many downloads at a time, so the gym's mobile data is not flooded. */
const PARALLEL = 3

/** GIF URLs that should be offline: favourites + exercises of non-deleted routines. */
export async function wantedGifUrls(): Promise<Set<string>> {
  const favourites = (await db.exerciseSettings.toArray())
    .filter((s) => s.favorite && !s.deletedAt)
    .map((s) => s.exerciseId)
  const inRoutines = (await db.routines.toArray())
    .filter((r) => !r.deletedAt)
    .flatMap((r) => r.items.map((i) => i.exerciseId))
  const exercises = await db.exercises.bulkGet([...new Set([...favourites, ...inRoutines])])
  return new Set(exercises.flatMap((e) => (e?.gif ? [e.gif] : [])))
}

/** Brings the pinned cache in line with `wanted` (absolute paths such as /exercises/gifs/…). */
export async function reconcileGifs(
  wanted: Set<string>,
): Promise<{ added: number; removed: number }> {
  if (typeof caches === 'undefined') return { added: 0, removed: 0 }
  const cache = await caches.open(PINNED_GIF_CACHE)
  const cached = new Set((await cache.keys()).map((r) => new URL(r.url).pathname))

  let removed = 0
  for (const path of cached) {
    if (!wanted.has(path) && (await cache.delete(path))) removed++
  }

  const missing = [...wanted].filter((path) => !cached.has(path))
  let added = 0
  const worker = async () => {
    for (let path = missing.shift(); path; path = missing.shift()) {
      try {
        await cache.add(path)
        added++
      } catch {
        // Offline or not found: retried on the next reconcile.
      }
    }
  }
  if (typeof navigator === 'undefined' || navigator.onLine) {
    await Promise.all(Array.from({ length: PARALLEL }, worker))
  }
  return { added, removed }
}

/** Keeps the pinned GIFs in sync with favourites and routines while the app is open. */
export function useOfflineGifs() {
  const key = useLiveQuery(async () => [...(await wantedGifUrls())].sort().join('|'), [])

  useEffect(() => {
    if (key === undefined) return
    const run = () => void reconcileGifs(new Set(key ? key.split('|') : []))
    // Let the screen settle first; retry when the network comes back.
    const timer = window.setTimeout(run, 2000)
    window.addEventListener('online', run)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('online', run)
    }
  }, [key])
}
