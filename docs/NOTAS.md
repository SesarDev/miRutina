# Notas del proyecto

## Estado

- **F0 · Base y diseño:** cerrada el 29 oct 2026 (etiqueta `f0-done`).
  - Vite + React 19 + TS strict, alias `@/`, ESLint + Prettier, Vitest + Testing Library.
  - Skills instaladas en `.claude/skills/`: impeccable, transitions-dev, make-interfaces-feel-better y las 8 de GSAP.
  - `PRODUCT.md` y `DESIGN.md` (dirección «Dorsal») en la raíz.
  - Tokens en `src/styles/tokens.css` (oscuro por defecto, claro por sistema o forzado), motion en `src/motion/tokens.ts`.
  - Shell con TanStack Router, barra inferior / barra lateral, primitivas en `src/components/ui/` y `/dev/ui`.

- **F1 · Datos, sincronización y biblioteca:** cerrada el 29 oct 2026 (etiqueta `f1-done`). Catálogo de 1.324 ejercicios con nombres en español, Dexie con outbox, sincronización con Supabase y Biblioteca. **Pendiente de verificar a mano** (el usuario lo prueba después): favorito PC → móvil en < 1 min y favorito en modo avión que se sincroniza al volver la red.

- **F2 · Rutinas y calendario:** cerrada el 29 oct 2026 (etiqueta `f2-done`). Editor de rutinas con técnicas y superseries, 12 predefinidas, calendario semana/mes y pantalla Hoy. Criterios 1, 2 y 5 verificados con Playwright en la app real (PC 1440 px y móvil 390 px); criterios 3 y 4 (PC → móvil) verificados a mano por el usuario.

- **F3 · Sesión en curso:** pasos 1–6 hechos (31 oct 2026); falta la verificación a mano en el gimnasio y entre dispositivos, y `/cerrar-fase F3`. **Antes de probar la sincronización hay que ejecutar `supabase/migrations/2026-10-29-f3-sesion.sql` en Supabase** (columnas nuevas; sin ellas la subida de sesiones y series falla).

## Decisiones técnicas

- **TypeScript 6.0 en vez de 7.** La plantilla de Vite trae TS 7 (el compilador en Go), pero `typescript-eslint` aún no lo admite (`peer typescript <6.1`). Volver a TS 7 cuando lo soporte.
- **Skills instaladas con `npx skills add … -a claude-code -y --copy`** en lugar de `scripts/install-skills.ps1`, porque los instaladores interactivos se quedan esperando en un terminal no interactivo. Mismo origen y mismas skills.
- **Duraciones de motion alineadas con transitions.dev:** `--dur-instant` 100 ms, `--dur-fast` 150 ms, `--dur-base` 250 ms, `--dur-slow` 400 ms (la fase proponía 160/240; se alinean con la escala de transitions.dev, como pide la propia fase). `tokens.css` define también los alias de transitions.dev (`--duration-quick`, `--ease-smooth-out`…) para que sus fragmentos funcionen sin cambios.
- **Easing en GSAP:** `src/motion/tokens.ts` lee los `cubic-bezier()` de las variables CSS y los registra con `CustomEase`, así CSS y GSAP comparten curva. Con «reducir movimiento», `duration()` devuelve 0 (salvo `instant`).
- **Tema:** sin atributo, `tokens.css` sigue a `prefers-color-scheme` con oscuro por defecto; `data-theme="dark|light"` lo fuerza (en `<html>` o en cualquier subárbol, que es lo que usa `/dev/ui`). La preferencia se guarda en `localStorage` (`mirutina:theme`) y un script en `index.html` la aplica antes del primer pintado. El bloque del tema claro está duplicado (preferencia del sistema y forzado); `tokens.test.ts` comprueba que coinciden y que todos los pares de color cumplen AA (AAA en cifras).
- **Fuentes autoalojadas** con `@fontsource/barlow` y `@fontsource/barlow-condensed` (solo subconjunto latino) para que funcionen sin conexión.
- **Iconos propios** (`src/components/ui/Icon.tsx`, SVG de 24 px, trazo 1,75) en vez de añadir una librería al stack.
- **Rutas declaradas en código** (`src/app/router.tsx`, sin el plugin de rutas por archivo) para mantener el tipado de `<Link to>` sin generar archivos.
- **`Feel`** está en `src/lib/feel.ts` de forma provisional; en F1 pasará a los tipos de `src/db/`.
- **Playwright** instalado (con Chromium) para capturas de verificación; los tests e2e llegan en fases posteriores.
- **Accesibilidad del shell (auditoría de cierre):** enlace «Saltar al contenido» como primer foco; las etiquetas de la barra inferior se truncan con puntos suspensivos con texto ampliado al 200 % en lugar de solaparse (WCAG 1.4.4); colores sueltos convertidos en tokens (`--color-scrim`, `--color-on-media`).
- Vitest procesa CSS (`test.css.include`) para que `?raw` funcione en `tokens.test.ts`.

