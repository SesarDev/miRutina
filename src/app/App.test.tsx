import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('se renderiza', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'miRutina' })).toBeInTheDocument()
  })
})
