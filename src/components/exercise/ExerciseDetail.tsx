import { Chip } from '@/components/ui'
import { BODY_PART_LABELS, EQUIPMENT_LABELS, label, MUSCLE_LABELS } from '@/db/labels'
import type { Exercise } from '@/db/types'
import { ExerciseMedia } from './ExerciseMedia'
import { FavoriteButton } from './FavoriteButton'
import styles from './ExerciseDetail.module.css'

type Props = {
  exercise: Exercise
  favorite: boolean
  /** Heading level: h1 on its own page, h2 inside the Biblioteca. */
  as?: 'h1' | 'h2'
}

/** Exercise card: media, names, muscles, equipment, steps and attribution. */
export function ExerciseDetail({ exercise, favorite, as: Heading = 'h2' }: Props) {
  const secondary = exercise.secondaryMuscles.filter((m) => m !== exercise.target)

  return (
    <article className={styles.detail} aria-labelledby={`ex-${exercise.id}`}>
      <header className={styles.head}>
        <Heading id={`ex-${exercise.id}`} className={styles.name}>
          {exercise.nameEs}
        </Heading>
        {exercise.name && (
          <p className={styles.nameEn} lang="en">
            {exercise.name}
          </p>
        )}
      </header>

      <div className={styles.media}>
        <ExerciseMedia image={exercise.image} gif={exercise.gif} alt={exercise.nameEs} />
        <FavoriteButton exerciseId={exercise.id} favorite={favorite} />
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Músculo principal</dt>
          <dd>
            <Chip selected>{label(MUSCLE_LABELS, exercise.target)}</Chip>
            <Chip>{label(BODY_PART_LABELS, exercise.bodyPart)}</Chip>
          </dd>
        </div>
        {secondary.length > 0 && (
          <div>
            <dt>Secundarios</dt>
            <dd>
              {secondary.map((m) => (
                <Chip key={m}>{label(MUSCLE_LABELS, m)}</Chip>
              ))}
            </dd>
          </div>
        )}
        <div>
          <dt>Equipo</dt>
          <dd>
            <Chip>{label(EQUIPMENT_LABELS, exercise.equipment)}</Chip>
          </dd>
        </div>
      </dl>

      {exercise.stepsEs.length > 0 && (
        <section aria-labelledby={`steps-${exercise.id}`}>
          <h3 id={`steps-${exercise.id}`} className={styles.sectionTitle}>
            Cómo se hace
          </h3>
          <ol className={styles.steps}>
            {exercise.stepsEs.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby={`hist-${exercise.id}`}>
        <h3 id={`hist-${exercise.id}`} className={styles.sectionTitle}>
          Historial
        </h3>
        <p className={styles.history}>
          Cuando registres este ejercicio verás aquí tus series, con el peso, las reps y cómo te
          sentiste.
        </p>
      </section>

      {!exercise.isCustom && (
        <p className={styles.attribution}>
          ©{' '}
          <a href="https://gymvisual.com/" target="_blank" rel="noreferrer">
            Gym visual — gymvisual.com
          </a>
        </p>
      )}
    </article>
  )
}
