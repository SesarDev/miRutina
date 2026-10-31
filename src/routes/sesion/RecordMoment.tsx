import { useRef, useState } from 'react'
import { Icon } from '@/components/ui'
import type { RecentRecord } from '@/db/queries'
import { usePrefs } from '@/lib/prefs'
import { formatWeight } from '@/lib/numbers'
import { formatRecord, RECORD_LABELS, type RecordKind } from '@/lib/progress'
import { distance, duration, ease } from '@/motion/tokens'
import { gsap, useGSAP } from '@/motion/gsap'
import styles from './Session.module.css'

/** The record that wears the armband: the heaviest kind of news first. */
const PRIORITY: RecordKind[] = ['weight', 'e1rm', 'reps', 'volume']

/** A session counts as just finished (and celebrates) for this long after «Terminar». */
const FRESH_MS = 15_000
const VIBRATION = [20, 60, 20]

const volumeFormat = new Intl.NumberFormat('es-ES')

function figureOf(r: RecentRecord): { value: string; unit: string; label: string } {
  switch (r.kind) {
    case 'reps':
      return {
        value: String(r.value),
        unit: 'reps',
        label: `Más reps con ${r.weight ? `${formatWeight(r.weight)} kg` : 'peso corporal'}`,
      }
    case 'volume':
      return { value: volumeFormat.format(r.value), unit: 'kg', label: RECORD_LABELS.volume }
    default:
      return { value: formatWeight(r.value), unit: 'kg', label: RECORD_LABELS[r.kind] }
  }
}

function previousOf(r: RecentRecord): string {
  if (r.kind === 'reps') return `antes ${r.previous}`
  const value = r.kind === 'volume' ? volumeFormat.format(r.previous) : formatWeight(r.previous)
  return `antes ${value} kg`
}

/**
 * The one moment of recognition (DESIGN.md): a new record is printed like a new shirt number.
 * The main record wears the armband with its figure; the rest are listed underneath. Right after
 * «Terminar» it enters with one short GSAP timeline (< 800 ms) and a brief vibration; reopened
 * later, it is simply there. No confetti, nothing to dismiss.
 */
export function RecordMoment({ records, endedAt }: { records: RecentRecord[]; endedAt: string }) {
  const root = useRef<HTMLElement>(null)
  const vibrate = usePrefs((s) => s.vibrate)
  const [fresh] = useState(() => Date.now() - Date.parse(endedAt) < FRESH_MS)
  const sorted = [...records].sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind))
  const [main, ...others] = sorted

  useGSAP(
    () => {
      if (!fresh || !main) return
      if (vibrate) navigator.vibrate?.(VIBRATION)
      const base = duration('base')
      const overlap = `-=${base * 0.4}`
      gsap
        .timeline({ defaults: { ease: ease('out') } })
        .from('[data-record-band]', { scaleX: 0, transformOrigin: '0 50%', duration: base })
        .from('[data-record-text]', { autoAlpha: 0, x: -distance('base'), duration: base }, overlap)
        .from(
          '[data-record-figure]',
          {
            autoAlpha: 0,
            scale: 1.12,
            transformOrigin: '0 100%',
            duration: base,
            ease: ease('spring'),
          },
          '<',
        )
        .from(
          '[data-record-item]',
          {
            autoAlpha: 0,
            y: distance('medium'),
            duration: base,
            stagger: { amount: duration('fast') },
          },
          overlap,
        )
    },
    { scope: root, dependencies: [!!main] },
  )

  if (!main) return null
  const figure = figureOf(main)

  return (
    <section ref={root} aria-labelledby="summary-records" className={styles.recordMoment}>
      <h2 id="summary-records" className={styles.lastLabel}>
        {records.length === 1 ? 'Récord nuevo' : `${records.length} récords nuevos`}
      </h2>
      <div className={styles.recordBand} data-record-band>
        <p className={styles.recordBandText} data-record-text>
          <span className={styles.recordBandLabel}>{figure.label}</span>
          <span className={styles.recordBandName}>{main.name}</span>
        </p>
        <p className={styles.recordFigure}>
          <span data-record-figure className="num">
            {figure.value}
            <span className={styles.recordUnit}> {figure.unit}</span>
          </span>
          <span className={styles.recordBefore} data-record-text>
            {previousOf(main)}
          </span>
        </p>
      </div>
      {others.length > 0 && (
        <ul className={styles.recordList}>
          {others.map((r) => (
            <li key={`${r.exerciseId}-${r.kind}-${r.weight ?? ''}`} data-record-item>
              <Icon name="star" size={18} className={styles.summaryStar} />
              <span>
                <span className={styles.summaryRecordName}>{r.name}</span>
                <span className={styles.summaryRecordText}>{formatRecord(r)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
