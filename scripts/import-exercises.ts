/**
 * Regenerates the exercise catalogue from vendor/exercises-dataset:
 *   - validates every record against the dataset's JSON Schema (reports and skips invalid ones),
 *   - translates names to Spanish (scripts/exercise-terms.es.json + overrides),
 *   - writes src/db/seed/exercises.json,
 *   - copies images and GIFs to public/exercises/ (© Gym visual; not committed).
 *
 * Usage: npm run import:exercises [-- --report]
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { basename, join } from 'node:path'
import { Ajv2020 } from 'ajv/dist/2020.js'
import type { Exercise } from '../src/db/types.ts'
import { createTranslator, type Terms } from './lib/translate-name.ts'

const ROOT = join(import.meta.dirname, '..')
const DATASET = join(ROOT, 'vendor/exercises-dataset')
const SEED_OUT = join(ROOT, 'src/db/seed/exercises.json')
const MEDIA_OUT = join(ROOT, 'public/exercises')

type RawExercise = {
  id: string
  name: string
  body_part: string
  equipment: string
  target: string
  secondary_muscles: string[]
  instructions: Record<string, string>
  instruction_steps?: Record<string, string[]>
  image: string
  gif_url: string
}

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T

if (!existsSync(DATASET)) {
  console.error(
    `No encuentro ${DATASET}.\nClónalo con:\n  git clone --depth 1 https://github.com/hasaneyldrm/exercises-dataset vendor/exercises-dataset`,
  )
  process.exit(1)
}

const records = readJson<RawExercise[]>(join(DATASET, 'data/exercises.json'))
const schema = readJson<{ $defs: Record<string, unknown> }>(
  join(DATASET, 'data/exercises.schema.json'),
)

// The schema describes the whole array; validate record by record to report and skip.
const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false })
const validateRecord = ajv.compile({
  ...schema,
  type: undefined,
  items: undefined,
  $ref: '#/$defs/exercise',
})

const terms = readJson<Terms>(join(ROOT, 'scripts/exercise-terms.es.json'))
const overrides = readJson<Record<string, string>>(
  join(ROOT, 'scripts/exercise-names-overrides.es.json'),
)
const translate = createTranslator(terms, overrides)

/** Splits a paragraph into sentences when the dataset has no step list. */
const toSteps = (text: string) =>
  text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
    .map((s) => s.trim())
    .filter(Boolean)

const invalid: string[] = []
const unknownWords = new Map<string, number>()
const exercises: Omit<Exercise, 'searchTokens'>[] = []

for (const raw of records) {
  const valid: boolean = validateRecord(raw)
  if (!valid) {
    invalid.push(`${raw?.id ?? '?'} ${raw?.name ?? ''}: ${ajv.errorsText(validateRecord.errors)}`)
    continue
  }
  const { es, unknown } = translate(raw.name)
  for (const w of unknown) unknownWords.set(w, (unknownWords.get(w) ?? 0) + 1)

  const steps = raw.instruction_steps?.es?.length
    ? raw.instruction_steps.es
    : toSteps(raw.instructions.es ?? '')

  exercises.push({
    id: raw.id,
    name: raw.name,
    nameEs: es,
    bodyPart: raw.body_part,
    equipment: raw.equipment,
    target: raw.target,
    secondaryMuscles: raw.secondary_muscles,
    stepsEs: steps,
    image: `/exercises/images/${basename(raw.image)}`,
    gif: `/exercises/gifs/${basename(raw.gif_url)}`,
    isCustom: false,
  })
}

mkdirSync(join(ROOT, 'src/db/seed'), { recursive: true })
// The version lets the app reload the catalogue only when it actually changed.
const version = createHash('sha256').update(JSON.stringify(exercises)).digest('hex').slice(0, 12)
writeFileSync(SEED_OUT, `${JSON.stringify({ version, exercises })}\n`)

// Media: copy only what is missing so re-runs are fast.
let copied = 0
for (const [from, to] of [
  ['images', 'images'],
  ['videos', 'gifs'],
] as const) {
  const src = join(DATASET, from)
  const dest = join(MEDIA_OUT, to)
  mkdirSync(dest, { recursive: true })
  for (const file of readdirSync(src)) {
    if (existsSync(join(dest, file))) continue
    copyFileSync(join(src, file), join(dest, file))
    copied++
  }
}

console.log(`✔ ${exercises.length} ejercicios → ${SEED_OUT}`)
console.log(`✔ ${copied} archivos de media copiados a ${MEDIA_OUT}`)
if (invalid.length) {
  console.warn(`⚠ ${invalid.length} registros no válidos (omitidos):`)
  for (const line of invalid) console.warn(`  - ${line}`)
}
const untranslated = exercises.filter((e) => translate(e.name).unknown.length).length
console.log(
  `ℹ ${untranslated} nombres conservan alguna palabra en inglés (${unknownWords.size} palabras distintas).`,
)
if (process.argv.includes('--report')) {
  const top = [...unknownWords].sort((a, b) => b[1] - a[1])
  console.log(top.map(([w, n]) => `${w}:${n}`).join(' '))
}
