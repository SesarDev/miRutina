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

- **F3 · Sesión en curso:** cerrada el 31 oct 2026 (etiqueta `f3-done`). Sesión en curso con «Última vez», registro de series con valoración, técnicas y superseries, descanso, robustez (Wake Lock, almacenamiento persistente, recarga sin pérdidas) y resumen; e2e en verde. Migración `supabase/migrations/2026-10-29-f3-sesion.sql` aplicada. **Pendiente de verificar a mano** (el usuario lo prueba después): sesión completa en modo avión en el gimnasio, descanso con el móvil bloqueado y que la sesión terminada en el móvil aparezca como «Hecho» en el PC (la primera prueba falló; ver Decisiones › F3 › sesiones de otro día).

- **F4 · Historial, progreso y cuerpo:** cerrada el 31 oct 2026 (etiqueta `f4-done`). Cálculos de 1RM y récords con tests, pestañas Historial y Gráfica en la ficha, pantalla Progreso (90 días, constancia de 12 semanas, récords de 30 días), récords en el resumen de sesión y Cuerpo (peso y medidas con media de 7 días). Criterios 1, 2, 3 y 5 verificados (tests, e2e y capturas en 390 y 1440 px, oscuro y claro). **Pendiente de verificar a mano** (el usuario lo prueba después): registrar peso y medidas en el PC y verlos en el móvil.

- **F5 · Motion y pulido:** cerrada el 31 oct 2026 (etiqueta `f5-done`). Micro-interacciones CSS con tokens (check de serie, valoración escalonada, cifra del stepper, pulso del descanso, píldora deslizante, toast, icon swap, shake, skeleton, acordeón), Flip (semana ↔ mes, miniatura → ficha, brazalete y reordenar en la sesión), ScrollTrigger con moderación (historial, Progreso, líneas de las gráficas), momento de récord y Hoy reorganizado. Criterios 2–6 verificados (Playwright: medición de animaciones, «reducir movimiento» emulado, 0 ScrollTriggers/tweens tras navegar, detector de impeccable limpio, `refine` sin valores sueltos). **Pendiente de verificar a mano** (el usuario lo prueba después): que marcar y valorar se sienta instantáneo en el móvil real y los 60 fps con DevTools remoto (medido solo con la CPU emulada 4× en Chromium).

## F5 · Auditoría de partida (31 oct 2026)

### transitions.dev (elegido con el usuario)
Lo que pide la fase:
1. «Serie hecha» (`ControlPanel.tsx`) → **success check** + escala 0,96 al pulsar.
2. Botones de valoración → entrada escalonada (texts reveal adaptado, 35 ms).
3. Cifra de los steppers → **number pop-in** (desplazamiento vertical sutil).
4. Anillo de descanso → ya en CSS; añadir pulso en los últimos 3 s.
5. Sheets → la salida, más rápida que la entrada.

Extras elegidos: **tabs sliding** (Segmented, semana/mes, pestañas de Rutinas), **toast** con salida, **icon swap** (favorito e indicador de sync), **error shake** (formulario de Cuerpo), **skeleton reveal** (Biblioteca) y **accordion** («Ver los datos»).

`transitions refine`: el anillo usa `250ms linear` suelto → `var(--dur-base) var(--ease-linear)`; el pulso de la Biblioteca (`1s ease-in-out`) desaparece con el skeleton. Se quedan como están el giro del indicador de sync (`1.2s linear`, ningún token tiene ese uso) y la cuenta atrás de 5 s de la valoración (ligada a `FEEL_TIMEOUT_MS`).

### impeccable critique (dos evaluaciones independientes; heurísticas 30/40)
Detector: 1 aviso en la CLI (radio de 1 px en la barra de la valoración) y en el navegador, sobre 7 rutas: «kicker» encima del título en Hoy (verdadero positivo), paleta crema del tema claro y franja lateral del calendario (falsos positivos aceptados: son de `DESIGN.md`), `--ease-spring` sin usar y espaciado monótono (aviso). Sin desbordamiento horizontal ni errores de consola.

