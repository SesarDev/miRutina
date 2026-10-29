import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { buttonClassName, EmptyState } from '@/components/ui'
import { formatLongDay } from '@/lib/dates'

export function HoyPage() {
  return (
    <>
      <PageHeader title="Hoy" subtitle={<time>{formatLongDay(new Date())}</time>} />
      <EmptyState
        icon="today"
        title="Hoy no tienes nada planificado"
        description="Asigna rutinas a los días en el calendario y aquí verás qué toca, con un botón para empezar."
        actions={
          <>
            <Link to="/calendario" className={buttonClassName({ variant: 'primary' })}>
              Ir al calendario
            </Link>
            <Link to="/rutinas" className={buttonClassName({ variant: 'ghost' })}>
              Crear una rutina
            </Link>
          </>
        }
      />
    </>
  )
}
