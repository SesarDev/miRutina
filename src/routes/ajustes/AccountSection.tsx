import { formatDistanceToNow } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { Button, Icon, TextField } from '@/components/ui'
import { DATE_OPTIONS } from '@/lib/dates'
import { isSyncConfigured, requestSync, sendMagicLink, signOut, useAuthSession } from '@/sync'
import { useSyncStore } from '@/sync/store'
import { useSyncSummary } from '@/sync/useSyncSummary'
import styles from './AjustesPage.module.css'

export function AccountSection() {
  return (
    <section className={styles.section} aria-labelledby="ajustes-cuenta">
      <h2 id="ajustes-cuenta" className={styles.label}>
        Cuenta y sincronización
      </h2>
      {isSyncConfigured ? (
        <AccountBody />
      ) : (
        <p className={styles.hint}>
          La sincronización no está configurada en esta instalación. Todo se guarda en este
          dispositivo.
        </p>
      )}
    </section>
  )
}

function AccountBody() {
  const session = useAuthSession()
  if (session === undefined) return <p className={styles.hint}>Comprobando la sesión…</p>
  return session ? <SignedIn email={session.user.email ?? ''} /> : <SignedOut />
}

function SignedOut() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    const failure = await sendMagicLink(email.trim())
    setSending(false)
    if (failure) setError(`No hemos podido enviar el enlace: ${failure}`)
    else setSentTo(email.trim())
  }

  if (sentTo) {
    return (
      <div className={styles.stack}>
        <p className={styles.notice}>
          <Icon name="mail" size={20} />
          <span>
            Te hemos enviado un enlace a <strong>{sentTo}</strong>. Ábrelo en este mismo dispositivo
            para iniciar sesión.
          </span>
        </p>
        <div>
          <Button variant="ghost" onClick={() => setSentTo(null)}>
            Usar otro email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form className={styles.stack} onSubmit={submit}>
      <p className={styles.hint}>
        Inicia sesión para tener tus datos en el PC y en el móvil. Sin sesión, todo se guarda solo
        en este dispositivo.
      </p>
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      <div>
        <Button type="submit" variant="primary" icon="mail" disabled={sending || !email}>
          {sending ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </div>
    </form>
  )
}

function SignedIn({ email }: { email: string }) {
  const { lastSyncedAt, status, error } = useSyncStore()
  const summary = useSyncSummary()
  const [busy, setBusy] = useState(false)

  const syncNow = async () => {
    setBusy(true)
    await requestSync()
    setBusy(false)
  }

  return (
    <div className={styles.stack}>
      <p>
        Conectado como <strong>{email}</strong>
      </p>
      <dl className={styles.facts}>
        <div>
          <dt>Estado</dt>
          <dd>{summary.label}</dd>
        </div>
        <div>
          <dt>Última sincronización</dt>
          <dd>
            {lastSyncedAt ? (
              <time dateTime={lastSyncedAt}>
                {formatDistanceToNow(new Date(lastSyncedAt), { ...DATE_OPTIONS, addSuffix: true })}
              </time>
            ) : (
              'Todavía no'
            )}
          </dd>
        </div>
        <div>
          <dt>Pendiente de subir</dt>
          <dd className="num">
            {summary.pending === 1 ? '1 cambio' : `${summary.pending} cambios`}
          </dd>
        </div>
      </dl>
      {status === 'error' && error && (
        <p className={styles.error} role="alert">
          No se pudo sincronizar ({error}). Se reintentará solo; tus datos siguen guardados en este
          dispositivo.
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" icon="sync" onClick={syncNow} disabled={busy}>
          {busy ? 'Sincronizando…' : 'Sincronizar ahora'}
        </Button>
        <Button variant="ghost" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