### F1
- **Media de Gym visual en el repo** (`public/exercises/`, 138 MB): al principio se dejó fuera de git por la licencia; el 29 oct 2026, con el repo ya **privado**, se sube para poder desplegar en Vercel, como prevé F6. No volver a hacer público el repo con la media dentro. `npm run import:exercises` la sigue regenerando desde `vendor/`.
- **Traducción de nombres**: `scripts/lib/translate-name.ts` reordena al español (movimiento + adjetivos concordados + posición + lateralidad + equipo + «, matices»). Diccionario en `scripts/exercise-terms.es.json`; 99 correcciones manuales en `scripts/exercise-names-overrides.es.json`. El import informa de palabras sin traducir y de nombres sin movimiento reconocido.
- **Seed versionado**: `src/db/seed/exercises.json` = `{ version, exercises }` (hash del contenido); se recarga solo si cambia y se importa de forma diferida (chunk aparte, ~140 kB gzip).
- **Outbox con una entrada por fila**: el push sube el estado actual de la fila; varias ediciones seguidas = una subida. Al hacer pull, si el remoto es más nuevo, se descarta la entrada pendiente local (perdió el LWW).
- **`lastPulledAt` por tabla** en `meta`. Ojo: `gt(server_updated_at)` podría saltarse filas con el mismo instante exacto en el borde de una página de 1.000; improbable con precisión de microsegundos.
- **Auth con flujo `implicit`** (no PKCE) para que el enlace mágico funcione aunque el correo se abra en otra pestaña del mismo navegador.
- **Variables de entorno**: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la clave nueva `sb_publishable_…` vale igual). Sin ellas la app funciona solo en local.
- **Búsqueda en memoria** sobre los 1.324 ejercicios leídos de Dexie (índice con nombre ES/EN + músculo y equipo en ES/EN, prefijos, sin tildes); ~1 ms por consulta. El índice multi-entrada `searchTokens` de Dexie queda disponible para consultas futuras.
- **Estado de la Biblioteca en la URL** (`?q=&parte=&equipo=&fav=&sel=`). La fila seleccionada en PC es el enlace activo del router (`data-status="active"`), con el brazalete.
- `Feel` y sus etiquetas viven ya en `src/db/types.ts`.
- Sin toasts: el error persistente de sincronización (3 fallos seguidos) se muestra en el indicador (icono rojo) y en Ajustes.

