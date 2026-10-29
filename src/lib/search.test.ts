import { normalizeText, toSearchTokens } from './search'

describe('search', () => {
  it('ignora tildes, mayúsculas y signos', () => {
    expect(normalizeText('Extensión de TRÍCEPS (con cuerda)')).toBe(
      'extension de triceps con cuerda',
    )
  })

  it('trata la ñ como n y conserva los grados', () => {
    expect(normalizeText('Prensa 45° · Muñeca')).toBe('prensa 45° muneca')
  })

  it('une palabras de varios textos sin repetir', () => {
    expect(toSearchTokens('barbell bench press', 'Press de banca con barra')).toEqual([
      'barbell',
      'bench',
      'press',
      'de',
      'banca',
      'con',
      'barra',
    ])
  })
})
