import seed from '@/db/seed/exercises.json'
import type { Exercise } from '@/db/types'
import { buildIndex, EMPTY_FILTERS, filterExercises } from './exerciseSearch'
import { toSearchTokens } from './search'

const catalogue: Exercise[] = (
  seed as { exercises: Omit<Exercise, 'searchTokens'>[] }
).exercises.map((e) => ({ ...e, searchTokens: toSearchTokens(e.name, e.nameEs) }))
const index = buildIndex(catalogue)
const none = new Set<string>()
const search = (query: string, extra: Partial<typeof EMPTY_FILTERS> = {}, favs = none) =>
  filterExercises(index, { ...EMPTY_FILTERS, query, ...extra }, favs)

describe('exercise search (catálogo real)', () => {
  it('sin filtros devuelve los 1.324 ejercicios en orden alfabético', () => {
    const all = search('')
    expect(all).toHaveLength(1324)
    const names = all.slice(0, 50).map((e) => e.nameEs)
    expect(names).toEqual(
      [...names].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true })),
    )
  })

  it('«press banca» encuentra el press de banca con barra entre los primeros', () => {
    const hits = search('press banca')
      .slice(0, 10)
      .map((e) => e.name)
    expect(hits).toContain('barbell bench press')
  })

  it('busca en inglés («bench») y sin tildes («extension triceps»)', () => {
    expect(search('bench').some((e) => e.name === 'barbell bench press')).toBe(true)
    expect(search('extension triceps').length).toBeGreaterThan(10)
    expect(search('sentadilla').length).toBeGreaterThan(50)
  })

  it('busca por músculo en español', () => {
    expect(
      search('pecho').every(
        (e) => e.bodyPart === 'chest' || /pecho|chest/i.test(e.nameEs + e.target),
      ),
    ).toBe(true)
  })

  it('combina filtros (Pecho + Mancuerna) con la búsqueda', () => {
    const hits = search('press', { bodyParts: ['chest'], equipment: ['dumbbell'] })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((e) => e.bodyPart === 'chest' && e.equipment === 'dumbbell')).toBe(true)
    expect(hits.some((e) => e.name === 'dumbbell bench press')).toBe(true)
  })

  it('favoritos: primero sin búsqueda y filtrables', () => {
    const favs = new Set(['0025'])
    expect(search('', {}, favs)[0]?.id).toBe('0025')
    expect(search('', { favoritesOnly: true }, favs).map((e) => e.id)).toEqual(['0025'])
  })

  it('tarda menos de 100 ms por búsqueda', () => {
    const start = performance.now()
    for (const q of ['press banca', 'sentadilla', 'bench', 'curl martillo', 'remo']) search(q)
    expect((performance.now() - start) / 5).toBeLessThan(100)
  })
})
