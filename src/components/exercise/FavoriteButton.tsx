import { Button, Icon } from '@/components/ui'
import { setFavorite } from '@/db/repo'
import styles from './ExerciseDetail.module.css'

export function FavoriteButton({
  exerciseId,
  favorite,
}: {
  exerciseId: string
  favorite: boolean
}) {
  return (
    <Button
      variant={favorite ? 'secondary' : 'ghost'}
      aria-pressed={favorite}
      className={favorite ? styles.favoriteOn : undefined}
      onClick={() => void setFavorite(exerciseId, !favorite)}
    >
      {/* Outline star ↔ filled star (transitions.dev «icon swap»). */}
      <span className={`t-icon-swap ${styles.favoriteIcon}`} data-state={favorite ? 'b' : 'a'}>
        <Icon name="star" size={20} className="t-icon" data-icon="a" />
        <Icon name="star" size={20} className="t-icon" data-icon="b" fill="currentColor" />
      </span>
      {favorite ? 'En favoritos' : 'Añadir a favoritos'}
    </Button>
  )
}