Prioridades:
1. **[P1] Hoy entierra «Empezar»** bajo la cuadrícula de 4 tarjetas de secciones (antirreferencia de `PRODUCT.md`); en 390 px el botón queda fuera de pantalla. → paso 6 (decidir con el usuario).
2. **[P1] El stepper de peso se corta en la sesión de PC** («77,» en vez de 77,5): `SessionStepper` no tiene la container query del `Stepper`. → paso 2 (cifra del stepper).
3. **[P1] El brazalete salta sin movimiento** al marcar una serie y la tarjeta del ejercicio cambia de golpe; la valoración aparece y empuja los steppers ~70 px. → pasos 2 y 3 (Flip).
4. **[P2] El resumen de sesión es un final plano**: «0 min» en sesiones cortas, sin cifra protagonista. → paso 5.
5. **[P2] La regla del bloque invertido único se diluye**: el Segmented activo, los chips seleccionados y las celdas de constancia usan relleno vinilo como el brazalete. → paso 2 (con la píldora deslizante).

Menores: comentario «3 s» en `ControlPanel.tsx:52` (son 5 s); «0 de 0 días entrenados» en Hoy; nombres largos cortados en la tarjeta recogida de la sesión; récords repetidos del mismo ejercicio en Progreso; números de la constancia sin rótulo; etiqueta «Bien» en todos los puntos de la gráfica; en Cuerpo «Peso» y «Media 7 días» con el mismo peso visual; Ajustes y Rutinas sin 2 columnas en PC; el anillo de descanso lleno al empezar parece «terminado»; el lector de pantalla no sabe que el descanso empieza solo; texto de «Anterior» a ~11 px.

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
- **Sesiones abiertas de otro día** (fallo visto al cerrar F3: el entreno hecho en el móvil no salía «Hecho» en el PC): «Empezar» solo retoma la sesión enlazada si es de hoy, y al abrir la app (`closeStaleSessions` en `main.tsx`) las sesiones abiertas de días anteriores se terminan en su día si tienen series o se borran y desenlazan si están vacías. La causa probable era la sesión de prueba de F2 (29 oct) que seguía abierta: al terminarla se marcaba el entreno de su día, no el de hoy. No se ha podido ver el dato real del móvil.
- **e2e**: `npm run test:e2e` (Playwright, 390×844, levanta Vite en el puerto 4180). Vitest excluye `e2e/`.
- **Crítica de impeccable** completa con dos subagentes (28/40 antes de corregir); el informe está en `.impeccable/critique/`.

### F4
- **Récords** (`src/lib/progress.ts`, calculados, nunca guardados): solo series de trabajo marcadas; los calentamientos no cuentan para nada. La primera sesión de un ejercicio no da récords (no hay con qué comparar) e igualar no es récord. «Más reps» compara con el **mismo peso exacto** (un peso nuevo no es récord de reps; eso ya lo cubre «más peso»); con peso corporal, contra peso corporal. Las **bajadas** suman volumen pero no definen peso, reps ni 1RM. Sesiones del mismo día se ordenan por `startedAt`.
- **1RM (Epley)** con un decimal; `null` con más de 12 reps, sin peso o en calentamientos.
- **Gráfica**: el color y la etiqueta de cada punto son la valoración de la última serie (si no tiene, la más repetida, como en «Última vez»). Las etiquetas de texto junto al punto salen con 5 puntos o menos; con más, leyenda + tooltip. Alternativa textual: `aria-label` con el resumen y tabla «Ver los datos». Sin animación de dibujo (F5).
- **Pestañas de la ficha** (`Segmented`, nueva primitiva para pestañas y radios con flechas): en `/ejercicio/$id` van en la URL (`?tab=historial|grafica`); en el panel de la Biblioteca, estado local. Los récords personales van encima de las pestañas.
- **Progreso**: ejercicios con series en los últimos 90 días; la minigráfica es el peso máximo por sesión (reps máximas si es de peso corporal), SVG propio sin Recharts. Los récords de 30 días se calculan contra todo el historial.
- **Cuerpo**: un registro por fecha. «Registrar» abre el de hoy si existe y elegir una fecha con registro pasa a editarlo. Rangos: peso 20–300 kg, cintura y pecho 30–250, brazo 10–100, muslo 20–150 cm. La media móvil de 7 días usa los días previos al rango antes de recortarlo. Borrar = soft delete con «Deshacer».
- **Recharts 3** (`recharts@3.10`) con colores por CSS (clases sobre `.recharts-*`), `accessibilityLayer` desactivado porque la tabla es la alternativa accesible.

