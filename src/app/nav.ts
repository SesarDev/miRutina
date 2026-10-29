import type { IconName } from '@/components/ui'

export type NavItem = {
  to: '/' | '/calendario' | '/biblioteca' | '/progreso' | '/rutinas' | '/cuerpo' | '/ajustes'
  label: string
  icon: IconName
}

/** Sidebar order (≥ 1024 px): planning first, then data. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Hoy', icon: 'today' },
  { to: '/calendario', label: 'Calendario', icon: 'calendar' },
  { to: '/rutinas', label: 'Rutinas', icon: 'routines' },
  { to: '/biblioteca', label: 'Biblioteca', icon: 'library' },
  { to: '/progreso', label: 'Progreso', icon: 'progress' },
  { to: '/cuerpo', label: 'Cuerpo', icon: 'body' },
  { to: '/ajustes', label: 'Ajustes', icon: 'settings' },
]

const byPath = (to: NavItem['to']) => NAV_ITEMS.find((item) => item.to === to)!

/** Bottom bar on mobile: four destinations plus «Más». */
export const BOTTOM_NAV_ITEMS: NavItem[] = ['/', '/calendario', '/biblioteca', '/progreso'].map(
  (to) => byPath(to as NavItem['to']),
)

/** Destinations reached from «Más» on mobile. */
export const MORE_NAV_ITEMS: NavItem[] = ['/rutinas', '/cuerpo', '/ajustes'].map((to) =>
  byPath(to as NavItem['to']),
)
