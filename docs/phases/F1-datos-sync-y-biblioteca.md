# F1 · Datos, sincronización y biblioteca

**Objetivo:** catálogo de 1.324 ejercicios importado con nombres en español, base de datos local (Dexie), sincronización con Supabase funcionando entre PC y móvil, y la Biblioteca usable.

**Prerrequisitos:** F0 cerrada (`git tag` contiene `f0-done`).

## Preguntar antes de empezar
- ¿Has creado ya el proyecto en Supabase? Si no, guíame: crear proyecto (región Europa), copiar URL y anon key a `.env.local` (ver `.env.example`), ejecutar `supabase/schema.sql` en el SQL Editor, y en Authentication → URL Configuration añadir `http://localhost:5173` y la IP local de la red (para probar en el móvil).

## Pasos

1. **Traer el dataset**
   - `git clone --depth 1 https://github.com/hasaneyldrm/exercises-dataset vendor/exercises-dataset`
   - Script `scripts/import-exercises.ts` (ejecutar con `tsx`; añadir `npm run import:exercises`):
     - Valida cada registro contra `vendor/exercises-dataset/data/exercises.schema.json` (con `ajv`). Informa de los inválidos y continúa.
     - Mapea a `Exercise`: `id`, `name`, `nameEs`, `bodyPart`, `equipment`, `target`, `secondaryMuscles`, `stepsEs` (de `instruction_steps.es`, si falta usar `instructions.es` partido en frases), `image` → `/exercises/images/<archivo>`, `gif` → `/exercises/gifs/<archivo>`.
     - `nameEs`: traducción por diccionario de términos en `scripts/exercise-terms.es.json` (barbell → barra, dumbbell → mancuerna, cable → polea, lever/leverage → máquina, smith → multipower, bench press → press de banca, squat → sentadilla, deadlift → peso muerto, curl → curl, row → remo, pull-up → dominada, push-up → flexión, lunge → zancada, raise → elevación, fly → aperturas, extension → extensión, press → press, incline → inclinado, decline → declinado, seated → sentado, standing → de pie, lying → tumbado, one arm → a una mano, alternate → alterno, reverse → inverso, close-grip → agarre cerrado, wide-grip → agarre abierto, etc.). Reordenar al estilo español (sustantivo + complemento: "barbell bench press" → "Press de banca con barra"). Generar también `scripts/exercise-names-overrides.es.json` vacío para correcciones manuales que tengan prioridad.
     - Traducciones de `bodyPart`, `equipment` y `target` a etiquetas en español en `src/db/labels.ts`.
     - Copia `images/` y `videos/` a `public/exercises/images/` y `public/exercises/gifs/`.
     - Escribe `src/db/seed/exercises.json` (sin instrucciones en otros idiomas, para que pese poco).
   - Revisar conmigo una muestra de 30 nombres traducidos de los ejercicios más comunes (press de banca, sentadilla, peso muerto, remo, dominadas, curl, press militar, elevaciones laterales, extensiones de tríceps, prensa…) y corregir el diccionario.
   - Commit: `F1: importación del dataset con nombres en español`.

2. **Base de datos local (Dexie)**
   - `src/db/types.ts`: tipos de todas las tablas de `CLAUDE.md`; `Feel` y sus etiquetas.
   - `src/db/schema.ts`: `class AppDB extends Dexie` con índices:
     - `exercises: 'id, bodyPart, equipment, target, *searchTokens'` (`searchTokens` = palabras normalizadas sin tildes de `name` + `nameEs`)
     - `exerciseSettings: 'exerciseId, favorite, updatedAt'`
     - `routines: 'id, updatedAt'`
     - `plannedWorkouts: 'id, date, routineId, status, updatedAt'`
     - `sessions: 'id, date, routineId, updatedAt'`
     - `setLogs: 'id, sessionId, exerciseId, [exerciseId+completedAt], updatedAt'`
     - `bodyMetrics: 'id, date, updatedAt'`
     - `outbox: '++seq, table, rowId'` y `meta: 'key'` (para `lastPulledAt`).
   - Seed: al primer arranque (o si cambia la versión del seed) carga `exercises.json` con `bulkPut`.
   - `src/db/repo.ts`: funciones `save<Table>(row)` y `softDelete<Table>(id)` que ponen `updatedAt`, añaden a `outbox` y escriben en una transacción. **Toda escritura de la app pasa por aquí.**
   - Tests de repo con `fake-indexeddb`.
   - Commit: `F1: esquema Dexie y repositorio con outbox`.

