/**
 * Downloads the exercise media (© Gym visual — gymvisual.com) into public/exercises/.
 *
 * The media is licensed by Gym visual and is NOT part of this repository: it is fetched
 * at build time from the dataset repo, pinned to a commit so builds are reproducible.
 * Only the files referenced by src/db/seed/exercises.json are required; if they are all
 * present the script exits immediately (no network).
 *
 * Usage: npm run fetch:media   (runs automatically before `npm run build`)
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const DATASET_URL = 'https://github.com/hasaneyldrm/exercises-dataset'
const DATASET_COMMIT = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd'

const ROOT = join(import.meta.dirname, '..')
const SEED = join(ROOT, 'src/db/seed/exercises.json')
const MEDIA_OUT = join(ROOT, 'public/exercises')
const CACHE = join(ROOT, 'node_modules/.cache/exercises-dataset')

/** Dataset folder → public folder. */
const FOLDERS = { images: 'images', videos: 'gifs' } as const

type Seed = { exercises: { image: string; gif: string }[] }
const { exercises } = JSON.parse(readFileSync(SEED, 'utf8')) as Seed

const required = exercises.flatMap((e) => [
  { from: 'images', file: basename(e.image) },
  { from: 'videos', file: basename(e.gif) },
]) satisfies { from: keyof typeof FOLDERS; file: string }[]

const target = (r: (typeof required)[number]) => join(MEDIA_OUT, FOLDERS[r.from], r.file)
const missing = () => required.filter((r) => !existsSync(target(r)))

if (missing().length === 0) {
  console.log(`✔ Media de ejercicios completa (${required.length} archivos).`)
  process.exit(0)
}

const git = (...args: string[]) => {
  const res = spawnSync('git', ['-C', CACHE, ...args], { stdio: 'inherit' })
  if (res.status !== 0) {
    console.error(`✘ Falló: git ${args.join(' ')}`)
    process.exit(1)
  }
}

console.log(`↓ Descargando la media del dataset (${DATASET_COMMIT.slice(0, 7)})…`)
if (!existsSync(join(CACHE, '.git'))) {
  mkdirSync(CACHE, { recursive: true })
  git('init', '--quiet')
  git('remote', 'add', 'origin', DATASET_URL)
  git('sparse-checkout', 'set', '--no-cone', '/images/', '/videos/')
}
git('fetch', '--quiet', '--depth', '1', 'origin', DATASET_COMMIT)
git('checkout', '--quiet', '--detach', 'FETCH_HEAD')

let copied = 0
for (const r of missing()) {
  const src = join(CACHE, r.from, r.file)
  if (!existsSync(src)) continue
  mkdirSync(join(MEDIA_OUT, FOLDERS[r.from]), { recursive: true })
  copyFileSync(src, target(r))
  copied++
}

const stillMissing = missing()
if (stillMissing.length) {
  console.error(`✘ Faltan ${stillMissing.length} archivos en el dataset, p. ej. ${stillMissing[0].file}`)
  process.exit(1)
}
console.log(`✔ ${copied} archivos de media copiados a public/exercises/.`)
