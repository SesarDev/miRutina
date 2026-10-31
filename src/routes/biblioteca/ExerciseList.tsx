import { Link } from '@tanstack/react-router'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { ExerciseThumb } from '@/components/exercise/ExerciseMedia'
import { captureForRoute } from '@/motion/flip'
import { Icon } from '@/components/ui'
import { EQUIPMENT_LABELS, label, MUSCLE_LABELS } from '@/db/labels'
import type { Exercise } from '@/db/types'
import type { BibliotecaSearch } from './search'
import styles from './BibliotecaPage.module.css'

const ROW_HEIGHT = 72

type Props = {
  exercises: Exercise[]
  favorites: ReadonlySet<string>
  /** Desktop: rows select into the side panel; mobile: rows open /ejercicio/$id. */
  selectInPlace: boolean
}

/** The selected row is the router-active link (its URL carries ?sel=), styled as the armband. */
export function ExerciseList({ exercises, favorites, selectInPlace }: Props) {
  const listRef = useRef<HTMLUListElement>(null)
  const [offset, setOffset] = useState(0)

  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const measure = () => setOffset(el.getBoundingClientRect().top + window.scrollY)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    return () => ro.disconnect()
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: exercises.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    scrollMargin: offset,
  })

  return (
    <ul
      ref={listRef}
      className={styles.list}
      style={{ height: virtualizer.getTotalSize() }}
      aria-label="Ejercicios"
    >
      {virtualizer.getVirtualItems().map((item) => {
        const exercise = exercises[item.index]!
        const favorite = favorites.has(exercise.id)
        const content = (
          <>
            <ExerciseThumb src={exercise.image} flipId={`media-${exercise.id}`} />
            <span className={styles.rowText}>
              <span className={styles.rowName}>{exercise.nameEs}</span>
              <span className={styles.rowMeta}>
                {label(MUSCLE_LABELS, exercise.target)} ·{' '}
                {label(EQUIPMENT_LABELS, exercise.equipment)}
              </span>
            </span>
            {favorite && (
              <Icon
                name="star"
                size={18}
                className={styles.rowStar}
                aria-label="Favorito"
                role="img"
              />
            )}
          </>
        )
        return (
          <li
            key={exercise.id}
            className={styles.rowItem}
            style={{ transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
            aria-setsize={exercises.length}
            aria-posinset={item.index + 1}
          >
            {selectInPlace ? (
              <Link
                to="/biblioteca"
                search={(prev: BibliotecaSearch) => ({ ...prev, sel: exercise.id })}
                replace
                resetScroll={false}
                className={styles.row}
                onClick={growThumb}
              >
                {content}
              </Link>
            ) : (
              <Link
                to="/ejercicio/$exerciseId"
                params={{ exerciseId: exercise.id }}
                className={styles.row}
                onClick={growThumb}
              >
                {content}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** The row's thumbnail grows into the media of the exercise it opens (GSAP Flip). */
function growThumb(e: MouseEvent<HTMLAnchorElement>) {
  captureForRoute(e.currentTarget.querySelector('[data-flip-id]'))
}
