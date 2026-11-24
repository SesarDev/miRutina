/**
 * Downloads the exercise media (© Gym visual — gymvisual.com) into public/exercises/.
 *
 * The media is licensed by Gym visual and is NOT part of this repository: it is fetched
 * at build time from the dataset repo, pinned to a commit so builds are reproducible.
 * Only the files referenced by src/db/seed/exercises.json are required; if they are all
 * present the script exits immediately (no network).
 *
 * Needs only Node (fetch) and `tar`: build images such as Vercel's have no `git`.
 *
 * Usage: npm run fetch:media   (runs automatically before `npm run build`)
 */
import { spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const DATASET_REPO = 'hasaneyldrm/exercises-dataset'
const DATASET_COMMIT = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd'
const TARBALL_URL = `https://codeload.github.com/${DATASET_REPO}/tar.gz/${DATASET_COMMIT}`
const ATTEMPTS = 3

const ROOT = join(import.meta.dirname, '..')
const SEED = join(ROOT, 'src/db/seed/exercises.json')
const MEDIA_OUT = join(ROOT, 'public/exercises')

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

/** Streams the tarball into `tar -xz` run inside `dir` (no -C: avoids Windows path quirks). */
async function downloadAndExtract(dir: string) {
  const res = await fetch(TARBALL_URL)
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} al descargar ${TARBALL_URL}`)

  const tar = spawn('tar', ['-xzf', '-'], { cwd: dir, stdio: ['pipe', 'inherit', 'inherit'] })
  const exited = new Promise<void>((resolve, reject) => {
    tar.on('error', reject)
    tar.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`tar salió con ${code}`))))
  })
  await pipeline(Readable.fromWeb(res.body), tar.stdin)
  await exited
}

console.log(`↓ Descargando la media del dataset (${DATASET_COMMIT.slice(0, 7)})…`)
const work = mkdtempSync(join(tmpdir(), 'exercises-dataset-'))
try {
  for (let attempt = 1; ; attempt++) {
    try {
      await downloadAndExtract(work)
      break
    } catch (err) {
      if (attempt >= ATTEMPTS) throw err
      console.warn(`⚠ Intento ${attempt} fallido (${(err as Error).message}); reintentando…`)
      rmSync(work, { recursive: true, force: true })
      mkdirSync(work)
      await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }

  // The tarball has a single top-level folder: <repo>-<commit>/
  const top = join(work, `${DATASET_REPO.split('/')[1]}-${DATASET_COMMIT}`)
  let copied = 0
  for (const r of missing()) {
    const src = join(top, r.from, r.file)
    if (!existsSync(src)) continue
    mkdirSync(join(MEDIA_OUT, FOLDERS[r.from]), { recursive: true })
    copyFileSync(src, target(r))
    copied++
  }

  const stillMissing = missing()
  if (stillMissing.length) {
    throw new Error(
      `faltan ${stillMissing.length} archivos en el dataset, p. ej. ${stillMissing[0].file}`,
    )
  }
  console.log(`✔ ${copied} archivos de media copiados a public/exercises/.`)
} catch (err) {
  console.error(`✘ No se pudo descargar la media: ${(err as Error).message}`)
  process.exitCode = 1
} finally {
  rmSync(work, { recursive: true, force: true })
}
