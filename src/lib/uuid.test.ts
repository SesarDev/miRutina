import { uuid, uuidFromString } from './uuid'

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('uuid', () => {
  it('genera UUID v4', () => {
    expect(uuid()).toMatch(V4)
  })

  it('funciona sin crypto.randomUUID (http en la red local)', () => {
    const original = crypto.randomUUID
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
    try {
      const ids = new Set(Array.from({ length: 100 }, uuid))
      expect(ids.size).toBe(100)
      for (const id of ids) expect(id).toMatch(V4)
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true })
    }
  })
})

describe('uuidFromString', () => {
  it('estable, con formato UUID y distinto para cada texto', () => {
    const a = uuidFromString('tpl-pecho-triceps')
    expect(a).toBe(uuidFromString('tpl-pecho-triceps'))
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(uuidFromString('tpl-espalda-biceps')).not.toBe(a)
  })
})
