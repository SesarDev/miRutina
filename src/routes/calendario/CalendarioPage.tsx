import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { buttonClassName, EmptyState } from '@/components/ui'

export function CalendarioPage() {
  return (
    <>
      <PageHeader title="Calendario" />
      <EmptyState
        icon="calendar"
        title="Tu semana está vacía"
        description="Arrastra una rutina a un día para planificarlo; podrás repetirla cada semana. Para empezar necesitas al menos una rutina."
        actions={
          <Link to="/rutinas" className={buttonClassName({ variant: 'primary' })}>
            Crear una rutina
          </Link>
        }
      />
    </>
  )
}
