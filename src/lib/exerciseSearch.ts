import { BODY_PART_LABELS, EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/db/labels'
import type { Exercise } from '@/db/types'
import { toSearchTokens } from './search'

export type ExerciseFilters = {
  query: string
  bodyParts: string[]
  equipment: string[]
  favoritesOnly: boolean
}

export const EMPTY_FILTERS: ExerciseFilters = {
  query: '',
  bodyParts: [],
  equipment: [],
  favoritesOnly: false,
}

/** Equipment shown as chips; the rest live behind «Más equipo». Ordered by catalogue size. */
export const COMMON_EQUIPMENT = [
  'body weight',
  'dumbbell',
  'barbell',
  'cable',
  'leverage machine',
  'smith machine',
  'kettlebell',
  'band',
]

export const BODY_PARTS = [
  'chest',
  'back',
  'shoulders',
  'upper arms',
  'lower arms',
  'upper legs',
  'lower legs',
  'waist',
  'cardio',
  'neck',
]

type Indexed = { exercise: Exercise; words: string[]; nameWords: string[] }

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })

/**
 * Builds the in-memory index once per catalogue: name tokens plus the Spanish and English
 * names of muscles and equipment, so «pecho» or «mancuerna» also find exercises.
 */
export function buildIndex(exercises: Exercise[]): Indexed[] {
  return exercises
    .filter((e) => !e.deletedAt)
    .map((exercise) => {
      const labels = [
        BODY_PART_LABELS[exercise.bodyPart] ?? '',
        EQUIPMENT_LABELS[exercise.equipment] ?? '',
        MUSCLE_LABELS[exercise.target] ?? '',
        exercise.bodyPart,
        exercise.equipment,
        exercise.target,
      ]
      return {
        exercise,
        nameWords: exercise.searchTokens,
        words: [...new Set([...exercise.searchTokens, ...toSearchTokens(...labels)])],
      }
    })
    .sort((a, b) => collator.compare(a.exercise.nameEs, b.exercise.nameEs))
}

/** Every query word must prefix-match some word of the exercise (any order, any language). */
function matches(entry: Indexed, tokens: string[]) {
  return tokens.every((t) => entry.words.some((w) => w.startsWith(t)))
}

/**
 * Higher is better: words found in the name beat words found only in muscle/equipment,
 * a name that starts with the query wins, and shorter names (the base exercise rather
 * than its variants) come first.
 */
function score(entry: Indexed, tokens: string[]) {
  let s = 0
  for (const t of tokens) if (entry.nameWords.some((w) => w.startsWith(t))) s += 10
  if (tokens[0] && entry.nameWords[0]?.startsWith(tokens[0])) s += 5
  return s - entry.nameWords.length * 0.5
}

export function filterExercises(
  index: Indexed[],
  filters: ExerciseFilters,
  favorites: ReadonlySet<string>,
): Exercise[] {
  const tokens = toSearchTokens(filters.query)
  const bodyParts = new Set(filters.bodyParts)
  const equipment = new Set(filters.equipment)

  const hits = index.filter(
    (entry) =>
      (!filters.favoritesOnly || favorites.has(entry.exercise.id)) &&
      (bodyParts.size === 0 || bodyParts.has(entry.exercise.bodyPart)) &&
      (equipment.size === 0 || equipment.has(entry.exercise.equipment)) &&
      (tokens.length === 0 || matches(entry, tokens)),
  )

  if (tokens.length) {
    // Stable sort keeps alphabetical order within the same score.
    return hits
      .map((entry) => ({ entry, s: score(entry, tokens) }))
      .sort((a, b) => b.s - a.s)
      .map(({ entry }) => entry.exercise)
  }
  // No query: favourites first, then A-Z.
  const favs = hits.filter((e) => favorites.has(e.exercise.id))
  const rest = hits.filter((e) => !favorites.has(e.exercise.id))
  return [...favs, ...rest].map((e) => e.exercise)
}

export function hasActiveFilters(filters: ExerciseFilters) {
  return (
    filters.query.trim() !== '' ||
    filters.bodyParts.length > 0 ||
    filters.equipment.length > 0 ||
    filters.favoritesOnly
  )
}
