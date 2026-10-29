import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { ExerciseDetail } from '@/components/exercise/ExerciseDetail'
import { PageHeader } from '@/components/PageHeader'
import { buttonClassName, EmptyState } from '@/components/ui'
import { Icon } from '@/components/ui'
import { useExercise, useFavoriteIds } from '@/db/queries'
import styles from './EjercicioPage.module.css'

const route = getRouteApi('/ejercicio/$exerciseId')

export function EjercicioPage() {
  const { exerciseId } = route.useParams()
  const exercise = useExercise(exerciseId)
  const favorites = useFavoriteIds()
  const router = useRouter()

  const back = (
    <Link
      to="/biblioteca"
      className={`${buttonClassName({ variant: 'ghost' })} ${styles.back}`}
      onClick={(e) => {
        // Return to the exact search the user came from.
        if (window.history.length > 1) {
          e.preventDefault()
          router.history.back()
        }
      }}
    >
      <Icon name="chevronLeft" size={20} />
      Biblioteca
    </Link>
  )

  if (exercise === undefined) return back

  if (!exercise || exercise.deletedAt) {
    return (
      <>
        {back}
        <PageHeader title="Ejercicio" />
        <EmptyState
          icon="library"
          title="No encontramos este ejercicio"
          description="Puede que el catálogo aún se esté cargando o que el enlace no corresponda a ningún ejercicio. Búscalo en la biblioteca."
          actions={
            <Link to="/biblioteca" className={buttonClassName({ variant: 'primary' })}>
              Ir a la biblioteca
            </Link>
          }
        />
      </>
    )
  }

  return (
    <>
      {back}
      <ExerciseDetail exercise={exercise} favorite={favorites.has(exercise.id)} as="h1" />
    </>
  )
}
