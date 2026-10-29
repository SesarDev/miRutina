import { clamp, parseDecimal, roundTo } from './numbers'

describe('numbers', () => {
  it('redondea sin errores de coma flotante', () => {
    expect(roundTo(0.1 + 0.2, 1)).toBe(0.3)
    expect(roundTo(61.25, 1)).toBe(61.3)
  })

  it('limita a un rango', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(12, 0, 10)).toBe(10)
  })

  it('acepta coma o punto decimal', () => {
    expect(parseDecimal('61,5')).toBe(61.5)
    expect(parseDecimal(' 60.5 ')).toBe(60.5)
    expect(parseDecimal('')).toBeNull()
  })
})
