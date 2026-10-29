import 'fake-indexeddb/auto'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createAppRouter } from './router'

function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }))
  render(<RouterProvider router={router} />)
  return router
}

describe('shell', () => {
  it('abre en Hoy con su estado vacío', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument()
    expect(await screen.findByText('Hoy no tienes nada planificado')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument()
  })

  it.each([
    ['/calendario', 'Calendario'],
    ['/biblioteca', 'Biblioteca'],
    ['/rutinas', 'Rutinas'],
    ['/progreso', 'Progreso'],
    ['/cuerpo', 'Cuerpo'],
    ['/ajustes', 'Ajustes'],
    ['/sesion/abc', 'Sesión'],
    ['/ejercicio/0001', 'Ejercicio'],
    ['/dev/ui', 'Primitivas'],
    ['/no-existe', 'Página no encontrada'],
  ])('%s muestra «%s»', async (path, title) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it('la barra inferior navega y marca la pestaña activa', async () => {
    const user = userEvent.setup()
    renderAt('/')
    // Only one of the two «Principal» navs is displayed at a time; the bottom one holds «Más».
    const bottom = (await screen.findByRole('button', { name: 'Más' })).closest('nav')!
    await user.click(within(bottom).getByRole('link', { name: 'Calendario' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Calendario' })).toBeInTheDocument()
    expect(within(bottom).getByRole('link', { name: 'Calendario' })).toHaveAttribute(
      'data-status',
      'active',
    )
  })

  it('«Más» abre el panel con Rutinas, Cuerpo y Ajustes', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(await screen.findByRole('button', { name: 'Más' }))
    const dialog = screen.getByRole('dialog', { name: 'Más' })
    await user.click(within(dialog).getByRole('link', { name: 'Ajustes' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Ajustes' })).toBeInTheDocument()
  })
})
