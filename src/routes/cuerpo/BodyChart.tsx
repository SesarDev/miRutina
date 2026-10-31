import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useRef } from 'react'
import { movingAverage, type BodyPoint } from '@/lib/body'
import { formatDay, fromDateKey, toDateKey, type DateKey } from '@/lib/dates'
import { formatWeight } from '@/lib/numbers'
import { useDrawLines } from '@/motion/scroll'
import styles from './Cuerpo.module.css'

type Datum = { t: number; date: DateKey; value: number; average?: number }

type Props = {
  label: string
  unit: 'kg' | 'cm'
  /** Every point of the field; `from` cuts them after the average is computed. */
  points: BodyPoint[]
  from: DateKey | null
  /** Draws the 7-day moving average over the raw values (body weight). */
  withAverage?: boolean
  size?: 'lg' | 'sm'
}

/** One body field over time. The table on the page holds the same figures as text. */
export function BodyChart({ label, unit, points, from, withAverage = false, size = 'lg' }: Props) {
  // The average of the first days shown needs the days before the range.
  const data: Datum[] = (withAverage ? movingAverage(points) : points)
    .filter((p) => !from || p.date >= from)
    .map((p) => ({ ...p, t: fromDateKey(p.date).getTime() }))
  const values = data.map((p) => p.value)
  const chart = useRef<HTMLDivElement>(null)
  useDrawLines(chart, data.length > 0)
  const description = data.length
    ? `${label}: ${data.length} ${data.length === 1 ? 'registro' : 'registros'}, entre ` +
      `${formatWeight(Math.min(...values))} y ${formatWeight(Math.max(...values))} ${unit}` +
      (withAverage ? ', con la media de 7 días' : '') +
      '. Los datos están en la tabla.'
    : `${label}: sin registros en este periodo.`

  return (
    <figure className={styles.chartFigure}>
      <figcaption className={styles.chartCaption}>
        <span className={styles.chartTitle}>{label}</span>
        {withAverage && (
          <span className={styles.chartLegend}>
            <span className={styles.keyRaw} aria-hidden="true" /> Registros
            <span className={styles.keyAvg} aria-hidden="true" /> Media 7 días
          </span>
        )}
      </figcaption>
      {data.length === 0 ? (
        <p className={styles.chartEmpty}>Sin registros en este periodo.</p>
      ) : (
        <div
          ref={chart}
          className={`${styles.chart} ${size === 'sm' ? styles.chartSm : ''}`}
          role="img"
          aria-label={description}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
              accessibilityLayer={false}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                padding={{ left: 12, right: 12 }}
                tickFormatter={(t: number) => formatDay(toDateKey(new Date(t)), 'd MMM')}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
                tickFormatter={(v: number) => formatWeight(v)}
                tickLine={false}
                axisLine={false}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const d = active ? (payload?.[0]?.payload as Datum | undefined) : undefined
                  if (!d) return null
                  return (
                    <div className={styles.tooltip}>
                      <span className={styles.tooltipDate}>
                        {formatDay(d.date, "EEEE d 'de' MMMM")}
                      </span>
                      <span className={styles.tooltipValue}>
                        {formatWeight(d.value)} {unit}
                      </span>
                      {d.average !== undefined && (
                        <span>
                          Media 7 días: {formatWeight(d.average)} {unit}
                        </span>
                      )}
                    </div>
                  )
                }}
              />
              <Line
                dataKey="value"
                className={withAverage ? styles.lineRaw : `${styles.lineMain} t-draw`}
                isAnimationActive={false}
                dot={{ r: withAverage ? 2.5 : 3.5 }}
                activeDot={{ r: 5 }}
              />
              {withAverage && (
                <Line
                  dataKey="average"
                  className={`${styles.lineAvg} t-draw`}
                  isAnimationActive={false}
                  dot={false}
                  activeDot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  )
}
