import type { ExerciseFilters } from '@/lib/exerciseSearch'

/** URL state of /biblioteca, so «back» and reloads keep the search. */
export type BibliotecaSearch = {
  q?: string
  parte?: string[]
  equipo?: string[]
  fav?: boolean
  /** Selected exercise (desktop side panel). */
  sel?: string
}

const strings = (v: unknown) =>
  Array.isArray(v) && v.length ? v.filter((x): x is string => typeof x === 'string') : undefined

export function parseBibliotecaSearch(s: Record<string, unknown>): BibliotecaSearch {
  return {
    q: typeof s.q === 'string' && s.q ? s.q : undefined,
    parte: strings(s.parte),
    equipo: strings(s.equipo),
    fav: s.fav === true || s.fav === 'true' ? true : undefined,
    sel: typeof s.sel === 'string' && s.sel ? s.sel : undefined,
  }
}

export function toFilters(search: BibliotecaSearch): ExerciseFilters {
  return {
    query: search.q ?? '',
    bodyParts: search.parte ?? [],
    equipment: search.equipo ?? [],
    favoritesOnly: search.fav ?? false,
  }
}
