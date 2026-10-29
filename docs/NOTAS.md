# Notas del proyecto

## Estado

- **F0 · Base y diseño:** terminada a falta de `/cerrar-fase F0` (29 oct 2026).
  - Vite + React 19 + TS strict, alias `@/`, ESLint + Prettier, Vitest + Testing Library.
  - Skills instaladas en `.claude/skills/`: impeccable, transitions-dev, make-interfaces-feel-better y las 8 de GSAP.
  - `PRODUCT.md` y `DESIGN.md` (dirección «Dorsal») en la raíz.
  - Tokens en `src/styles/tokens.css` (oscuro por defecto, claro por sistema o forzado), motion en `src/motion/tokens.ts`.
  - Shell con TanStack Router, barra inferior / barra lateral, primitivas en `src/components/ui/` y `/dev/ui`.

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
- Vitest procesa CSS (`test.css.include`) para que `?raw` funcione en `tokens.test.ts`.

## Deuda

- El favicon sigue siendo el de Vite; los iconos de la PWA llegan en F6.
- `impeccable critique` se ejecutó en un solo contexto (sin subagentes); repetir la crítica completa al cerrar F3, cuando haya una pantalla real de sesión.
- La sección «Brazalete» de `DESIGN.md` describe un componente que de momento solo existe como muestra en `/dev/ui`.

## Ideas para más adelante

- Marcar la pestaña «Más» como activa también mientras su panel está abierto (ahora solo se marca si la ruta actual es Rutinas, Cuerpo o Ajustes).
- En la sesión (F3), los chips de valoración deberían ser botones grandes de 56 px en el panel inferior, no los chips de 36 px de las listas.
- Valorar `field-sizing: content` en otros campos numéricos; en navegadores sin soporte el Stepper usa un ancho fijo de 4,5 caracteres.