### F2
- **`RoutineItem`** gana `id` (estable, para arrastrar y para superseries), `technique`, `groupId`, `drops` y `repsPerSet`. Es JSON en Supabase: no cambia el esquema remoto.
- **Superseries**: ejercicios contiguos con el mismo `groupId`; rondas y descanso se comparten en todo el grupo (`updateGroup`) y el descanso es el de tras cada ronda. Si un arrastre rompe la contigüidad o deja un grupo de uno, ese ejercicio vuelve a series normales (`fixGroups`).
- **Valores por defecto acordados**: normales 3 × 8–12 / 120 s; alemanas 10 × 10 / 90 s; descendentes 3 series con 2 bajadas / 120 s; ascendentes 12·10·8·6 / 120 s; superserie 3 rondas / 90 s. En `src/lib/routines.ts`.
- **Duración estimada**: 5 min de calentamiento + 45 s por serie (+25 s por bajada) + descansos + 1 min de cambio entre ejercicios, redondeado a 5 min. Es orientativa.
- **Rutinas predefinidas**: 12, en `src/db/seed/routineTemplates.ts` (contenido original), con ids de ejercicios del catálogo validados por test. Tabla local `routineTemplates` (Dexie v2) recargada al cambiar `TEMPLATES_VERSION`. «Copiar a mis rutinas» crea una rutina normal con ids nuevos.
- **Editor de rutinas**: copia local de los ejercicios + guardado inmediato en cada cambio (nombre con 400 ms de pausa). Si llega un cambio de otro dispositivo (otro `updatedAt`), reemplaza la copia local.
- **Calendario**: vista y fecha en la URL (`?vista=semana|mes&fecha=YYYY-MM-DD`); semana por defecto en móvil y mes en PC. «Repetir cada semana» crea una fila por semana (máx. 12); no se guardan reglas de recurrencia. Hoy lleva el brazalete. Estados con icono + texto (en la vista mes el estado va en el icono y en el nombre accesible).
- **Arrastrar y soltar** (dnd-kit) con sensores de puntero (umbral 6 px) y teclado, y anuncios para lector de pantalla en español (`src/lib/dndA11y.ts`).
- **Empezar** crea la `session` y la enlaza con el `plannedWorkout` (`sessionId`); pulsar dos veces no duplica. `/sesion/$id` es un marcador hasta F3. Hoy muestra «Continuar entreno» si hay una sesión sin terminar.
- **IDs con `uuid()`** (`src/lib/uuid.ts`), no `crypto.randomUUID()` directo: en el móvil, abriendo el servidor de desarrollo por `http://192.168.x.x`, el contexto no es seguro y `randomUUID` no existe (la app no arrancaba). El respaldo usa `getRandomValues`.
- **Toast** propio (`showToast`) para «Deshacer» (5 s); uno a la vez.
- **Cierre (auditoría):** en la vista semana de PC la línea de estado de la píldora ocupa todo el ancho bajo icono + nombre (en columnas estrechas se cortaba). Los días de otros meses en la vista mes usan `--color-text-3` con peso normal (antes `--color-text-disabled`, 2,8:1). El toast «Añadido» lee el nombre de Dexie (el ejercicio aún no estaba en el mapa de la rutina y salía «ejercicio»).
- **Falsos positivos del detector de impeccable** que se dejan: `side-tab` en la celda de hoy (es el brazalete de `DESIGN.md`) y `monotonous-spacing` (cuenta los huecos de 4 px de las celdas del mes). `--ease-spring` no lo usa ningún componente.

### F3
- **Filas de la sesión = `setLogs` desde el principio** (sin `completedAt` hasta marcarlas): cada tecla se guarda en Dexie y nada se pierde al cerrar la app. «Última vez» ignora las filas sin `completedAt` (no están en el índice `[exerciseId+completedAt]`). Al terminar, las no marcadas se borran (soft delete).
- **Columnas nuevas** (migración `supabase/migrations/2026-10-29-f3-sesion.sql`, ya en `schema.sql`): `set_logs.drop_index` (0 = la serie, 1… = bajadas), `sessions.items` (jsonb: copia de la rutina editable en la sesión, con `skipped` y `note` por ejercicio) y `exercise_settings.weight_step`.
- **`order` de un `setLog`** = posición de la serie dentro de su ejercicio en la sesión (los calentamientos cuentan); «la misma serie» de la última vez se busca por posición entre las series de trabajo. Quitar una serie renumera.
- **Un ejercicio por sesión una sola vez** (las filas se agrupan por `exerciseId`); añadir uno que ya está no hace nada.
- **Orden de ejecución** (`sequence` en `src/lib/session.ts`): superseries por rondas alternando, bajadas detrás de su serie, saltados fuera. Tras marcar, el brazalete va a la siguiente pendiente *después* de esa (la pareja en una superserie), no a la primera pendiente de la sesión.
- **Descanso**: ninguno entre bajadas ni entre ejercicios de una ronda de superserie; tras la ronda, el de su último ejercicio. Calentamientos: 60 s fijos y sin valoración. Basado en la marca de fin (`endsAt`), persistido en `localStorage` (`mirutina:session-ui`); al reabrir pasados más de 5 s del final se descarta sin vibrar.
- **Valoración**: espera 5 s (acordado; la fase decía 3) o hasta tocar un stepper. Los botones dicen qué serie valoran.
- **«Serie hecha»** exige reps e ignora un segundo toque durante 600 ms (un toque de valoración o de stepper lo desbloquea).
- **Copiar a las pendientes** (acordado): cambiar peso o reps de una serie copia ese valor a las series pendientes posteriores del ejercicio (mismo nivel de bajada, sin calentamientos). Es la decisión del usuario, no una sugerencia.
- **Paso de los botones de peso** por equipo (barra y multipower 2,5 · mancuernas y kettlebell 2 · máquina, polea y trineo 5 · resto 1), editable por ejercicio en la ficha y en «Más opciones» de la sesión (`exerciseSettings.weightStep`, null = «Auto»). Opciones 0,5 / 1 / 2 / 2,5 / 5 (1,25 no cabe con un decimal).
- **Preferencias del dispositivo** (`src/lib/prefs.ts`, `localStorage` `mirutina:prefs`): descanso por defecto (para ejercicios añadidos en la sesión), vibración y pantalla encendida. No se sincronizan.
- **Pantalla dedicada**: en `/sesion/…` no hay barra inferior ni indicador de sync compacto; el panel de controles es `sticky` abajo (en PC, columna derecha). Los toasts salen bajo la cabecera para no tapar el panel. La barra de descanso aparece en las demás pantallas.
- **Terminar** guarda primero `endedAt` (la pantalla pasa al resumen sin estado intermedio), luego limpia filas y marca hecho el `plannedWorkout` del día (el enlazado o, si no, el de la misma rutina sin sesión) y lanza `syncEngine.sync()`.
- **e2e**: `npm run test:e2e` (Playwright, 390×844, levanta Vite en el puerto 4180). Vitest excluye `e2e/`.
- **Crítica de impeccable** completa con dos subagentes (28/40 antes de corregir); el informe está en `.impeccable/critique/`.

