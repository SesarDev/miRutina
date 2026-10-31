import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { SyncIndicator } from '@/components/SyncIndicator'
import { Icon, Sheet, Toaster } from '@/components/ui'
import { BOTTOM_NAV_ITEMS, MORE_NAV_ITEMS, NAV_ITEMS } from './nav'
import styles from './RootLayout.module.css'

export function RootLayout() {
  const [moreOpen, setMoreOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const moreActive = MORE_NAV_ITEMS.some((item) => pathname.startsWith(item.to))
  // The session in progress is a dedicated screen: no bottom bar, its own control panel.
  const focus = pathname.startsWith('/sesion/')

  return (
    <div className={styles.shell} data-focus={focus || undefined}>
      <a href="#contenido" className={styles.skipLink}>
        Saltar al contenido
      </a>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <Link to="/" className={styles.brand} aria-label="miRutina, ir a Hoy">
            mi<span>Rutina</span>
          </Link>
          <nav aria-label="Principal">
            <ul className={styles.sideList}>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={styles.sideLink}
                    activeOptions={{ exact: item.to === '/' }}
                  >
                    <Icon name={item.icon} size={22} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.sidebarFooter}>
            <SyncIndicator />
          </div>
        </div>
      </aside>

      {!focus && <SyncIndicator compact />}
      <Toaster />

      <main id="contenido" className={styles.main} tabIndex={-1}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="Principal">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={styles.tab}
            activeOptions={{ exact: item.to === '/' }}
          >
            <span className={styles.tabIcon}>
              <Icon name={item.icon} size={22} />
            </span>
            <span className={styles.tabLabel}>{item.label}</span>
          </Link>
        ))}
        <button
          type="button"
          className={styles.tab}
          data-status={moreActive ? 'active' : undefined}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <span className={styles.tabIcon}>
            <Icon name="more" size={22} />
          </span>
          <span className={styles.tabLabel}>Más</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Más">
        <ul className={styles.moreList}>
          {MORE_NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className={styles.moreLink} onClick={() => setMoreOpen(false)}>
                <Icon name={item.icon} size={22} />
                {item.label}
                <Icon name="chevronRight" size={20} className={styles.chevron} />
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  )
}
