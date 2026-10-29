import type { Announcements, ScreenReaderInstructions } from '@dnd-kit/core'

type Id = string | number

/** Spanish screen-reader messages for dnd-kit; `nameOf` turns a draggable/droppable id into words. */
export function dndAccessibility(nameOf: (id: Id) => string): {
  announcements: Announcements
  screenReaderInstructions: ScreenReaderInstructions
} {
  return {
    screenReaderInstructions: {
      draggable:
        'Para mover este elemento pulsa espacio o intro. Usa las flechas para llevarlo a otro sitio y pulsa espacio o intro para soltarlo, o escape para cancelar.',
    },
    announcements: {
      onDragStart: ({ active }) => `Has cogido ${nameOf(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `${nameOf(active.id)} está sobre ${nameOf(over.id)}.`
          : `${nameOf(active.id)} no está sobre ningún destino.`,
      onDragEnd: ({ active, over }) =>
        over
          ? `${nameOf(active.id)} soltado en ${nameOf(over.id)}.`
          : `${nameOf(active.id)} soltado.`,
      onDragCancel: ({ active }) => `Cancelado. ${nameOf(active.id)} vuelve a su sitio.`,
    },
  }
}
