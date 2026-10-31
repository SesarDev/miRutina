import { useLiveQuery } from 'dexie-react-hooks'
import { updateExerciseSettings } from '@/db/repo'
import { db } from '@/db/schema'
import type { Exercise } from '@/db/types'
import { formatWeight } from '@/lib/numbers'
import { defaultWeightStep } from '@/lib/session'
import styles from './WeightStepPicker.module.css'

const STEPS = [0.5, 1, 2, 2.5, 5]

/**
 * Step of the session's +/− weight buttons for one exercise. «Auto» follows the equipment
 * (barra 2,5 · mancuernas 2 · máquina y polea 5 · resto 1). A button step, never advice.
 */
export function WeightStepPicker({
  exercise,
  label = 'Paso de los botones de peso',
}: {
  exercise: Pick<Exercise, 'id' | 'equipment'>
  label?: string
}) {
  const custom = useLiveQuery(
    async () => (await db.exerciseSettings.get(exercise.id))?.weightStep ?? null,
    [exercise.id],
  )
  const auto = defaultWeightStep(exercise.equipment)
  const choose = (weightStep: number | null) =>
    void updateExerciseSettings(exercise.id, { weightStep })

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.options}>
        <button
          type="button"
          className={styles.option}
          aria-pressed={custom === null}
          onClick={() => choose(null)}
        >
          Auto · <span className="num">{formatWeight(auto)}</span> kg
        </button>
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            className={styles.option}
            aria-pressed={custom === step}
            onClick={() => choose(step)}
          >
            <span className="num">{formatWeight(step)}</span> kg
          </button>
        ))}
      </div>
    </fieldset>
  )
}
