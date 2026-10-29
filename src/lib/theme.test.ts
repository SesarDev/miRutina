import {
  applyThemePreference,
  getThemePreference,
  setThemePreference,
  THEME_STORAGE_KEY,
} from './theme'

describe('theme', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('por defecto sigue al sistema', () => {
    expect(getThemePreference()).toBe('system')
  })

  it('guarda y aplica un tema forzado', () => {
    setThemePreference('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(getThemePreference()).toBe('light')
  })

  it('volver a sistema quita el atributo y lo guardado', () => {
    setThemePreference('dark')
    setThemePreference('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('ignora valores guardados no válidos', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neón')
    expect(getThemePreference()).toBe('system')
  })

  it('applyThemePreference no toca el almacenamiento', () => {
    applyThemePreference('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })
})
