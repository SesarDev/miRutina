import 'fake-indexeddb/auto'
import { db } from '@/db/schema'
import { save, setFavorite, softDelete } from '@/db/repo'
import type { Exercise } from '@/db/types'
import { reconcileGifs, wantedGifUrls } from './offlineGifs'

const exercise = (id: string): Exercise => ({
  id,
  name: id,
  nameEs: id,
  bodyPart: 'chest',
  equipment: 'barbell',
  target: 'pectorals',
  secondaryMuscles: [],
  stepsEs: [],
  image: `/exercises/images/${id}.jpg`,
  gif: `/exercises/gifs/${id}.gif`,
  isCustom: false,
  searchTokens: [],
})

const item = (exerciseId: string) => ({
  id: `item-${exerciseId}`,
  exerciseId,
  sets: 3,
  repMin: 8,
  repMax: 12,
  restSec: 120,
  order: 0,
  technique: 'normal' as const,
  groupId: null,
})

beforeEach(async () => {
  await db.delete()
  await db.open()
  await db.exercises.bulkPut(['a', 'b', 'c', 'd'].map(exercise))
})

describe('wantedGifUrls', () => {
  it('favoritos y ejercicios de rutinas no borradas, sin repetir', async () => {
    await setFavorite('a', true)
    await setFavorite('d', true)
    await setFavorite('d', false)
    await save('routines', { id: 'r1', name: 'Torso', items: [item('a'), item('b')] })
    await save('routines', { id: 'r2', name: 'Vieja', items: [item('c')] })
    await softDelete('routines', 'r2')
    expect([...(await wantedGifUrls())].sort()).toEqual([
      '/exercises/gifs/a.gif',
      '/exercises/gifs/b.gif',
    ])
  })
})

describe('reconcileGifs', () => {
  // Minimal Cache Storage: enough for open/keys/delete/add.
  const store = new Map<string, true>()
  beforeEach(() => {
    store.clear()
    const cache = {
      keys: async () => [...store.keys()].map((path) => new Request(`http://localhost${path}`)),
      delete: async (path: string) => store.delete(path),
      add: async (path: string) => {
        if (path.includes('missing')) throw new Error('404')
        store.set(path, true)
      },
    }
    vi.stubGlobal('caches', { open: async () => cache })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('descarga lo que falta y borra lo que ya no hace falta', async () => {
    store.set('/exercises/gifs/old.gif', true)
    store.set('/exercises/gifs/a.gif', true)
    const result = await reconcileGifs(new Set(['/exercises/gifs/a.gif', '/exercises/gifs/b.gif']))
    expect(result).toEqual({ added: 1, removed: 1 })
    expect([...store.keys()].sort()).toEqual(['/exercises/gifs/a.gif', '/exercises/gifs/b.gif'])
  })

  it('un fallo de descarga no rompe el resto (se reintenta la próxima vez)', async () => {
    const result = await reconcileGifs(
      new Set(['/exercises/gifs/missing.gif', '/exercises/gifs/c.gif']),
    )
    expect(result.added).toBe(1)
    expect(store.has('/exercises/gifs/c.gif')).toBe(true)
  })
})
