# F0 · Base y diseño

**Objetivo:** proyecto creado, skills instaladas, lenguaje visual definido y un esqueleto navegable en móvil y escritorio con los tokens aplicados.

**Prerrequisitos:** carpeta con el contenido del kit. Node 20+ y Git instalados.

## Preguntar antes de empezar
- ¿Sistema operativo (Windows / macOS / Linux)? → decide si usar `scripts/install-skills.ps1` o `.sh`.

## Pasos

1. **Repositorio y proyecto**
   - `git init` (si no existe). Crear proyecto Vite React + TypeScript **en la carpeta actual** sin borrar los archivos del kit (`npm create vite@latest . -- --template react-ts`; si se queja de carpeta no vacía, crearlo en una subcarpeta temporal y mover los archivos).
   - `tsconfig` en modo strict. Alias `@/` → `src/`.
   - `.gitignore`: añadir `vendor/`, `.env`, `.env.local`, `.impeccable/` (salvo los archivos compartidos que indique impeccable).
   - Instalar: `@tanstack/react-router`, `dexie`, `dexie-react-hooks`, `zustand`, `date-fns`, `gsap`, `@gsap/react`.
   - Dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `eslint` + config de Vite, `prettier`.
   - Scripts npm: `dev`, `build`, `preview`, `test`, `typecheck` (`tsc -b --noEmit` o equivalente), `lint`.
   - Commit: `F0: proyecto base Vite + React + TS`.

2. **Skills de diseño**
   - Ejecutar el script de `scripts/` según el SO. Comprobar que aparecen en `.claude/skills/` (o donde las instale el CLI) y listarlas.
   - Commit: `F0: skills de diseño instaladas`.

3. **Lenguaje visual con impeccable**
   - Ejecutar `/impeccable init` usando las respuestas de `docs/design-brief.md` (superficie: **product**).
   - Resultado esperado: `PRODUCT.md` y `DESIGN.md` en la raíz. Revisarlos conmigo antes de seguir.
   - Commit: `F0: contexto de diseño (PRODUCT.md, DESIGN.md)`.

4. **Tokens**
   - `src/styles/tokens.css` a partir de `DESIGN.md`: colores en OKLCH (neutros tintados, acento, estados, 5 colores de valoración), tipografía (escala modular), espaciado (escala de 4 px), radios (con regla concéntrica: exterior = interior + padding), sombras, z-index.
   - Tokens de motion en el mismo archivo: `--dur-instant` (100 ms), `--dur-fast` (160 ms), `--dur-base` (240 ms), `--dur-slow` (400 ms), `--ease-out`, `--ease-in-out`, `--ease-spring`. Usar `transitions review` / `transitions refine` de la skill transitions-dev para alinear valores con sus tokens.
   - `src/motion/tokens.ts`: lee esos valores para GSAP (`getComputedStyle`) y exporta `prefersReducedMotion()`.
   - Tema oscuro por defecto con `data-theme` en `<html>`; claro con `prefers-color-scheme` y conmutable.
   - `src/styles/global.css`: reset, `font-variant-numeric: tabular-nums` en clases de cifras, `-webkit-font-smoothing`, foco visible.

5. **Shell de la app**
   - TanStack Router con rutas vacías: `/` (Hoy), `/calendario`, `/biblioteca`, `/rutinas`, `/progreso`, `/cuerpo`, `/ajustes`, `/sesion/$sessionId`, `/ejercicio/$exerciseId`.
   - Layout raíz responsive: navegación inferior en móvil (Hoy, Calendario, Biblioteca, Progreso, Más) y barra lateral en ≥ 1024 px. Cada ruta muestra su título y un estado vacío con texto útil (impeccable `clarify` para el copy).
   - Primitivas en `src/components/ui/`: Button (variantes primary/secondary/ghost, escala 0,96 al pulsar, hit area ≥ 44 px), IconButton, Card, Stepper (+/−), Chip, Sheet (panel inferior en móvil / lateral en PC), EmptyState.
   - Página oculta `/dev/ui` que muestra todas las primitivas en ambos temas.

6. **Pasada de detalle**
   - `/make-interfaces-feel-better quick` sobre `/dev/ui` y el layout. Aplicar lo de severidad alta y media.
   - `/impeccable critique` sobre el shell.
   - Commit: `F0: tokens, primitivas y shell responsive`.

7. **Notas**
   - Crear `docs/NOTAS.md` con secciones: Estado, Decisiones técnicas, Deuda, Ideas para más adelante.

## Criterios de aceptación
- [ ] `npm run dev` arranca; `npm run build`, `typecheck`, `lint` y `test` pasan.
- [ ] Las 4 skills aparecen instaladas.
- [ ] `PRODUCT.md` y `DESIGN.md` existen y reflejan el brief.
- [ ] Navegación inferior en móvil (prueba a 390 px) y barra lateral en escritorio (1280 px).
- [ ] `/dev/ui` muestra las primitivas correctamente en tema oscuro y claro.
- [ ] Todos los botones miden ≥ 44 px de área táctil; las cifras usan tabular-nums.
- [ ] Con «reducir movimiento» activado en el sistema, no hay animaciones de desplazamiento.