## Deuda

- El favicon sigue siendo el de Vite; los iconos de la PWA llegan en F6.
- `impeccable critique` se ejecutó en un solo contexto (sin subagentes); repetir la crítica completa al cerrar F3, cuando haya una pantalla real de sesión.
- La sección «Brazalete» de `DESIGN.md` describe un componente que de momento solo existe como muestra en `/dev/ui`.
- `global.css` reduce las animaciones con keyframes a 1 ms con «reducir movimiento»; hoy no hay ninguna. Cuando lleguen (F5), darles una alternativa propia en lugar de depender de ese recorte global.
- Auditoría de impeccable hecha sin el overlay del navegador (detector por CLI + Playwright); el overlay en vivo queda pendiente.
- 71 nombres de ejercicio poco comunes conservan alguna palabra en inglés; ampliar el diccionario o las correcciones cuando aparezcan en rutinas.
- El chunk del catálogo supera el aviso de 500 kB de Vite (se carga diferido; valorar dividirlo en F6).
- Predefinidas: solo «Copiar a mis rutinas». «Usar» (planificar o empezar tal cual sin copiar) queda pendiente: el calendario necesita una rutina propia.
- Las sesiones abiertas no se marcan como «Hecho» en el calendario hasta que F3 las termine.
- Verificación manual de la sincronización entre dispositivos (criterios 5 y 6 de F1) pendiente; si falla, se arregla al inicio de F2.
- El estado «Hecho» del calendario no se ha visto con datos reales: llega cuando F3 termine sesiones.
- No hay script `test:e2e` ni tests de Playwright versionados; la verificación de F2 se hizo con un script suelto. Crear la suite e2e cuando haya flujo de sesión (F3).

- Probar en el móvil por `http://` en la red local es un contexto inseguro. Se adelanta el despliegue en Vercel (paso 3 de F6) para tener HTTPS; el resto de F6 (PWA, cabeceras de `sw.js`, exportar) sigue pendiente.

- F3: el brazalete cambia de fila sin desplazarse; el Flip (< 250 ms) es de F5. El resumen final no compara con la última vez (récords en F4).
- F3: no hay deshacer al desmarcar una serie ni al borrar un calentamiento añadido por error (se puede quitar desde «Opciones»).
- F3: `logType` `reps` y `time` no tienen interfaz propia en la sesión: todo se registra como peso × reps (peso vacío = peso corporal).
- F3: las preferencias (descanso por defecto, vibración, pantalla encendida) son por dispositivo, no se sincronizan.

## Ideas para más adelante

- Marcar la pestaña «Más» como activa también mientras su panel está abierto (ahora solo se marca si la ruta actual es Rutinas, Cuerpo o Ajustes).
- En la sesión (F3), los chips de valoración deberían ser botones grandes de 56 px en el panel inferior, no los chips de 36 px de las listas.
- Enlace mágico + PWA instalada: el enlace se abre en el navegador, no en la PWA. Valorar en F6 el código de 6 dígitos (OTP) como alternativa.
- La pestaña Biblioteca podría seguir marcada al abrir `/ejercicio/$id`.
- Valorar `field-sizing: content` en otros campos numéricos; en navegadores sin soporte el Stepper usa un ancho fijo de 4,5 caracteres.
- Sesión: explicar cada técnica (alemanas, descendentes…) con un toque en su nombre.
- Sesión: preguntar la valoración solo en la última serie de cada ejercicio, como opción en Ajustes.
- Resumen de sesión: comparación por ejercicio con la última vez («65 × 10 · antes 60 × 10»), sin sugerencias (F4/F5).
- En PC, aprovechar el hueco bajo el panel de la sesión para las notas.
