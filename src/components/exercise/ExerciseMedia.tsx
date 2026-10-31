import { useRef, useState } from 'react'
import { Icon } from '@/components/ui'
import { REDUCED_MOTION_QUERY, useMediaQuery } from '@/lib/useMediaQuery'
import { playFromRoute } from '@/motion/flip'
import { useGSAP } from '@/motion/gsap'
import styles from './ExerciseMedia.module.css'

type Props = {
  image: string
  gif: string
  alt: string
  /** Shared with the list thumbnail that opened this page: the thumbnail grows into it. */
  flipId?: string
}

/** Animated GIF; with «reducir movimiento» shows the still image and plays only on tap. */
export function ExerciseMedia({ image, gif, alt, flipId }: Props) {
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY)
  const [playing, setPlaying] = useState(false)
  const plate = useRef<HTMLDivElement>(null)
  useGSAP(() => playFromRoute(plate.current), { scope: plate, dependencies: [flipId] })

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
    <div ref={plate} className={styles.plate} data-flip-id={flipId}>
      <img src={gif || image} alt={alt} width={180} height={180} />
    </div>
  )
}
