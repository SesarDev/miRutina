import { useMemo, useState } from 'react'
import { HistoryList } from '@/components/progress/HistoryList'
import { ProgressChart } from '@/components/progress/ProgressChart'
import { RecordCards } from '@/components/progress/RecordCards'
import { Chip, Segmented } from '@/components/ui'
import { BODY_PART_LABELS, EQUIPMENT_LABELS, label, MUSCLE_LABELS } from '@/db/labels'
import { useExerciseHistory } from '@/db/queries'
import type { Exercise } from '@/db/types'
import { todayKey } from '@/lib/dates'
import { personalRecords, recordsBySession } from '@/lib/progress'
import { ExerciseMedia } from './ExerciseMedia'
import { FavoriteButton } from './FavoriteButton'
import { WeightStepPicker } from './WeightStepPicker'
import styles from './ExerciseDetail.module.css'

export type ExerciseTab = 'como' | 'historial' | 'grafica'

const TABS = [
  { value: 'como', label: 'Cómo se hace' },
  { value: 'historial', label: 'Historial' },
  { value: 'grafica', label: 'Gráfica' },
] as const satisfies readonly { value: ExerciseTab; label: string }[]

type Props = {
  exercise: Exercise
  favorite: boolean
  /** Heading level: h1 on its own page, h2 inside the Biblioteca. */
  as?: 'h1' | 'h2'
  /** Controlled tab (the exercise page keeps it in the URL); local state otherwise. */
  tab?: ExerciseTab
  onTabChange?: (tab: ExerciseTab) => void
}

/** Exercise card: names, personal records and three tabs (how-to, history, chart). */
export function ExerciseDetail({
  exercise,
  favorite,
  as: Heading = 'h2',
  tab: controlledTab,
  onTabChange,
}: Props) {
  const [localTab, setLocalTab] = useState<ExerciseTab>('como')
  const tab = controlledTab ?? localTab
  const setTab = onTabChange ?? setLocalTab

  const history = useExerciseHistory(exercise.id)
  const today = todayKey()
  const { records, bests } = useMemo(
    () => ({
      records: recordsBySession(exercise.id, history ?? []),
      bests: personalRecords(history ?? []),
    }),
    [exercise.id, history],
  )

  const idPrefix = `ex-${exercise.id}`

  return (
    <article className={styles.detail} aria-labelledby={idPrefix}>
      <header className={styles.head}>
        <Heading id={idPrefix} className={styles.name}>
          {exercise.nameEs}
        </Heading>
        {exercise.name && (
          <p className={styles.nameEn} lang="en">
            {exercise.name}
          </p>
        )}
      </header>

      <RecordCards records={bests} />

      <Segmented
        kind="tabs"
        idPrefix={idPrefix}
        label="Secciones del ejercicio"
        options={TABS}
        value={tab}
        onChange={setTab}
        className={styles.tabs}
      />

      <div
        id={`${idPrefix}-panel`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${tab}`}
        className={styles.panel}
      >
        {tab === 'como' && <HowTo exercise={exercise} favorite={favorite} heading={Heading} />}
        {tab === 'historial' && history && (
          <HistoryList sessions={history} records={records} today={today} />
        )}
        {tab === 'grafica' && history && <ProgressChart sessions={history} today={today} />}
      </div>

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

function HowTo({
  exercise,
  favorite,
  heading,
}: {
  exercise: Exercise
  favorite: boolean
  heading: 'h1' | 'h2'
}) {
  // Section headings sit one level below the exercise name.
  const Section = heading === 'h1' ? 'h2' : 'h3'
  const secondary = exercise.secondaryMuscles.filter((m) => m !== exercise.target)

  return (
    <>
      <div className={styles.media}>
        <ExerciseMedia
          image={exercise.image}
          gif={exercise.gif}
          alt={exercise.nameEs}
          flipId={`media-${exercise.id}`}
        />
        <FavoriteButton exerciseId={exercise.id} favorite={favorite} />
      </div>

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

      <section aria-labelledby={`session-${exercise.id}`}>
        <Section id={`session-${exercise.id}`} className={styles.sectionTitle}>
          En la sesión
        </Section>
        <WeightStepPicker exercise={exercise} />
      </section>
    </>
  )
}
