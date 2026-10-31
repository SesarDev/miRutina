import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button, EmptyState, Segmented, Sheet } from '@/components/ui'
import { useBodyMetrics } from '@/db/body'
import type { BodyMetric } from '@/db/types'
import { BODY_FIELDS, movingAverage, seriesOf } from '@/lib/body'
import { formatDay, todayKey } from '@/lib/dates'
import { relativeDay } from '@/lib/lastTime'
import { formatWeight } from '@/lib/numbers'
import { CHART_RANGE_LABELS, rangeStart, type ChartRange } from '@/lib/progress'
import { BodyChart } from './BodyChart'
import { BodyForm } from './BodyForm'
import styles from './Cuerpo.module.css'

const rangeOptions = (Object.keys(CHART_RANGE_LABELS) as ChartRange[]).map((value) => ({
  value,
  label: CHART_RANGE_LABELS[value],
}))

/** undefined = closed; null = new record; a record = editing it. */
type FormState = BodyMetric | null | undefined

export function CuerpoPage() {
  const metrics = useBodyMetrics()
  const [form, setForm] = useState<FormState>(undefined)
  const [range, setRange] = useState<ChartRange>('3m')
  const today = todayKey()

  const sheet = (
    <Sheet
      open={form !== undefined}
      onClose={() => setForm(undefined)}
      title={form ? 'Editar registro' : 'Registrar peso y medidas'}
    >
      {form !== undefined && (
        <BodyForm
          key={form?.id ?? 'new'}
          initial={form ?? undefined}
          metrics={metrics ?? []}
          onDone={() => setForm(undefined)}
        />
      )}
    </Sheet>
  )

  const header = (
    <PageHeader
      title="Cuerpo"
      actions={
        <Button variant="primary" icon="plus" onClick={() => setForm(null)}>
          Registrar
        </Button>
      }
    />
  )

  if (metrics === undefined) return header

  if (metrics.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon="body"
          title="Sin registros de peso ni medidas"
          description="Apunta tu peso corporal y, si quieres, cintura, pecho, brazo y muslo. Verás su evolución en una gráfica."
          actions={
            <Button variant="primary" onClick={() => setForm(null)}>
              Registrar peso o medidas
            </Button>
          }
        />
        {sheet}
      </>
    )
  }

  return (
    <>
      {header}
      <div className={styles.page}>
        <div className={styles.charts}>
          <Latest metrics={metrics} today={today} />
          <Segmented
            label="Periodo de las gráficas"
            options={rangeOptions}
            value={range}
            onChange={setRange}
            size="sm"
            className={styles.range}
          />
          <Charts metrics={metrics} from={rangeStart(range, today)} />
        </div>
        <section aria-labelledby="cuerpo-registros">
          <h2 id="cuerpo-registros" className={styles.sectionTitle}>
            Registros
          </h2>
          <RecordsTable metrics={metrics} onEdit={setForm} />
        </section>
      </div>
      {sheet}
    </>
  )
}

function Latest({ metrics, today }: { metrics: BodyMetric[]; today: string }) {
  const weights = seriesOf(metrics, 'bodyweight')
  const last = movingAverage(weights).at(-1)
  if (!last) return null
  return (
    <dl className={styles.latest}>
      <div>
        <dt>Peso · {relativeDay(last.date, today)}</dt>
        <dd className={styles.latestFigure}>
          {formatWeight(last.value)}
          <span className={styles.latestUnit}>kg</span>
        </dd>
      </div>
      <div>
        <dt>Media 7 días</dt>
        <dd className={styles.latestFigure}>
          {formatWeight(last.average)}
          <span className={styles.latestUnit}>kg</span>
        </dd>
      </div>
    </dl>
  )
}

function Charts({ metrics, from }: { metrics: BodyMetric[]; from: string | null }) {
  const series = useMemo(
    () =>
      BODY_FIELDS.map((f) => ({
        ...f,
        all: seriesOf(metrics, f.key),
      })).filter((f) => f.all.length > 0),
    [metrics],
  )
  const weight = series.find((f) => f.key === 'bodyweight')
  const measures = series.filter((f) => f.key !== 'bodyweight')

  return (
    <>
      {weight && (
        <BodyChart label="Peso corporal" unit="kg" points={weight.all} from={from} withAverage />
      )}
      {measures.length > 0 && (
        <div className={styles.measures}>
          {measures.map((f) => (
            <BodyChart
              key={f.key}
              label={f.label}
              unit={f.unit}
              points={f.all}
              from={from}
              size="sm"
            />
          ))}
        </div>
      )}
    </>
  )
}

function RecordsTable({
  metrics,
  onEdit,
}: {
  metrics: BodyMetric[]
  onEdit: (m: BodyMetric) => void
}) {
  const columns = BODY_FIELDS.filter((f) => metrics.some((m) => m[f.key] !== null))
  const withNotes = metrics.some((m) => m.notes)

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={styles.numCell}>
                {c.label} <span className={styles.thUnit}>{c.unit}</span>
              </th>
            ))}
            {withNotes && <th scope="col">Notas</th>}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.id}>
              <th scope="row">
                <button
                  type="button"
                  className={styles.dateButton}
                  onClick={() => onEdit(m)}
                  aria-label={`Editar el registro del ${formatDay(m.date, "d 'de' MMMM yyyy")}`}
                >
                  {formatDay(m.date, 'd MMM yyyy')}
                </button>
              </th>
              {columns.map((c) => (
                <td key={c.key} className={styles.numCell}>
                  {m[c.key] !== null ? formatWeight(m[c.key]!) : '—'}
                </td>
              ))}
              {withNotes && <td className={styles.notesCell}>{m.notes}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