3. **Supabase y autenticación**
   - Instalar `@supabase/supabase-js`. `src/sync/supabase.ts` con el cliente (variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - Pantalla Ajustes → «Cuenta y sincronización»: campo email → enlace mágico; estado conectado/desconectado; botón «Sincronizar ahora»; fecha de última sincronización.
   - La app funciona entera sin iniciar sesión (todo local); al iniciar sesión por primera vez, sube lo que haya local.

4. **Motor de sincronización** (`src/sync/engine.ts`)
   - Mapeo camelCase ↔ snake_case por tabla.
   - `push()`: lee `outbox` en orden, agrupa por tabla, `upsert` en lotes de 200, borra de `outbox` lo confirmado.
   - `pull()`: por tabla, `select * where server_updated_at > lastPulledAt order by server_updated_at`, aplica con last-write-wins comparando `updated_at` (solo sobrescribe si el remoto es más reciente y el registro local no está pendiente en la outbox con una fecha mayor), guarda `lastPulledAt` = mayor `server_updated_at` recibido. (El servidor también aplica LWW con un trigger, ver `supabase/schema.sql`.)
   - `sync()` = push y luego pull; con bloqueo para no ejecutarse dos veces a la vez; reintento con espera exponencial ante error de red.
   - Disparadores: arranque, evento `online`, `visibilitychange` a visible, cada 60 s con la app visible, y tras `save` (con debounce de 2 s).
   - Indicador discreto de estado (icono en la barra: sincronizado / pendiente / sin conexión / error) — sin toasts salvo error persistente.
   - Tests del motor con un cliente Supabase simulado: conflicto LWW, soft delete propagado, reintento.
   - Commit: `F1: sincronización PC ↔ móvil`.

5. **Biblioteca** (`/biblioteca`) — antes, `/impeccable shape biblioteca`
   - Buscador que ignora tildes y mayúsculas y busca en español e inglés; resultados al escribir (debounce 120 ms).
   - Filtros: grupo muscular (bodyPart), equipo, solo favoritos. Chips en móvil; panel lateral en PC.
   - Lista virtualizada (`@tanstack/react-virtual`) con miniatura (lazy, `loading="lazy"`, tamaño fijo para evitar saltos), nombre en español, músculo objetivo y equipo.
   - PC: dos columnas (lista | ficha). Móvil: la ficha abre en ruta `/ejercicio/$exerciseId`.
   - Ficha: GIF, nombre ES (y EN en pequeño), músculo objetivo y secundarios, equipo, pasos numerados en español, botón favorito (se guarda en `exerciseSettings` y sincroniza), atribución «© Gym visual — gymvisual.com». Hueco reservado «Historial» (se llena en F4).
   - Estado vacío y «sin resultados» con copy útil.
   - `/make-interfaces-feel-better full biblioteca`.
   - Commit: `F1: biblioteca con búsqueda, filtros y ficha`.

## Criterios de aceptación
- [ ] La Biblioteca muestra 1.324 ejercicios; buscar «press banca», «sentadilla» o «bench» devuelve resultados pertinentes en < 100 ms.
- [ ] Los 30 ejercicios más comunes tienen un nombre en español natural.
- [ ] Filtrar por «Pecho» + «Mancuerna» funciona y se combina con la búsqueda.
- [ ] La ficha muestra GIF, pasos en español y atribución.
- [ ] Marco un favorito en el PC → aparece en el móvil en < 1 minuto (o al volver a la pestaña).
- [ ] Con el móvil en modo avión marco otro favorito; al recuperar red se sincroniza.
- [ ] La app funciona sin haber iniciado sesión.
- [ ] Tests del repositorio y del motor de sync pasan.
