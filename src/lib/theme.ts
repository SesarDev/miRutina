export type ThemePreference = 'system' | 'dark' | 'light'

export const THEME_STORAGE_KEY = 'mirutina:theme'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light'
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

/** 'system' removes data-theme so tokens.css follows prefers-color-scheme (dark by default). */
export function applyThemePreference(preference: ThemePreference, root = document.documentElement) {
  if (preference === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', preference)
  }
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
  applyThemePreference(preference)
}

export function resolvedTheme(root = document.documentElement): 'dark' | 'light' {
  const attr = root.getAttribute('data-theme')
  if (attr === 'dark' || attr === 'light') return attr
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}
