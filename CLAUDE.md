# CLAUDE.md — App de registro fitness (uso personal)

## Qué es
App web personal para planificar entrenos en un calendario y registrar series (peso × reps) con una valoración de sensaciones, para decidir el peso de cada día comparando con la última vez. Un único usuario (el propietario). Se usa en **PC** (planificar rutinas y calendario) y en **móvil** instalada como PWA (registrar en el gimnasio, a menudo sin cobertura).

Fuente de verdad del producto: `docs/PLANNING.md`. Instrucciones por fase: `docs/phases/`.

## Idioma
- Interfaz, textos y mensajes de commit: **español de España**.
- Código, nombres de variables, tablas y comentarios técnicos: inglés.

## Stack (no cambiar sin preguntar)
- Vite + React 19 + TypeScript (strict)
- TanStack Router
- Dexie.js (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`) — la UI SIEMPRE lee de Dexie, nunca directamente de Supabase
- Supabase (Postgres + auth por enlace mágico) para sincronizar PC ↔ móvil
- Zustand para estado de UI efímero (sesión en curso, temporizador)
- CSS Modules + custom properties (tokens en `src/styles/tokens.css`); container queries para layouts
- GSAP 3 + `@gsap/react` (`useGSAP`), plugins Flip y ScrollTrigger
- Recharts para gráficas
- date-fns con locale `es`, semana empieza en lunes
- vite-plugin-pwa
- dnd-kit para arrastrar y soltar
- Vitest + Testing Library; Playwright para e2e
- Gestor de paquetes: npm

## Estructura de carpetas
```
src/
  app/            # router, layout raíz, providers
  routes/         # una carpeta por pantalla: hoy, calendario, sesion, biblioteca, ejercicio, rutinas, cuerpo, ajustes
  components/     # componentes compartidos (ui/ = primitivas)
  db/             # esquema Dexie, tipos, repositorios, queries derivadas
  sync/           # cliente Supabase y motor de sincronización
  lib/            # utilidades puras (fechas, 1RM, récords) — con tests
  motion/         # tokens y helpers de animación (GSAP + CSS)
  styles/         # tokens.css, global.css
scripts/          # import-exercises.ts y otros
public/exercises/ # images/ y gifs/ del dataset (© Gym visual): NO versionado, lo descarga `npm run fetch:media`
vendor/exercises-dataset/  # clon del repo del dataset (en .gitignore)
```

## Modelo de datos (Dexie y Supabase con las mismas tablas de usuario)
- `exercises` (solo local, catálogo del dataset + propios con `isCustom`): id, name, nameEs, bodyPart, equipment, target, secondaryMuscles[], stepsEs[], image, gif, isCustom
- `exerciseSettings`: exerciseId, logType ('weight_reps'|'reps'|'time'), repMin, repMax, favorite, note
- `routines`: id, name, items[] {exerciseId, sets, repMin, repMax, restSec, order, technique?, groupId?, …} — `technique` ∈ 'normal' | 'aleman' | 'descendente' | 'ascendente' | 'superserie' y `groupId` agrupa los ejercicios de una superserie (detalle en F2; ver `docs/PLANNING.md` § Técnicas de series)
- `routineTemplates` (solo local, como el catálogo): rutinas predefinidas; «Copiar a mis rutinas» crea una `routine` normal
- `plannedWorkouts`: id, date (YYYY-MM-DD), routineId, status ('planned'|'done'|'skipped'), sessionId?
- `sessions`: id, date, routineId?, startedAt, endedAt?, notes
- `setLogs`: id, sessionId, exerciseId, order, weight, reps, durationSec?, feel?, isWarmup, completedAt, note?
- `bodyMetrics`: id, date, bodyweight?, waist?, chest?, arm?, thigh?, notes?
- Los ejercicios propios (`isCustom`) se sincronizan en la tabla remota `custom_exercises` (ver `supabase/schema.sql`); el catálogo del dataset nunca se sube.
- En Supabase las columnas van en snake_case y cada tabla tiene además `user_id` y `server_updated_at` (lo pone el servidor; se usa para el pull incremental).

Reglas:
- Todos los ids son UUID v4 generados en el cliente (`crypto.randomUUID()`).
- Toda tabla de usuario lleva `updatedAt` (ISO) y `deletedAt` (ISO | null). Nunca borrar físicamente: soft delete.
- Récords, 1RM estimado y "última vez" se CALCULAN desde `setLogs`; nunca se guardan.
- `feel` ∈ `'demasiado' | 'justo' | 'bien' | 'puedo_mas' | 'poco'` (etiquetas: Demasiado, Voy justo, Bien, Puedo más, Poco).
- Unidades: kg. Pesos con un decimal como máximo.

## Reglas de producto que NO se rompen
- **La app nunca sugiere ni calcula el peso de hoy.** Muestra la última sesión (peso, reps, valoración) y la anterior; precarga los valores de la última vez; el usuario decide.
- Registrar una serie = un toque. La valoración es opcional y aparece tras marcar la serie; tocarla arranca el descanso.
- La sesión en curso se guarda en cada cambio (nunca perder datos si se cierra la app o no hay red).
- Todo funciona sin conexión; la sync es en segundo plano y silenciosa salvo error.

## Diseño y motion
Skills instaladas en el proyecto (usar cuando aplique, ver `docs/PLANNING.md` § Diseño; no se versionan, si faltan: `bash scripts/install-skills.sh`):
- **impeccable** — lenguaje visual; `PRODUCT.md` y `DESIGN.md` en la raíz los genera `/impeccable init`. Respetarlos siempre.
- **transitions-dev** — micro-interacciones CSS y tokens de motion.
- **gsap-skills** — GSAP: Flip, ScrollTrigger, `useGSAP` con scope y limpieza.
- **make-interfaces-feel-better** — pasada de detalle al terminar cada pantalla.

Reglas:
- CSS (transitions.dev) para cambios de estado de UN elemento; GSAP solo para coordinar varios elementos, Flip o scroll.
- Un único conjunto de tokens de duración/easing en `src/styles/tokens.css`, leído por CSS y por GSAP.
- Interacciones de la sesión en curso < 300 ms. Todo respeta `prefers-reduced-motion`.
- Áreas táctiles ≥ 44×44 px. Números con `font-variant-numeric: tabular-nums`.
- Modo oscuro primero (gimnasio), modo claro también soportado.
- Móvil: navegación inferior. PC (≥ 1024 px): barra lateral y layouts de 2–3 columnas.

## Comandos
- `npm run dev` · `npm run build` · `npm run test` · `npm run test:e2e` · `npm run lint` · `npm run typecheck`
- `npm run import:exercises` — regenera el catálogo desde `vendor/exercises-dataset`

## Forma de trabajar
- Trabaja SOLO en la fase indicada; no adelantes funcionalidades de fases posteriores.
- Antes de escribir código de una fase, muestra un plan breve de los pasos y espera confirmación si hay decisiones abiertas.
- Al terminar cada paso: `npm run typecheck && npm run test` deben pasar.
- Commits pequeños en español con prefijo de fase: `F2: editor de rutinas con arrastrar y soltar`.
- Atribución obligatoria en la ficha de ejercicio: "© Gym visual — gymvisual.com".
