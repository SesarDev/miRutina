import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  type RouterHistory,
} from '@tanstack/react-router'
import { parseBibliotecaSearch } from '@/routes/biblioteca/search'
import { isValidDateKey } from '@/lib/dates'
import { HoyPage } from '@/routes/hoy/HoyPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { RootLayout } from './RootLayout'

// Every screen but Hoy loads on demand: charts, drag and drop and the editors stay out of the
// first load (the service worker precaches all chunks, so they still work offline).
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

const getParentRoute = () => rootRoute

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute, path: '/', component: HoyPage }),
  createRoute({
    getParentRoute,
    path: '/calendario',
    component: lazyRouteComponent(
      () => import('@/routes/calendario/CalendarioPage'),
      'CalendarioPage',
    ),
    validateSearch: (s: Record<string, unknown>): { vista?: 'semana' | 'mes'; fecha?: string } => ({
      vista: s.vista === 'semana' || s.vista === 'mes' ? s.vista : undefined,
      fecha: isValidDateKey(s.fecha) ? s.fecha : undefined,
    }),
  }),
  createRoute({
    getParentRoute,
    path: '/biblioteca',
    component: lazyRouteComponent(
      () => import('@/routes/biblioteca/BibliotecaPage'),
      'BibliotecaPage',
    ),
    validateSearch: parseBibliotecaSearch,
  }),
  createRoute({
    getParentRoute,
    path: '/rutinas',
    component: lazyRouteComponent(() => import('@/routes/rutinas/RutinasPage'), 'RutinasPage'),
    validateSearch: (s: Record<string, unknown>): { tab?: 'predefinidas' } =>
      s.tab === 'predefinidas' ? { tab: 'predefinidas' } : {},
  }),
  createRoute({
    getParentRoute,
    path: '/rutinas/$routineId',
    component: lazyRouteComponent(
      () => import('@/routes/rutinas/RoutineEditorPage'),
      'RoutineEditorPage',
    ),
  }),
  createRoute({
    getParentRoute,
    path: '/progreso',
    component: lazyRouteComponent(() => import('@/routes/progreso/ProgresoPage'), 'ProgresoPage'),
  }),
  createRoute({
    getParentRoute,
    path: '/cuerpo',
    component: lazyRouteComponent(() => import('@/routes/cuerpo/CuerpoPage'), 'CuerpoPage'),
  }),
  createRoute({
    getParentRoute,
    path: '/ajustes',
    component: lazyRouteComponent(() => import('@/routes/ajustes/AjustesPage'), 'AjustesPage'),
  }),
  createRoute({
    getParentRoute,
    path: '/sesion/$sessionId',
    component: lazyRouteComponent(() => import('@/routes/sesion/SesionPage'), 'SesionPage'),
    // ?editar=1: a finished session opened to correct it (from its summary or the calendar).
    validateSearch: (s: Record<string, unknown>): { editar?: 1 } =>
      s.editar === 1 || s.editar === '1' ? { editar: 1 } : {},
  }),
  createRoute({
    getParentRoute,
    path: '/ejercicio/$exerciseId',
    component: lazyRouteComponent(
      () => import('@/routes/ejercicio/EjercicioPage'),
      'EjercicioPage',
    ),
    validateSearch: (s: Record<string, unknown>): { tab?: 'historial' | 'grafica' } =>
      s.tab === 'historial' || s.tab === 'grafica' ? { tab: s.tab } : {},
  }),
  // Primitives showcase, development only: in production builds the import is dropped and the
  // path shows the not-found page (the route stays in the tree to keep its types stable).
  createRoute({
    getParentRoute,
    path: '/dev/ui',
    component: import.meta.env.DEV
      ? lazyRouteComponent(() => import('@/routes/dev/DevUiPage'), 'DevUiPage')
      : NotFoundPage,
  }),
])

export function createAppRouter(history?: RouterHistory) {
  return createRouter({ routeTree, history, defaultPreload: 'intent', scrollRestoration: true })
}

export const router = createAppRouter()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
