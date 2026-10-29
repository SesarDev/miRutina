import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui'

export function CuerpoPage() {
  return (
    <>
      <PageHeader title="Cuerpo" />
      <EmptyState
        icon="body"
        title="Sin registros de peso ni medidas"
        description="Apunta tu peso corporal y, si quieres, cintura, pecho, brazo y muslo. Verás su evolución en una gráfica."
      />
    </>
  )
}
