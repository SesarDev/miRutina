# F2 · Rutinas y calendario

**Objetivo:** crear rutinas cómodamente en el PC, planificarlas en el calendario y ver en el móvil qué toca hoy.

**Prerrequisitos:** F1 cerrada (`f1-done`).

## Preguntar antes de empezar
- Valores por defecto al añadir un ejercicio a una rutina: propongo 3 series × 8–12 reps y 120 s de descanso. ¿Te valen?

## Pasos

1. **Editor de rutinas** (`/rutinas`) — antes, `/impeccable shape rutinas`
   - Lista de rutinas (nombre, nº de ejercicios, grupos musculares principales, última vez hecha). Crear, renombrar, duplicar, borrar (soft delete con «Deshacer» durante 5 s).
   - Editor en PC (≥ 1024 px): dos columnas. Izquierda: buscador de la biblioteca (reutilizar componentes de F1). Derecha: la rutina. Añadir arrastrando (dnd-kit) o con botón «+». Reordenar arrastrando.
   - Editor en móvil: lista de la rutina + botón «Añadir ejercicio» que abre la biblioteca en un Sheet; reordenar con asa de arrastre.
   - Cada ejercicio de la rutina: series, rango de reps (min–max), descanso en segundos. Steppers grandes.
   - Guardado automático (sin botón Guardar), vía `repo.saveRoutine`.
   - Tests: crear, reordenar, borrar y deshacer.
   - Commit: `F2: editor de rutinas con arrastrar y soltar`.

2. **Calendario** (`/calendario`) — antes, `/impeccable shape calendario`
   - Utilidades de fechas en `src/lib/dates.ts` (date-fns, locale `es`, semana desde el lunes, fechas como `YYYY-MM-DD` en hora local). Tests.
   - Vista **semana** (por defecto en móvil): 7 filas/columnas con los entrenos planificados de cada día; estados planificado / hecho / saltado con icono + texto, no solo color.
   - Vista **mes** (por defecto en PC): cuadrícula con indicadores por día; hoy resaltado.
   - Conmutador semana/mes y navegación anterior/siguiente/hoy. (La animación Flip entre vistas se hace en F5; ahora transición simple.)
   - Asignar rutina a un día: en PC arrastrando una rutina desde un panel lateral al día; en ambos, tocando el día → Sheet con la lista de rutinas.
   - Mover un entreno a otro día (arrastrar en PC, menú «Mover a…» en móvil). Marcar como saltado.
   - **Repetir semanalmente**: al asignar, opción «Repetir cada semana durante N semanas» (crea los `plannedWorkouts` correspondientes; no hay reglas de recurrencia almacenadas).
   - Commit: `F2: calendario semana/mes con planificación`.

3. **Pantalla Hoy** (`/`)
   - Entreno planificado de hoy: nombre de la rutina, ejercicios con miniatura y series×reps, botón grande «Empezar» (en F2 crea la `session` y navega a `/sesion/$id`, que de momento muestra un marcador; se implementa en F3).
   - Si hoy no hay nada: próximo entreno planificado y botón «Entrenar algo hoy» (elegir rutina o sesión libre).
   - Resumen de la semana: días entrenados / planificados.
   - Commit: `F2: pantalla Hoy`.

4. **Pulido**
   - `/make-interfaces-feel-better full` sobre rutinas y calendario.
   - `/impeccable adapt` para revisar ambos tamaños.

## Criterios de aceptación
- [ ] En el PC creo una rutina de 5 ejercicios arrastrándolos desde la biblioteca y la reordeno.
- [ ] Planifico la semana real (p. ej. lunes Torso, miércoles Pierna, viernes Torso) con repetición 4 semanas.
- [ ] En el móvil, la pantalla Hoy muestra el entreno del día en < 1 minuto tras planificarlo en el PC.
- [ ] Muevo un entreno de día y marco otro como saltado; se ve en ambos dispositivos.
- [ ] Los estados del calendario se distinguen sin depender del color.
- [ ] Tests de fechas y de rutinas pasan.
