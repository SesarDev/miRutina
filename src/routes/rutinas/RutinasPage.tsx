import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { formatDistanceToNowStrict } from 'date-fns'
import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import {
  Button,
  buttonClassName,
  Chip,
  EmptyState,
  Icon,
  IconButton,
  showToast,
} from '@/components/ui'
import { BODY_PART_LABELS, label } from '@/db/labels'
import {
  useExercisesById,
  useLastDoneByRoutine,
  useRoutines,
  useRoutineTemplates,
} from '@/db/queries'
import {
  copyTemplate,
  createRoutine,
  deleteRoutine,
  duplicateRoutine,
  restoreRoutine,
} from '@/db/routines'
import { TECHNIQUE_LABELS, type Routine, type RoutineTemplate, type SetTechnique } from '@/db/types'
import { DATE_OPTIONS } from '@/lib/dates'
import { estimateMinutes } from '@/lib/routines'
import styles from './RutinasPage.module.css'

const route = getRouteApi('/rutinas')

export function RutinasPage() {
  const { tab } = route.useSearch()
  const navigate = useNavigate()

  const create = async () => {
    const routine = await createRoutine('Nueva rutina')
    void navigate({ to: '/rutinas/$routineId', params: { routineId: routine.id } })
  }

  return (
    <>
      <PageHeader
        title="Rutinas"
        actions={
          <Button variant="primary" icon="plus" onClick={() => void create()}>
            Nueva rutina
          </Button>
        }
      />
      <div className={styles.tabs} role="tablist" aria-label="Tipo de rutinas">
        {(
          [
            [undefined, 'Mis rutinas'],
            ['predefinidas', 'Predefinidas'],
          ] as const
        ).map(([value, text]) => (
          <button
            key={text}
            type="button"
            role="tab"
            id={`tab-${value ?? 'mias'}`}
            aria-selected={tab === value}
            aria-controls="rutinas-panel"
            className={styles.tab}
            onClick={() =>
              void navigate({ to: '/rutinas', search: value ? { tab: value } : {}, replace: true })
            }
          >
            {text}
          </button>
        ))}
      </div>
      <div id="rutinas-panel" role="tabpanel" aria-labelledby={`tab-${tab ?? 'mias'}`}>
        {tab === 'predefinidas' ? <Templates /> : <MyRoutines onCreate={() => void create()} />}
      </div>
    </>
  )
}

// ── Mis rutinas ──

function MyRoutines({ onCreate }: { onCreate: () => void }) {
  const routines = useRoutines()
  const lastDone = useLastDoneByRoutine()
  const exercises = useExercisesById(
    (routines ?? []).flatMap((r) => r.items.map((i) => i.exerciseId)),
  )

  if (routines === undefined) return null
  if (routines.length === 0) {
    return (
      <EmptyState
        icon="routines"
        title="Todavía no tienes rutinas"
        description="Crea la tuya con los ejercicios, series y descansos que sueles hacer, o parte de una predefinida y ajústala."
        actions={
          <>
            <Button variant="primary" onClick={onCreate}>
              Crear una rutina
            </Button>
            <Link
              to="/rutinas"
              search={{ tab: 'predefinidas' }}
              className={buttonClassName({ variant: 'ghost' })}
            >
              Ver predefinidas
            </Link>
          </>
        }
      />
    )
  }

  return (
    <ul className={styles.list}>
      {routines.map((r) => (
        <RoutineRow
          key={r.id}
          routine={r}
          lastDone={lastDone.get(r.id)}
          bodyParts={mainBodyParts(r, exercises)}
        />
      ))}
    </ul>
  )
}

/** The 3 body parts with most exercises in the routine. */
function mainBodyParts(r: Pick<Routine, 'items'>, exercises: Map<string, { bodyPart: string }>) {
  const counts = new Map<string, number>()
  for (const item of r.items) {
    const part = exercises.get(item.exerciseId)?.bodyPart
    if (part) counts.set(part, (counts.get(part) ?? 0) + 1)
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([p]) => label(BODY_PART_LABELS, p))
}

function RoutineRow({
  routine,
  lastDone,
  bodyParts,
}: {
  routine: Routine
  lastDone?: string
  bodyParts: string[]
}) {
  const navigate = useNavigate()
  const n = routine.items.length
  const minutes = estimateMinutes(routine.items)

  const remove = async () => {
    await deleteRoutine(routine.id)
    showToast({
      message: `«${routine.name}» borrada`,
      actionLabel: 'Deshacer',
      onAction: () => void restoreRoutine(routine.id),
    })
  }

  const duplicate = async () => {
    const copy = await duplicateRoutine(routine.id)
    if (copy) void navigate({ to: '/rutinas/$routineId', params: { routineId: copy.id } })
  }

  return (
    <li className={styles.row}>
      <Link to="/rutinas/$routineId" params={{ routineId: routine.id }} className={styles.rowMain}>
        <span className={styles.rowName}>{routine.name}</span>
        <span className={styles.rowMeta}>
          {n === 1 ? '1 ejercicio' : `${n} ejercicios`}
          {minutes > 0 && (
            <>
              {' '}
              · <span className="num">≈ {minutes} min</span>
            </>
          )}
          {bodyParts.length > 0 && <> · {bodyParts.join(', ')}</>}
        </span>
        <span className={styles.rowLast}>
          {lastDone
            ? `Última vez ${formatDistanceToNowStrict(new Date(`${lastDone}T12:00:00`), { ...DATE_OPTIONS, addSuffix: true })}`
            : 'Sin hacer todavía'}
        </span>
      </Link>
      <div className={styles.rowActions}>
        <IconButton
          icon="copy"
          label={`Duplicar ${routine.name}`}
          onClick={() => void duplicate()}
        />
        <IconButton icon="trash" label={`Borrar ${routine.name}`} onClick={() => void remove()} />
      </div>
    </li>
  )
}

