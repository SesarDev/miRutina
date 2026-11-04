# F7 · Ajustes de uso

**Objetivo:** corregir lo que molesta al usar la app de verdad (cancelar un entreno equivocado, editar lo hecho, avisos del descanso) y añadir las mejoras elegidas por el usuario el 4 nov 2026.

**Prerrequisitos:** F6 implementada (puede cerrarse en paralelo cuando el usuario pruebe el despliegue).

## Reglas
- La app sigue sin sugerir pesos: la calculadora de discos solo descompone el peso que elige el usuario.
- Todo funciona sin conexión; los borrados son lógicos y se sincronizan.
- Sesión en curso: interacciones < 300 ms y áreas táctiles ≥ 44 px.

## Pasos

1. **Cancelar o cambiar el entreno en curso** — menú «⋯» en la cabecera de la sesión: «Cancelar entreno» (borra la sesión y sus series; el planificado vuelve a «Planificado»; confirma cuántas series se pierden; «Deshacer») y «Cambiar de rutina» (cancela y abre la lista de rutinas).
2. **Aviso sonoro al terminar el descanso** — pitido con Web Audio (sin archivos), desbloqueado al pulsar «Serie hecha»; opción de pitidos en los últimos 3 s; preferencias en Ajustes.
3. **Ver el ejercicio durante la sesión** — la miniatura abre una hoja con el GIF, músculos, equipo, pasos y atribución (componente común con la ficha).
4. **Sesiones del día en el calendario** — la hoja del día muestra las sesiones (resumen y récords) con «Ver / editar», «Cambiar de día» y «Borrar»; «Marcar como hecho» un planificado sin sesión. Modo edición de sesiones terminadas.
5. **Durante el entreno**
   - Siguiente ejercicio durante el descanso («Siguiente: Remo con barra · última vez 60 kg × 10»).
   - Calculadora de discos para el peso elegido (barra configurable).
   - Nota fija del ejercicio visible en la tarjeta de la sesión y editable.
   - Opción en Ajustes: valorar solo la última serie de cada ejercicio.
6. **Guardar en la rutina los cambios de la sesión** — al terminar, si los ejercicios, su orden, series o descansos cambiaron respecto a la rutina: «¿Guardar estos cambios en la rutina?».
7. **Resumen comparado con la última vez** — por ejercicio: «65 kg × 10, 10, 9 · antes 62,5 kg × 10, 9, 9» (solo dato).
8. **Rutinas** — «Usar» una predefinida sin copiarla (planificar o empezar) y enlace a la ficha del ejercicio desde el editor y la sesión.
9. **Progreso** — récords de 30 días agrupados por ejercicio; volumen semanal por grupo muscular; métrica de reps en la gráfica de ejercicios de peso corporal.
10. **Recordatorio y pendientes menores** — aviso en Hoy si a la hora elegida no has empezado el entreno del día; Ajustes y Rutinas en dos columnas en PC; dos líneas para el nombre en la tarjeta de la sesión; punto de «planificado» neutro en Hoy.

## Criterios de aceptación
- [ ] Empiezo una rutina equivocada, la cancelo y empiezo otra; el calendario muestra solo la correcta, en el PC también.
- [ ] Al acabar un descanso suena un pitido (con la app abierta) y puedo desactivarlo.
- [ ] En la sesión, tocar la imagen muestra el GIF y los pasos, también sin conexión.
- [ ] Desde el calendario veo, edito, muevo y borro sesiones pasadas; los récords se recalculan.
- [ ] Las mejoras de los pasos 5–10 funcionan en móvil y PC, con tests.
