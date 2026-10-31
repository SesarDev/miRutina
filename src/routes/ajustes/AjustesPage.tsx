import { PageHeader } from '@/components/PageHeader'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { AccountSection } from './AccountSection'
import { WorkoutSection } from './WorkoutSection'
import styles from './AjustesPage.module.css'

export function AjustesPage() {
  return (
    <>
      <PageHeader title="Ajustes" />
      <div className={styles.page}>
        <AccountSection />
        <WorkoutSection />
        <section className={styles.section} aria-labelledby="ajustes-tema">
          <h2 id="ajustes-tema" className={styles.label}>
            Tema
          </h2>
          <ThemeSwitcher />
          <p className={styles.hint}>
            «Sistema» usa el oscuro salvo que tu dispositivo esté en modo claro.
          </p>
        </section>
      </div>
    </>
  )
}
