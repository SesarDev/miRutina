import { Link } from '@tanstack/react-router'
import { ExerciseHowTo } from '@/components/exercise/ExerciseHowTo'
import { ExerciseMedia } from '@/components/exercise/ExerciseMedia'
import { Sheet } from '@/components/ui'
import type { Exercise } from '@/db/types'
import styles from './Session.module.css'

/**
 * «Cómo se hace» without leaving the session: the GIF (offline for the exercises of my routines),
 * muscles, equipment and steps. Opened from the exercise's picture.
 */
export function ExerciseSheet({
  exercise,
  open,
  onClose,
}: {
  exercise: Exercise
  open: boolean
  onClose: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={exercise.nameEs}>
      {open && (
        <div className={styles.howTo}>
          <ExerciseMedia image={exercise.image} gif={exercise.gif} alt={exercise.nameEs} />
          <ExerciseHowTo exercise={exercise} section="h3" />
          <Link
            to="/ejercicio/$exerciseId"
            params={{ exerciseId: exercise.id }}
            search={{ tab: 'historial' }}
            className={styles.howToLink}
          >
            Ver historial y gráfica
          </Link>
          {!exercise.isCustom && <p className={styles.attribution}>© Gym visual — gymvisual.com</p>}
        </div>
      )}
    </Sheet>
  )
}
