import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ExerciseDetail } from '@/components/exercise/ExerciseDetail'
import { PageHeader } from '@/components/PageHeader'
import { Button, EmptyState, TextField } from '@/components/ui'
import { useExercise, useExerciseIndex, useFavoriteIds } from '@/db/queries'
import { filterExercises, hasActiveFilters, type ExerciseFilters } from '@/lib/exerciseSearch'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/useMediaQuery'
import { ExerciseFiltersBar } from './ExerciseFiltersBar'
import { ExerciseList } from './ExerciseList'
import { toFilters, type BibliotecaSearch } from './search'
import styles from './BibliotecaPage.module.css'

const route = getRouteApi('/biblioteca')
const SEARCH_DEBOUNCE_MS = 120

const formatCount = (n: number) => new Intl.NumberFormat('es-ES').format(n)

export function BibliotecaPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const filters = toFilters(search)
  const desktop = useMediaQuery(DESKTOP_QUERY)

  const { index, total, loading } = useExerciseIndex()
  const favorites = useFavoriteIds()

  /** Replaces the URL search (no history entry per keystroke or chip). */
  const setSearch = (next: BibliotecaSearch) =>
    void navigate({ to: '/biblioteca', search: next, replace: true, resetScroll: false })

  // Typing updates the field at once; the URL (and results) follow after a short pause.
  const [query, setQuery] = useState(filters.query)
  useEffect(() => {
    if (query === filters.query) return
    const t = setTimeout(() => setSearch({ ...search, q: query || undefined }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setSearch closes over the latest search
  }, [query, filters.query])

  const results = useMemo(
    () => (index ? filterExercises(index, filters, favorites) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is derived from search
    [index, search.q, search.parte, search.equipo, search.fav, favorites],
  )

  const allEquipment = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of index ?? []) {
      const eq = entry.exercise.equipment
      counts.set(eq, (counts.get(eq) ?? 0) + 1)
    }
    return [...counts].sort((a, b) => b[1] - a[1]).map(([eq]) => eq)
  }, [index])

  const orUndefined = (list: string[]) => (list.length ? list : undefined)
  const update = (patch: Partial<ExerciseFilters>) =>
    setSearch({
      ...search,
      parte: patch.bodyParts ? orUndefined(patch.bodyParts) : search.parte,
      equipo: patch.equipment ? orUndefined(patch.equipment) : search.equipo,
      fav: patch.favoritesOnly === undefined ? search.fav : patch.favoritesOnly || undefined,
    })

  const clear = () => {
    setQuery('')
    setSearch({ sel: search.sel })
  }

  const active = hasActiveFilters(filters)

  return (
    <>
      <PageHeader
        title="Biblioteca"
        subtitle={total ? `${formatCount(total)} ejercicios` : undefined}
      />
      <div className={styles.layout}>
        <div className={styles.finder}>
          <div className={styles.searchBar}>
            <TextField
              label="Buscar ejercicio"
              hideLabel
              type="search"
              icon="search"
              placeholder="Press banca, sentadilla, row…"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <ExerciseFiltersBar
            filters={filters}
            allEquipment={allEquipment}
            onChange={update}
            onClear={clear}
            active={active}
          />

          <div className={styles.results}>
            <p className={styles.count} aria-live="polite">
              {loading
                ? 'Cargando el catálogo…'
                : active
                  ? `${formatCount(results.length)} de ${formatCount(total)}`
                  : ''}
            </p>

            {loading ? (
              <SkeletonRows />
            ) : total === 0 ? (
              <EmptyState
                icon="library"
                title="El catálogo no se ha cargado"
                description="Recarga la página. Si sigue vacío, vuelve a importar los ejercicios con npm run import:exercises."
              />
            ) : results.length === 0 ? (
              <NoResults filters={filters} onClear={clear} />
            ) : (
              <div className={styles.reveal}>
                <ExerciseList exercises={results} favorites={favorites} selectInPlace={desktop} />
              </div>
            )}
          </div>
        </div>

        {desktop && (
          <aside className={styles.detailPane} aria-label="Ficha del ejercicio">
            {search.sel ? (
              <SelectedExercise id={search.sel} favorites={favorites} />
            ) : (
              <p className={styles.detailEmpty}>
                Elige un ejercicio de la lista para ver cómo se hace.
              </p>
            )}
          </aside>
        )}
      </div>
    </>
  )
}

function SelectedExercise({ id, favorites }: { id: string; favorites: ReadonlySet<string> }) {
  const exercise = useExercise(id)
  if (!exercise) return null
  return <ExerciseDetail exercise={exercise} favorite={favorites.has(id)} />
}

function NoResults({ filters, onClear }: { filters: ExerciseFilters; onClear: () => void }) {
  if (
    filters.favoritesOnly &&
    !filters.query &&
    !filters.bodyParts.length &&
    !filters.equipment.length
  ) {
    return (
      <EmptyState
        icon="star"
        title="Aún no tienes favoritos"
        description="Marca un ejercicio con «Añadir a favoritos» para tenerlo siempre a mano aquí."
        actions={<Button onClick={onClear}>Ver todos los ejercicios</Button>}
      />
    )
  }
  return (
    <EmptyState
      icon="search"
      title={
        filters.query
          ? `Nada coincide con «${filters.query}»`
          : 'Ningún ejercicio con estos filtros'
      }
      description="Prueba con otra palabra, en español o en inglés (por ejemplo «remo» o «row»), o quita algún filtro."
      actions={<Button onClick={onClear}>Quitar filtros</Button>}
    />
  )
}

function SkeletonRows() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  )
}
