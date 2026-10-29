import { useState } from 'react'
import { Icon, type IconName } from '@/components/ui'
import { getThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme'
import styles from './ThemeSwitcher.module.css'

const OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'system', label: 'Sistema', icon: 'system' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'light', label: 'Claro', icon: 'sun' },
]

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference)

  return (
    <div className={styles.switcher} role="radiogroup" aria-label="Tema">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={preference === option.value}
          className={styles.option}
          onClick={() => {
            setThemePreference(option.value)
            setPreference(option.value)
          }}
        >
          <Icon name={option.icon} size={18} />
          {option.label}
        </button>
      ))}
    </div>
  )
}
