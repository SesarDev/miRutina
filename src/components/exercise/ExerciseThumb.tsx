import styles from './ExerciseMedia.module.css'

/** Small still image of a list row (no GSAP here: it is on the first screen). */
export function ExerciseThumb({ src, flipId }: { src: string; flipId?: string }) {
  if (!src) return <span className={styles.thumb} aria-hidden="true" />
  return (
    <img
      className={styles.thumb}
      data-flip-id={flipId}
      src={src}
      alt=""
      width={56}
      height={56}
      loading="lazy"
      decoding="async"
    />
  )
}