### F5
- **Selección en granate**: la píldora del `Segmented` (que se desliza, «tabs sliding»), los chips neutros seleccionados, el selector de tema y el paso de peso usan `--color-band`, como el elemento activo de la navegación. El relleno vinilo queda solo para el brazalete (P2 de la crítica). Las celdas de constancia entrenadas pasan a `--color-text-2`.
- **Animaciones compartidas** en `global.css` con clases `t-*` adaptadas a los tokens: `t-num-pop` (cifra de los steppers, `useNumberPop`), `t-success-check` (check de la serie marcada hace < 2 s), `t-icon-swap`/`t-icon-enter` (favorito, indicador de sync) y `t-shake` (`motion/shake.ts`, formulario de Cuerpo). Todas con alternativa propia para «reducir movimiento».
- **Fuera el recorte global** de animaciones a 1 ms con «reducir movimiento» (deuda de F0): cada animación declara su alternativa, y los tokens de distancia y escala ya bajan a 0.
- **Tokens nuevos**: `--dur-second` (pulso de los últimos 3 s del descanso), `--dur-spin` (giro del indicador de sync) y `--distance-small`. La cuenta atrás de la valoración lee `--feel-timeout` desde `FEEL_TIMEOUT_MS`. `transitions refine` ya no encuentra valores sueltos.
- **Toast** con salida: el último toast se queda montado mientras se funde (`--dur-fast`); «Deshacer» se desactiva durante la salida.
- **GSAP**: plugins registrados solo en `src/motion/gsap.ts` (useGSAP, Flip, ScrollTrigger); `motion/tokens.ts` añade `distance()`. Con «reducir movimiento» no se captura ningún Flip ni se crea ningún ScrollTrigger.
- **Flip** (`motion/flip.ts`): semana ↔ mes con `Flip.from` (`absolute`, `nested`; las celdas nuevas entran con un fundido). Miniatura → ficha con FLIP manual (`gsap.from` desde el rectángulo capturado): el estado de `Flip.getState` no se puede reutilizar si React monta dos veces (StrictMode), así que se guardan datos simples y se borran al terminar.
- **Brazalete** (`sesion/sessionFlip.ts`): las acciones del store que lo mueven (`selectRow`, `askFeel`) y «Subir/Bajar» capturan la disposición; `SesionPage` la anima tras el commit (250 ms). El fondo, la franja y la tinta del brazalete hacen un fundido en CSS: GSAP no sabe interpolar `oklch()` (salía rojo).
- **Reordenar en el editor de rutinas**: lo animaba ya dnd-kit (transformaciones de `useSortable`); no se añade Flip encima.
- **ScrollTrigger** (`motion/scroll.ts`): `useRevealBatch` (historial y Progreso; `ScrollTrigger.batch` una vez) y `useDrawLines` (líneas `.t-draw` de las gráficas, se dibujan la primera vez que entran). `ScrollTrigger.refresh()` cuando el contenedor cambia de tamaño. Sin pin ni scrub.
- **Momento de récord** (`sesion/RecordMoment.tsx`): el récord principal (más peso > 1RM > reps > volumen) lleva el brazalete con la cifra en tamaño dorsal; los demás van en lista. La timeline (~650 ms) y la vibración (20-60-20 ms, si está activada) solo se ven si la sesión terminó hace menos de 15 s. El resumen dice «< 1 min» en vez de «0 min».
- **Hoy**: el entreno del día y «Empezar» arriba del todo, el estado («Toca hoy» / «Hecho hoy») en la línea de datos en vez de un rótulo encima del título, y las secciones al final como lista de enlaces (decidido con el usuario). En PC, dos columnas. «0 de 0 días» pasa a «Sin entrenos planificados ni hechos».
- **Stepper de la sesión** con container query: en columnas estrechas (panel de PC) los extremos bajan a 44 px y la cifra no se corta.
- **Verificación**: «reducir movimiento» comprobado en Playwright (nada se desplaza ni escala durante la sesión ni en el calendario). Tras navegar por todas las pantallas con GSAP quedan 0 ScrollTriggers y 0 tweens activos, sin avisos. CPU 4× más lenta (Chromium emulado): mediana de 16,7 ms por fotograma; 8 de 128 por encima de 33 ms, todos en los toques (Dexie + render), no en las animaciones.

## Deuda

