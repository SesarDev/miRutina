import { useState } from 'react'
import { Icon } from '@/components/ui'
import { REDUCED_MOTION_QUERY, useMediaQuery } from '@/lib/useMediaQuery'
import styles from './ExerciseMedia.module.css'

type Props = { image: string; gif: string; alt: string }

/** Animated GIF; with «reducir movimiento» shows the still image and plays only on tap. */
export function ExerciseMedia({ image, gif, alt }: Props) {
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY)
  const [playing, setPlaying] = useState(false)

  if (!gif && !image) return null

  if (reduced && !playing) {
    return (
      <button
        type="button"
        className={styles.plate}
        onClick={() => setPlaying(true)}
        aria-label={`Reproducir animación: ${alt}`}
      >
        <img src={image} alt={alt} width={180} height={180} />
        <span className={styles.playBadge} aria-hidden="true">
          <Icon name="play" size={14} /> Ver
        </span>
      </button>
    )
  }

  return (
    <div className={styles.plate}>
      <img src={gif || image} alt={alt} width={180} height={180} />
    </div>
  )
}

export function ExerciseThumb({ src }: { src: string }) {
  if (!src) return <span className={styles.thumb} aria-hidden="true" />
  return (
    <img
      className={styles.thumb}
      src={src}
      alt=""
      width={56}
      height={56}
      loading="lazy"
      decoding="async"
    />
  )
}
