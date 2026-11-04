import { platesPerSide } from './plates'

describe('platesPerSide', () => {
  it('descompone el peso elegido en discos por lado', () => {
    expect(platesPerSide(100, 20)).toEqual({
      kind: 'ok',
      perSide: [25, 15],
      sideKg: 40,
      remainder: 0,
    })
    expect(platesPerSide(62.5, 20)).toEqual({
      kind: 'ok',
      perSide: [20, 1.25],
      sideKg: 21.25,
      remainder: 0,
    })
  })

  it('solo la barra', () => {
    expect(platesPerSide(20, 20)).toEqual({ kind: 'ok', perSide: [], sideKg: 0, remainder: 0 })
  })

  it('por debajo del peso de la barra', () => {
    expect(platesPerSide(15, 20)).toEqual({ kind: 'below-bar' })
  })

  it('dice lo que no se puede cubrir con los discos', () => {
    expect(platesPerSide(61, 20)).toMatchObject({ perSide: [20], remainder: 1 })
  })

  it('con otra barra', () => {
    expect(platesPerSide(40, 10)).toMatchObject({ perSide: [15], remainder: 0 })
  })
})