// ── Predefinidas ──

const DURATIONS = [
  { key: '30', label: '30 min', test: (m: number) => m <= 35 },
  { key: '45', label: '45 min', test: (m: number) => m > 35 && m <= 50 },
  { key: '60', label: '60 min', test: (m: number) => m > 50 && m <= 65 },
  { key: '75', label: '75 min o más', test: (m: number) => m > 65 },
]

function Templates() {
  const templates = useRoutineTemplates()
  const [part, setPart] = useState<string | null>(null)
  const [technique, setTechnique] = useState<SetTechnique | null>(null)
  const [duration, setDuration] = useState<string | null>(null)

  if (templates === undefined) return null

  const parts = [...new Set(templates.flatMap((t) => t.bodyParts))]
  const techniques = [...new Set(templates.map((t) => t.technique))]
  const durationTest = DURATIONS.find((d) => d.key === duration)?.test
  const visible = templates.filter(
    (t) =>
      (!part || t.bodyParts.includes(part)) &&
      (!technique || t.technique === technique) &&
      (!durationTest || durationTest(t.durationMin)),
  )

  return (
    <div className={styles.templates}>
      <div className={styles.filters} role="group" aria-label="Filtros">
        <FilterRow label="Músculo">
          {parts.map((p) => (
            <Chip key={p} selected={part === p} onClick={() => setPart(part === p ? null : p)}>
              {label(BODY_PART_LABELS, p)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Técnica">
          {techniques.map((t) => (
            <Chip
              key={t}
              selected={technique === t}
              onClick={() => setTechnique(technique === t ? null : t)}
            >
              {TECHNIQUE_LABELS[t]}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Duración">
          {DURATIONS.map((d) => (
            <Chip
              key={d.key}
              selected={duration === d.key}
              onClick={() => setDuration(duration === d.key ? null : d.key)}
            >
              {d.label}
            </Chip>
          ))}
        </FilterRow>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Ninguna rutina con estos filtros"
          description="Quita algún filtro para ver más."
          actions={
            <Button
              onClick={() => {
                setPart(null)
                setTechnique(null)
                setDuration(null)
              }}
            >
              Quitar filtros
            </Button>
          }
        />
      ) : (
        <ul className={styles.cards}>
          {visible.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterRow({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className={styles.filterRow}>
      <legend className={styles.filterLabel}>{text}</legend>
      <div className={styles.chips}>{children}</div>
    </fieldset>
  )
}

function TemplateCard({ template }: { template: RoutineTemplate }) {
  const navigate = useNavigate()
  const exercises = useExercisesById(template.items.map((i) => i.exerciseId))

  const copy = async () => {
    const routine = await copyTemplate(template.id)
    if (!routine) return
    showToast({ message: `«${template.name}» copiada a tus rutinas` })
    void navigate({ to: '/rutinas/$routineId', params: { routineId: routine.id } })
  }

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardName}>{template.name}</h2>
        <span className={`${styles.duration} num`}>
          <Icon name="clock" size={16} /> ≈ {template.durationMin} min
        </span>
      </div>
      <p className={styles.cardDesc}>{template.description}</p>
      <div className={styles.cardChips}>
        <Chip selected>{TECHNIQUE_LABELS[template.technique]}</Chip>
        {template.bodyParts.map((p) => (
          <Chip key={p}>{label(BODY_PART_LABELS, p)}</Chip>
        ))}
      </div>
      <details className={styles.details}>
        <summary>Ver ejercicios ({template.items.length})</summary>
        <ol className={styles.exerciseList}>
          {template.items.map((item) => (
            <li key={item.id}>
              <span>{exercises.get(item.exerciseId)?.nameEs ?? '…'}</span>
              <span className={`${styles.sets} num`}>
                {item.sets} ×{' '}
                {item.repsPerSet?.join('·') ??
                  (item.repMin === item.repMax ? item.repMin : `${item.repMin}–${item.repMax}`)}
                {item.groupId ? ' · SS' : ''}
              </span>
            </li>
          ))}
        </ol>
      </details>
      <div className={styles.cardActions}>
        <Button variant="secondary" icon="copy" onClick={() => void copy()}>
          Copiar a mis rutinas
        </Button>
      </div>
    </li>
  )
}
