import { toSearchTokens } from '@/lib/search'
import { db } from './schema'
import type { Exercise } from './types'

type SeedFile = {
  version: string
  exercises: Omit<Exercise, 'searchTokens'>[]
}

const SEED_VERSION_KEY = 'seedVersion'

/**
 * Loads the dataset catalogue on first launch, or when `npm run import:exercises`
 * produced a new version. Custom exercises (other ids) are left untouched.
 * The JSON is imported lazily so it stays out of the main bundle.
 */
export async function ensureSeed(load: () => Promise<SeedFile> = loadSeedFile): Promise<boolean> {
  const current = await db.meta.get(SEED_VERSION_KEY)
  const seed = await load()
  if (current?.value === seed.version) return false

  const rows: Exercise[] = seed.exercises.map((e) => ({
    ...e,
    searchTokens: toSearchTokens(e.name, e.nameEs),
  }))
  await db.transaction('rw', db.exercises, db.meta, async () => {
    await db.exercises.bulkPut(rows)
    await db.meta.put({ key: SEED_VERSION_KEY, value: seed.version })
  })
  return true
}

async function loadSeedFile(): Promise<SeedFile> {
  const mod = (await import('./seed/exercises.json')) as { default: SeedFile }
  return mod.default
}
