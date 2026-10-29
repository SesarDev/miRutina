import { Button } from '@/components/ui'
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
      icon="star"
      aria-pressed={favorite}
      className={favorite ? styles.favoriteOn : undefined}
      onClick={() => void setFavorite(exerciseId, !favorite)}
    >
      {favorite ? 'En favoritos' : 'Añadir a favoritos'}
    </Button>
  )
}
