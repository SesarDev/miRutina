import { Chip } from '@/components/ui'
import { BODY_PART_LABELS, EQUIPMENT_LABELS, label, MUSCLE_LABELS } from '@/db/labels'
import type { Exercise } from '@/db/types'
import styles from './ExerciseDetail.module.css'

/**
 * Muscles, equipment and steps of an exercise. Shared by the exercise page («Cómo se hace») and
 * the sheet opened from a session; `section` is the heading level below the exercise name.
 */
export function ExerciseHowTo({
  exercise,
  section: Section,
}: {
  exercise: Exercise
  section: 'h2' | 'h3'
}) {
  const secondary = exercise.secondaryMuscles.filter((m) => m !== exercise.target)
  return (
    <>
      <dl className={styles.facts}>
        <div>
          <dt>Músculo principal</dt>
          <dd>
            <Chip>{label(MUSCLE_LABELS, exercise.target)}</Chip>
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
          <Section id={`steps-${exercise.id}`} className={styles.sectionTitle}>
            Pasos
          </Section>
          <ol className={styles.steps}>
            {exercise.stepsEs.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}
