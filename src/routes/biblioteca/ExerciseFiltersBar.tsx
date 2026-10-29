import { useState } from 'react'
import { Button, Chip, Icon } from '@/components/ui'
import { BODY_PART_LABELS, EQUIPMENT_LABELS, label } from '@/db/labels'
import { BODY_PARTS, COMMON_EQUIPMENT, type ExerciseFilters } from '@/lib/exerciseSearch'
import styles from './BibliotecaPage.module.css'

type Props = {
  filters: ExerciseFilters
  /** Equipment present in the catalogue, most used first. */
  allEquipment: string[]
  onChange: (patch: Partial<ExerciseFilters>) => void
  onClear: () => void
  active: boolean
}

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

export function ExerciseFiltersBar({ filters, allEquipment, onChange, onClear, active }: Props) {
  const rare = allEquipment.filter((e) => !COMMON_EQUIPMENT.includes(e))
  const rareSelected = filters.equipment.some((e) => rare.includes(e))
  const [moreEquipment, setMoreEquipment] = useState(rareSelected)
  const visibleEquipment =
    moreEquipment || rareSelected ? [...COMMON_EQUIPMENT, ...rare] : COMMON_EQUIPMENT

  return (
    <div className={styles.filters} role="group" aria-label="Filtros">
      <div className={styles.filterGroup}>
        <Chip
          selected={filters.favoritesOnly}
          onClick={() => onChange({ favoritesOnly: !filters.favoritesOnly })}
        >
          <Icon
            name="star"
            size={16}
            className={filters.favoritesOnly ? styles.starOn : undefined}
          />
          Favoritos
        </Chip>
        {active && (
          <Button variant="ghost" className={styles.clear} onClick={onClear}>
            Quitar filtros
          </Button>
        )}
      </div>

      <fieldset className={styles.filterGroup}>
        <legend className={styles.filterLabel}>Músculo</legend>
        <div className={styles.chips}>
          {BODY_PARTS.map((part) => (
            <Chip
              key={part}
              selected={filters.bodyParts.includes(part)}
              onClick={() => onChange({ bodyParts: toggle(filters.bodyParts, part) })}
            >
              {label(BODY_PART_LABELS, part)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend className={styles.filterLabel}>Equipo</legend>
        <div className={styles.chips}>
          {visibleEquipment.map((eq) => (
            <Chip
              key={eq}
              selected={filters.equipment.includes(eq)}
              onClick={() => onChange({ equipment: toggle(filters.equipment, eq) })}
            >
              {label(EQUIPMENT_LABELS, eq)}
            </Chip>
          ))}
          {!rareSelected && rare.length > 0 && (
            <Chip onClick={() => setMoreEquipment((v) => !v)} selected={false}>
              {moreEquipment ? 'Menos equipo' : `Más equipo (${rare.length})`}
            </Chip>
          )}
        </div>
      </fieldset>
    </div>
  )
}
