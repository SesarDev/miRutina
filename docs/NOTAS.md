# Notas del proyecto

## Estado

- **F0 · Base y diseño:** cerrada el 29 oct 2026 (etiqueta `f0-done`).
  - Vite + React 19 + TS strict, alias `@/`, ESLint + Prettier, Vitest + Testing Library.
  - Skills instaladas en `.claude/skills/`: impeccable, transitions-dev, make-interfaces-feel-better y las 8 de GSAP.
  - `PRODUCT.md` y `DESIGN.md` (dirección «Dorsal») en la raíz.
  - Tokens en `src/styles/tokens.css` (oscuro por defecto, claro por sistema o forzado), motion en `src/motion/tokens.ts`.
  - Shell con TanStack Router, barra inferior / barra lateral, primitivas en `src/components/ui/` y `/dev/ui`.

- **F1 · Datos, sincronización y biblioteca:** cerrada el 29 oct 2026 (etiqueta `f1-done`). Catálogo de 1.324 ejercicios con nombres en español, Dexie con outbox, sincronización con Supabase y Biblioteca. **Pendiente de verificar a mano** (el usuario lo prueba después): favorito PC → móvil en < 1 min y favorito en modo avión que se sincroniza al volver la red.

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
- **Media de Gym visual fuera de git** (`public/exercises/` en `.gitignore`): el NOTICE del dataset dice que clonar no da derechos de redistribución y el repo de GitHub puede ser público. `npm run import:exercises` la regenera desde `vendor/`. En F6 (despliegue) habrá que decidir cómo se sirve.
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

## Deuda

- El favicon sigue siendo el de Vite; los iconos de la PWA llegan en F6.
- `impeccable critique` se ejecutó en un solo contexto (sin subagentes); repetir la crítica completa al cerrar F3, cuando haya una pantalla real de sesión.
- La sección «Brazalete» de `DESIGN.md` describe un componente que de momento solo existe como muestra en `/dev/ui`.
- `global.css` reduce las animaciones con keyframes a 1 ms con «reducir movimiento»; hoy no hay ninguna. Cuando lleguen (F5), darles una alternativa propia en lugar de depender de ese recorte global.
- Auditoría de impeccable hecha sin el overlay del navegador (detector por CLI + Playwright); el overlay en vivo queda pendiente.
- 71 nombres de ejercicio poco comunes conservan alguna palabra en inglés; ampliar el diccionario o las correcciones cuando aparezcan en rutinas.
- El chunk del catálogo supera el aviso de 500 kB de Vite (se carga diferido; valorar dividirlo en F6).

- Verificación manual de la sincronización entre dispositivos (criterios 5 y 6 de F1) pendiente; si falla, se arregla al inicio de F2.

## Ideas para más adelante

- Marcar la pestaña «Más» como activa también mientras su panel está abierto (ahora solo se marca si la ruta actual es Rutinas, Cuerpo o Ajustes).
- En la sesión (F3), los chips de valoración deberían ser botones grandes de 56 px en el panel inferior, no los chips de 36 px de las listas.
- Enlace mágico + PWA instalada: el enlace se abre en el navegador, no en la PWA. Valorar en F6 el código de 6 dígitos (OTP) como alternativa.
- La pestaña Biblioteca podría seguir marcada al abrir `/ejercicio/$id`.
- Valorar `field-sizing: content` en otros campos numéricos; en navegadores sin soporte el Stepper usa un ancho fijo de 4,5 caracteres.
