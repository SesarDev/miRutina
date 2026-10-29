# F3 · Sesión en curso → MVP usable en el gimnasio

**Objetivo:** registrar un entreno real en el móvil, con una mano y sin cobertura, viendo siempre lo que hiciste la última vez y cómo te sentiste. Es la pantalla más importante de la app.

**Prerrequisitos:** F2 cerrada (`f2-done`).

## Reglas (de `CLAUDE.md`, se repiten porque aquí es donde importan)
- **Nunca** sugerir el peso de hoy ni mostrar recomendaciones derivadas de la valoración.
- Una serie = un toque. Valoración opcional después.
- Guardar en cada cambio. Nada se pierde si se cierra la app.
- Interacciones < 300 ms; objetivos ≥ 44 px (mejor 56 px para +/− y valoración).

## Preguntar antes de empezar
- ¿Pasos de los botones +/− de peso? Propongo: 2,5 kg en barra y multipower, 2 kg en mancuernas y kettlebell, 5 kg en máquinas y polea, 1 kg el resto; mantener pulsado repite. (Son pasos de los botones, no sugerencias.)
- ¿Vibración (`navigator.vibrate`) al terminar el descanso? Propongo sí, corta.

## Pasos

1. **Consultas derivadas** (`src/db/queries.ts`) + tests
   - `lastSessionsForExercise(exerciseId, n = 2)`: las dos últimas sesiones con series de trabajo de ese ejercicio (excluye la sesión actual y calentamientos), con peso, reps y `feel` de cada serie, y la fecha.
   - `formatLastTime(...)` → «Última vez (hace 4 días): 60 kg × 10, 10, 9 · Puedo más». La valoración resumida es la de la **última serie** de esa sesión; si no tiene, la más frecuente; si ninguna, se omite.
   - Commit: `F3: consultas de última vez`.

2. **Estructura de la sesión** (`/sesion/$sessionId`) — antes, `/impeccable shape sesion-en-curso`
   - Store Zustand para UI efímera (ejercicio activo, temporizador). Datos persistentes SIEMPRE en Dexie vía repo.
   - Cabecera: nombre de la rutina, cronómetro total, botón «Terminar».
   - Lista de ejercicios (de la rutina o añadidos libremente) como tarjetas; la activa expandida, las demás compactas con progreso (2/3 series).
   - Añadir ejercicio no planificado, saltar ejercicio, reordenar.
   - Nota libre por ejercicio y por sesión.

3. **Registro de series** (corazón de la fase)
   - En la tarjeta activa, arriba: la línea «Última vez…» destacada y la anterior en gris pequeño. Si no hay historial: «Primera vez con este ejercicio».
   - Filas de serie precargadas: tantas como la rutina indique; peso y reps = los de la misma serie de la última sesión (si no existe, la última serie disponible; si no hay historial, vacío).
   - Cada fila: peso (stepper +/− grande y toque para teclado numérico `inputmode="decimal"`), reps (stepper), botón grande ✓ «Hecha».
   - Al marcar hecha: se guarda `setLog` con `completedAt`; aparecen debajo los 5 botones de valoración (Demasiado, Voy justo, Bien, Puedo más, Poco) con texto + color; tocar uno guarda `feel`, se cierran los botones y **arranca el descanso**. Si no se toca ninguno, el descanso arranca igualmente a los 3 s o al empezar a editar la siguiente serie.
   - Desmarcar una serie hecha y editarla después es posible.
   - Añadir serie extra / quitar serie. Marcar serie como calentamiento (no cuenta para «última vez» ni récords).
   - Commit: `F3: registro de series con valoración`.

4. **Temporizador de descanso**
   - Anillo SVG + cifras grandes tabulares; ±15 s; «Saltar».
   - Basado en marca de tiempo de fin (no en contar ticks) para que sea correcto si la pantalla se apaga o se cambia de app.
   - Al terminar: vibración corta (si se aceptó) y aviso visual. Barra compacta persistente si se navega a otra pantalla.
   - Duración: la del ejercicio en la rutina o la de Ajustes.
   - Commit: `F3: temporizador de descanso`.

5. **Robustez**
   - Recuperar la sesión abierta al reabrir la app (si hay una `session` sin `endedAt`, Hoy muestra «Continuar entreno»).
   - `navigator.storage.persist()` al empezar la primera sesión.
   - Wake Lock (`navigator.wakeLock`) durante la sesión para que la pantalla no se apague, con opción en Ajustes.
   - Test e2e (Playwright, viewport 390×844): empezar rutina, registrar 3 series con valoración, recargar la página a mitad, continuar y terminar.

6. **Terminar sesión**
   - Resumen: duración, ejercicios, series, volumen total. El `plannedWorkout` del día pasa a «hecho» y se vincula a la sesión.
   - Sesión libre sin planificación también funciona.
   - Se lanza sync al terminar.
   - (Récords y «delight» llegan en F4/F5.)
   - `/make-interfaces-feel-better full sesion-en-curso` y `/impeccable critique sesion-en-curso`.
   - Commit: `F3: cierre de sesión y robustez`.

## Criterios de aceptación
- [ ] En el gimnasio, en modo avión, registro una sesión completa de 5–6 ejercicios y ~20 series.
- [ ] Cada ejercicio muestra la última vez con peso, reps y valoración; los campos vienen precargados.
- [ ] Marcar una serie es un solo toque; la valoración es opcional y arranca el descanso.
- [ ] Cierro la app a mitad de sesión, la reabro, y no falta nada.
- [ ] El descanso es correcto aunque bloquee el móvil un minuto.
- [ ] Al recuperar cobertura, la sesión aparece en el PC.
- [ ] En ningún sitio la app propone un peso.
- [ ] El test e2e pasa.

**→ Tras cerrar esta fase, la app ya es usable a diario.**
