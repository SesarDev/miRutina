# F4 · Historial, progreso y cuerpo

**Objetivo:** ver cómo evoluciona cada ejercicio (pesos, reps, valoraciones, récords) y el peso corporal y medidas.

**Prerrequisitos:** F3 cerrada (`f3-done`). Idealmente con 1–2 semanas de datos reales.

## Preguntar antes de empezar
- ¿Qué medidas corporales quieres registrar? Propuesta: peso, cintura, pecho, brazo, muslo (todas opcionales, en cm).

## Pasos

1. **Cálculos** (`src/lib/progress.ts`) + tests exhaustivos
   - `estimated1RM(weight, reps)` con Epley `w * (1 + r / 30)`; `null` si reps > 12 o es calentamiento.
   - `sessionStats(setLogs)`: mejor serie, volumen (Σ peso × reps), mejor 1RM estimado.
   - `detectRecords(exerciseId, session)`: más peso, más reps a un peso dado, mejor 1RM estimado, más volumen; comparando solo con sesiones anteriores.
   - Commit: `F4: cálculos de progreso y récords`.

2. **Historial del ejercicio** (en `/ejercicio/$exerciseId`, rellenando el hueco de F1)
   - Pestañas: «Cómo se hace» (lo de F1) | «Historial» | «Gráfica».
   - Historial: sesiones de más reciente a más antigua; por cada una, fecha, series (peso × reps) y la valoración de cada serie como chip con texto. Récords marcados.
   - Gráfica (Recharts): eje X = fechas; serie principal configurable: peso máximo, 1RM estimado o volumen. Cada punto coloreado y etiquetado con la valoración de la última serie (tooltip con el detalle). Rango: 1 mes / 3 meses / 1 año / todo.
   - Récords personales actuales en tarjetas pequeñas arriba.
   - Commit: `F4: historial y gráfica por ejercicio`.

3. **Progreso global** (`/progreso`)
   - Lista de ejercicios entrenados en los últimos 90 días, ordenada por más reciente, con una mini-gráfica (sparkline) del peso máximo y la última valoración.
   - Récords conseguidos en los últimos 30 días.
   - Calendario de constancia (días entrenados por semana, últimas 12 semanas).
   - PC: cuadrícula de 2–3 columnas. Móvil: lista.
   - Commit: `F4: pantalla de progreso`.

4. **Récords al cerrar sesión**
   - El resumen de fin de sesión (F3) muestra los récords nuevos conseguidos. (La animación «delight» se hace en F5.)

5. **Cuerpo** (`/cuerpo`)
   - Registrar peso corporal y medidas en una fecha (por defecto hoy); editar y borrar.
   - Gráfica de peso con media móvil de 7 días; gráficas de cada medida.
   - Tabla de registros.
   - Commit: `F4: peso corporal y medidas`.

6. **Pulido**
   - `/make-interfaces-feel-better full` sobre historial, progreso y cuerpo; `/impeccable audit` para accesibilidad de las gráficas (contraste, alternativa textual).

## Criterios de aceptación
- [ ] En la ficha de «Press de banca con barra» veo todas mis sesiones con pesos, reps y valoraciones.
- [ ] La gráfica muestra peso máximo, 1RM estimado o volumen, con la valoración visible en cada punto.
- [ ] Al conseguir un récord, aparece en el resumen de la sesión y en la ficha.
- [ ] Registro mi peso y medidas en el PC y lo veo en el móvil.
- [ ] Los tests de `progress.ts` cubren récords, calentamientos y series con reps > 12.
