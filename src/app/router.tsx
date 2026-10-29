import {
  createRootRoute,
  createRoute,
  createRouter,
  type RouterHistory,
} from '@tanstack/react-router'
import { AjustesPage } from '@/routes/ajustes/AjustesPage'
import { BibliotecaPage } from '@/routes/biblioteca/BibliotecaPage'
import { parseBibliotecaSearch } from '@/routes/biblioteca/search'
import { CalendarioPage } from '@/routes/calendario/CalendarioPage'
import { CuerpoPage } from '@/routes/cuerpo/CuerpoPage'
import { DevUiPage } from '@/routes/dev/DevUiPage'
import { EjercicioPage } from '@/routes/ejercicio/EjercicioPage'
import { HoyPage } from '@/routes/hoy/HoyPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { ProgresoPage } from '@/routes/progreso/ProgresoPage'
import { RoutineEditorPage } from '@/routes/rutinas/RoutineEditorPage'
import { RutinasPage } from '@/routes/rutinas/RutinasPage'
import { SesionPage } from '@/routes/sesion/SesionPage'
import { RootLayout } from './RootLayout'

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

const getParentRoute = () => rootRoute

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute, path: '/', component: HoyPage }),
  createRoute({ getParentRoute, path: '/calendario', component: CalendarioPage }),
  createRoute({
    getParentRoute,
    path: '/biblioteca',
    component: BibliotecaPage,
    validateSearch: parseBibliotecaSearch,
  }),
  createRoute({
    getParentRoute,
    path: '/rutinas',
    component: RutinasPage,
    validateSearch: (s: Record<string, unknown>): { tab?: 'predefinidas' } =>
      s.tab === 'predefinidas' ? { tab: 'predefinidas' } : {},
  }),
  createRoute({ getParentRoute, path: '/rutinas/$routineId', component: RoutineEditorPage }),
  createRoute({ getParentRoute, path: '/progreso', component: ProgresoPage }),
  createRoute({ getParentRoute, path: '/cuerpo', component: CuerpoPage }),
  createRoute({ getParentRoute, path: '/ajustes', component: AjustesPage }),
  createRoute({ getParentRoute, path: '/sesion/$sessionId', component: SesionPage }),
  createRoute({ getParentRoute, path: '/ejercicio/$exerciseId', component: EjercicioPage }),
  // Hidden: primitives showcase, not linked from the navigation.
  createRoute({ getParentRoute, path: '/dev/ui', component: DevUiPage }),
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
