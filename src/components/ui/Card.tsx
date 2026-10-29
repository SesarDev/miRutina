import type { HTMLAttributes } from 'react'
import styles from './Card.module.css'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'li'
  flush?: boolean
}

export function Card({ as: Tag = 'div', flush = false, className, ...rest }: CardProps) {
  const classes = [styles.card, flush && styles.flush, className].filter(Boolean).join(' ')
  return <Tag className={classes} {...rest} />
}
