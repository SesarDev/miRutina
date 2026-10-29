import { duration, parseCubicBezier, parseDuration, prefersReducedMotion } from './tokens'

describe('motion tokens', () => {
  it('convierte tiempos CSS a segundos', () => {
    expect(parseDuration('250ms')).toBe(0.25)
    expect(parseDuration('0.4s')).toBe(0.4)
    expect(parseDuration(' 100ms ')).toBe(0.1)
  })

  it('extrae los puntos de un cubic-bezier', () => {
    expect(parseCubicBezier('cubic-bezier(0.22, 1, 0.36, 1)')).toBe('0.22,1,0.36,1')
    expect(parseCubicBezier('ease-out')).toBeNull()
  })

  it('usa los valores por defecto sin CSS cargado', () => {
    expect(duration('base')).toBe(0.25)
  })

  describe('con reducir movimiento', () => {
    const original = window.matchMedia
    beforeEach(() => {
      window.matchMedia = ((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia
    })
    afterEach(() => {
      window.matchMedia = original
    })

    it('las duraciones de desplazamiento pasan a 0', () => {
      expect(prefersReducedMotion()).toBe(true)
      expect(duration('base')).toBe(0)
      expect(duration('instant')).toBe(0.1)
    })
  })
})
