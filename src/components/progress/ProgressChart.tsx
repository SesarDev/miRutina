import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotItemDotProps,
} from 'recharts'
import { Chip, Icon, Segmented } from '@/components/ui'
import type { HistorySession } from '@/db/queries'
import { FEEL_LABELS, FEELS, type Feel } from '@/db/types'
import { formatDay, fromDateKey, toDateKey, type DateKey } from '@/lib/dates'
import { summarizeSets, summaryFeel } from '@/lib/lastTime'
import { formatWeight } from '@/lib/numbers'
import {
  CHART_METRIC_LABELS,
  CHART_RANGE_LABELS,
  metricOf,
  rangeStart,
  sessionStats,
  workSets,
  type ChartMetric,
  type ChartRange,
} from '@/lib/progress'
import styles from './Progress.module.css'

type Point = {
  t: number
  date: DateKey
  value: number
  feel: Feel | null
  sets: string
}

/** Feel labels are drawn next to each point while they fit without overlapping. */
const MAX_LABELLED_POINTS = 5

const volumeFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })
const formatValue = (metric: ChartMetric, v: number) =>
  metric === 'volume' ? volumeFormat.format(v) : formatWeight(v)

const metricOptions = (Object.keys(CHART_METRIC_LABELS) as ChartMetric[]).map((value) => ({
  value,
  label: CHART_METRIC_LABELS[value],
}))
const rangeOptions = (Object.keys(CHART_RANGE_LABELS) as ChartRange[]).map((value) => ({
  value,
  label: CHART_RANGE_LABELS[value],
}))

/** Evolution of one exercise; each point carries the feel of the session's last set. */
export function ProgressChart({ sessions, today }: { sessions: HistorySession[]; today: DateKey }) {
  const [metric, setMetric] = useState<ChartMetric>('weight')
  const [range, setRange] = useState<ChartRange>('3m')

  const points = useMemo(() => {
    const from = rangeStart(range, today)
    const out: Point[] = []
    for (const s of [...sessions].reverse()) {
      if (from && s.date < from) continue
      const work = workSets(s.sets)
      const value = metricOf(sessionStats(work), metric)
      if (value === null) continue
      out.push({
        t: fromDateKey(s.date).getTime(),
        date: s.date,
        value,
        feel: summaryFeel(work),
        sets: summarizeSets(work),
      })
    }
    return out
  }, [sessions, metric, range, today])

  const labelled = points.length <= MAX_LABELLED_POINTS
  const feelsShown = FEELS.filter((f) => points.some((p) => p.feel === f))
  const unit = 'kg'
  const values = points.map((p) => p.value)
  const description = points.length
    ? `${CHART_METRIC_LABELS[metric]} en ${points.length} ${points.length === 1 ? 'sesión' : 'sesiones'}, ` +
      `entre ${formatValue(metric, Math.min(...values))} y ${formatValue(metric, Math.max(...values))} ${unit}. ` +
      'Los datos están en la tabla de abajo.'
    : ''

  return (
    <div>
      <div className={styles.chartTools}>
        <Segmented
          label="Qué mostrar"
          options={metricOptions}
          value={metric}
          onChange={setMetric}
          size="sm"
        />
        <Segmented
          label="Periodo"
          options={rangeOptions}
          value={range}
          onChange={setRange}
          size="sm"
        />
      </div>

      {points.length === 0 ? (
        <p className={styles.empty}>
          {sessions.length
            ? 'No hay sesiones en este periodo. Prueba con un periodo más largo.'
            : 'Cuando registres este ejercicio verás aquí cómo evoluciona, con tu valoración en cada punto.'}
        </p>
      ) : (
        <figure>
          <div className={styles.chart} role="img" aria-label={description}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={points}
                margin={{ top: labelled ? 28 : 16, right: 16, bottom: 4, left: 0 }}
                accessibilityLayer={false}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  padding={{ left: 16, right: 16 }}
                  tickFormatter={(t: number) => formatDay(toDateKey(new Date(t)), 'd MMM')}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  dataKey="value"
                  domain={[
                    (min: number) => Math.max(0, Math.floor(min * 0.92)),
                    (max: number) => Math.ceil(max * 1.04),
                  ]}
                  tickFormatter={(v: number) => formatValue(metric, v)}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => (
                    <ChartTooltip
                      metric={metric}
                      point={active ? (payload?.[0]?.payload as Point | undefined) : undefined}
                    />
                  )}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="value"
                  type="linear"
                  isAnimationActive={false}
                  dot={({ cx, cy, payload, index }: DotItemDotProps) => (
                    <FeelDot
                      key={index}
                      cx={cx}
                      cy={cy}
                      point={payload as Point}
                      labelled={labelled}
                    />
                  )}
                  activeDot={({ cx, cy, payload }) => (
                    <FeelDot cx={cx} cy={cy} point={payload as Point} labelled={false} r={7} />
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {feelsShown.length > 0 && (
            <figcaption>
              <span className="visually-hidden">Valoración de la última serie: </span>
              <ul className={styles.legend}>
                {feelsShown.map((f) => (
                  <li key={f}>
                    <Chip feel={f} />
                  </li>
                ))}
              </ul>
            </figcaption>
          )}
        </figure>
      )}

      {points.length > 0 && (
        <details className={styles.data}>
          <summary>
            Ver los datos
            <Icon name="chevronDown" size={18} className={styles.chevron} />
          </summary>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col" className={styles.numCell}>
                  {CHART_METRIC_LABELS[metric]}
                </th>
                <th scope="col">Valoración</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.t}>
                  <td>
                    <time dateTime={p.date}>{formatDay(p.date, 'd MMM yyyy')}</time>
                  </td>
                  <td className={styles.numCell}>
                    {formatValue(metric, p.value)} {unit}
                  </td>
                  <td>{p.feel ? FEEL_LABELS[p.feel] : 'Sin valorar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}

function FeelDot({
  cx,
  cy,
  point,
  labelled,
  r = 5,
}: {
  cx?: number
  cy?: number
  point: Point
  labelled: boolean
  r?: number
}) {
  if (cx === undefined || cy === undefined) return null
  const { feel } = point
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        className={`${styles.dot} ${feel ? styles[feel] : styles.dotNone}`}
      />
      {labelled && feel && (
        <text x={cx} y={cy - 12} textAnchor="middle" className={styles.dotLabel}>
          {FEEL_LABELS[feel]}
        </text>
      )}
    </g>
  )
}

function ChartTooltip({ point, metric }: { point: Point | undefined; metric: ChartMetric }) {
  if (!point) return null
  return (
    <div className={styles.tooltip}>
      <span className={styles.label}>{formatDay(point.date, "EEEE d 'de' MMMM")}</span>
      <span className={styles.figure}>
        {formatValue(metric, point.value)}
        <span className={styles.unit}>kg</span>
      </span>
      <span className={styles.tooltipSets}>{point.sets}</span>
      <span>{point.feel ? FEEL_LABELS[point.feel] : 'Sin valorar'}</span>
    </div>
  )
}
