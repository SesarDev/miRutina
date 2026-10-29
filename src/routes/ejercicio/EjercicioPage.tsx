import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { buttonClassName, EmptyState } from '@/components/ui'

export function EjercicioPage() {
  return (
    <>
      <PageHeader title="Ejercicio" />
      <EmptyState
        icon="library"
        title="No encontramos este ejercicio"
        description="El catálogo aún no está cargado o el enlace no corresponde a ningún ejercicio. Búscalo en la biblioteca."
        actions={
          <Link to="/biblioteca" className={buttonClassName({ variant: 'primary' })}>
            Ir a la biblioteca
          </Link>
        }
      />
    </>
  )
}
