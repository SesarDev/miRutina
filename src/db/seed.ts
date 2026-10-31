import { toSearchTokens } from '@/lib/search'
import { db } from './schema'
import type { Exercise } from './types'

type SeedFile = {
  version: string
  exercises: Omit<Exercise, 'searchTokens'>[]
}

const SEED_VERSION_KEY = 'seedVersion'
const SEED_BATCH = 150

/**
 * Loads the dataset catalogue on first launch, or when `npm run import:exercises`
 * produced a new version. Custom exercises (other ids) are left untouched.
 * The JSON is imported lazily so it stays out of the main bundle.
 */
export async function ensureSeed(load: () => Promise<SeedFile> = loadSeedFile): Promise<boolean> {
  const current = await db.meta.get(SEED_VERSION_KEY)
  const seed = await load()
  if (current?.value === seed.version) return false

  // In batches that yield to the browser: 1.324 rows in one go is a long task on a phone.
  for (let i = 0; i < seed.exercises.length; i += SEED_BATCH) {
    const rows: Exercise[] = seed.exercises.slice(i, i + SEED_BATCH).map((e) => ({
      ...e,
      searchTokens: toSearchTokens(e.name, e.nameEs),
    }))
    await db.exercises.bulkPut(rows)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  // The version is stored last: an interrupted load is simply repeated next time.
  await db.meta.put({ key: SEED_VERSION_KEY, value: seed.version })
  return true
}

async function loadSeedFile(): Promise<SeedFile> {
  const mod = (await import('./seed/exercises.json')) as { default: SeedFile }
  return mod.default
}
