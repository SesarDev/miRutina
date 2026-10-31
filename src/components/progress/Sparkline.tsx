import styles from './Progress.module.css'

const W = 96
const H = 32
const PAD = 3

/** Tiny trend line, decorative: the figures it draws are always written next to it. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return <svg width={W} height={H} aria-hidden="true" />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i: number) =>
    values.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (values.length - 1)
  const y = (v: number) => (max === min ? H / 2 : H - PAD - ((v - min) * (H - PAD * 2)) / span)
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const last = values.length - 1

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={styles.spark}
      aria-hidden="true"
      focusable="false"
    >
      <polyline points={points} />
      <circle cx={x(last)} cy={y(values[last]!)} r={3} />
    </svg>
  )
}