- El favicon sigue siendo el de Vite; los iconos de la PWA llegan en F6.
- `impeccable critique` se ejecutó en un solo contexto (sin subagentes); repetir la crítica completa al cerrar F3, cuando haya una pantalla real de sesión.
- La sección «Brazalete» de `DESIGN.md` describe un componente que de momento solo existe como muestra en `/dev/ui`.
- Auditoría de impeccable hecha sin el overlay del navegador (detector por CLI + Playwright); el overlay en vivo queda pendiente.
- 71 nombres de ejercicio poco comunes conservan alguna palabra en inglés; ampliar el diccionario o las correcciones cuando aparezcan en rutinas.
- El chunk del catálogo supera el aviso de 500 kB de Vite (se carga diferido; valorar dividirlo en F6).
- Predefinidas: solo «Copiar a mis rutinas». «Usar» (planificar o empezar tal cual sin copiar) queda pendiente: el calendario necesita una rutina propia.
- Verificación manual de la sincronización entre dispositivos (criterios 5 y 6 de F1) pendiente; si falla, se arregla al inicio de F2.
- El estado «Hecho» del calendario no se ha visto con datos reales: llega cuando F3 termine sesiones.
- No hay script `test:e2e` ni tests de Playwright versionados; la verificación de F2 se hizo con un script suelto. Crear la suite e2e cuando haya flujo de sesión (F3).

- Probar en el móvil por `http://` en la red local es un contexto inseguro. Se adelanta el despliegue en Vercel (paso 3 de F6) para tener HTTPS; el resto de F6 (PWA, cabeceras de `sw.js`, exportar) sigue pendiente.

- F3: el resumen final no compara con la última vez (solo lista los récords).
- F3: no hay deshacer al desmarcar una serie ni al borrar un calentamiento añadido por error (se puede quitar desde «Opciones»).
- F3: `logType` `reps` y `time` no tienen interfaz propia en la sesión: todo se registra como peso × reps (peso vacío = peso corporal).
- F3: si el entreno de prueba se terminó como la sesión antigua, sus series quedaron con la fecha de esa sesión (29 oct) y el entreno de hoy sigue «Planificado»; no hay forma en la app de corregir la fecha de una sesión ni de marcar un entreno como hecho a mano.
- F3: una «Sesión libre» no marca ningún entreno planificado del día como hecho (no hay rutina con la que emparejarlo).
- F3: las preferencias (descanso por defecto, vibración, pantalla encendida) son por dispositivo, no se sincronizan.
- F4: Recharts va en el chunk principal (375 kB gzip en total). Cargar las gráficas de forma diferida en F6.
- F4: la gráfica del ejercicio no tiene métrica de reps: en ejercicios de peso corporal sale vacía (el historial y las tarjetas sí muestran las reps).
- F5: el rendimiento se midió en Chromium con la CPU emulada 4× más lenta, no en un móvil real; queda probarlo en el teléfono (DevTools remoto → Performance).
- F5: no hay enlace de la rutina (editor o sesión) a la ficha del ejercicio, así que el Flip miniatura → ficha solo sale desde la Biblioteca.
- F5: la Biblioteca usa una variante ligera de «skeleton reveal» (la lista se funde al aparecer; el esqueleto no hace la mitad del fundido porque la lista es virtual).
- F5: el acordeón de «Ver los datos» anima la altura solo donde hay `::details-content` (Chromium); en Safari y Firefox se abre sin animación.
- F4: las gráficas no son navegables con teclado (`accessibilityLayer` desactivado); la alternativa es la tabla «Ver los datos» y la tabla de Cuerpo.

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
- Gráfica del ejercicio: elegir las reps máximas como métrica en ejercicios de peso corporal (ahora solo peso, 1RM y volumen, que salen vacíos).
- Progreso: filtrar la lista por grupo muscular cuando haya muchos ejercicios.
- Progreso: distinguir mejor los días futuros de la semana en la cuadrícula de constancia (ahora solo un filete tenue).
- Récords: valorar si «Más reps» debería contar también con un peso mayor (60 × 10 tras 57,5 × 10), no solo con el mismo.
- Ajustes y Rutinas en dos columnas en PC (menor de la crítica).
- Progreso: agrupar los récords de 30 días por ejercicio (ahora el mismo ejercicio puede salir varias veces).
- Sesión: dejar dos líneas al nombre del ejercicio en la tarjeta recogida (ahora se corta).
- Cuerpo: dar más peso visual al último peso que a la media de 7 días.
- El anillo de descanso lleno al empezar puede leerse como «terminado»; valorar otra forma de empezar.
- Sesión: atajos de teclado en PC (Intro para «Serie hecha», flechas para cambiar de serie).
- El punto de «planificado» en la semana de Hoy es dorado; según la regla del oro debería ser neutro.
