import { describe, expect, it } from 'vitest'
import terms from '../exercise-terms.es.json' with { type: 'json' }
import { createTranslator, inflect, type Terms } from './translate-name.ts'

const t = createTranslator(terms as Terms)
const es = (name: string) => t(name).es

describe('translate-name', () => {
  it.each([
    ['barbell bench press', 'Press de banca con barra'],
    ['barbell incline bench press', 'Press de banca inclinado con barra'],
    ['barbell full squat', 'Sentadilla profunda con barra'],
    ['barbell romanian deadlift', 'Peso muerto rumano con barra'],
    ['barbell bent over row', 'Remo inclinado con barra'],
    ['dumbbell one arm bent over row', 'Remo inclinado a una mano con mancuerna'],
    ['dumbbell lateral raise', 'Elevación lateral con mancuernas'],
    ['dumbbell alternate biceps curl', 'Curl de bíceps alterno con mancuernas'],
    ['band reverse fly', 'Aperturas inversas con banda elástica'],
    ['assisted pull-up', 'Dominada asistida'],
    ['lever lying leg curl', 'Curl femoral tumbado en máquina'],
    ['sled 45в° leg press', 'Prensa de piernas 45°'],
    [
      'barbell standing close grip military press',
      'Press militar de pie con barra, agarre cerrado',
    ],
    ['cable pushdown (with rope attachment)', 'Extensión de tríceps en polea (con cuerda)'],
    ['dumbbell pullover on exercise ball', 'Pullover con mancuernas en fitball'],
    ['sit-up v. 2', 'Abdominal v. 2'],
  ])('%s → %s', (name, expected) => {
    expect(es(name)).toBe(expected)
  })

  it('las correcciones manuales tienen prioridad', () => {
    const withOverride = createTranslator(terms as Terms, {
      'barbell curl': 'Curl con barra recta',
    })
    expect(withOverride('barbell curl').es).toBe('Curl con barra recta')
  })

  it('informa de las palabras que no conoce', () => {
    expect(t('barbell frankenstein squat').unknown).toEqual(['frankenstein'])
  })

  it('concuerda adjetivos en género y número', () => {
    expect(inflect('inclinado', 'f')).toBe('inclinada')
    expect(inflect('inverso', 'f', true)).toBe('inversas')
    expect(inflect('lateral', 'm', true)).toBe('laterales')
    expect(inflect('con giro', 'f')).toBe('con giro')
  })
})
