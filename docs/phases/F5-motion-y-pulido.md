# F5 · Motion y pulido

**Objetivo:** que la app se sienta rápida, precisa y cuidada. Movimiento con propósito, sin frenar el uso entre series.

**Prerrequisitos:** F4 cerrada (`f4-done`). Todas las pantallas funcionalmente estables.

## Reglas
- CSS (transitions.dev) para cambios de estado de UN elemento. GSAP solo para coordinar varios elementos, Flip o scroll.
- Tokens únicos de duración/easing en `src/styles/tokens.css`; GSAP los lee desde `src/motion/tokens.ts`.
- En la sesión en curso, toda animación < 300 ms y nunca bloquea un toque.
- `prefers-reduced-motion`: sin desplazamientos ni escalados; como máximo fundidos de opacidad cortos.
- GSAP en React SIEMPRE con `useGSAP` y `scope`; limpieza automática al desmontar; `ScrollTrigger.refresh()` tras cambios de layout.

## Pasos

1. **Auditoría de partida**
   - `transitions review`: lista de lugares donde encaja cada transición de transitions.dev. Revisar conmigo y elegir.
   - `/impeccable critique` de la app completa: lista priorizada.
   - Guardar ambas listas en `docs/NOTAS.md`.

2. **Micro-interacciones CSS** (`transitions apply` en cada caso)
   - Marcar serie hecha → «success check» (check que se dibuja + leve rebote) y escala 0,96 al pulsar.
   - Botones de valoración → entrada escalonada (stagger corto, 30–40 ms entre botones) y estado seleccionado claro.
   - Steppers +/− → cifra que cambia con desplazamiento vertical sutil.
   - Temporizador → anillo animado en CSS; últimos 3 s con pulso suave.
   - Sheets/paneles → entrada desde abajo (móvil) o lateral (PC).
   - Hover y foco consistentes en PC.
   - `transitions refine` para unificar todas las duraciones y curvas existentes a los tokens.
   - Commit: `F5: micro-interacciones CSS`.

3. **GSAP Flip**
   - Calendario: cambio semana ↔ mes animando las celdas del día a su nueva posición.
   - Biblioteca/rutina → ficha: la miniatura de la tarjeta se expande hasta la cabecera de la ficha (en móvil, entre rutas: capturar estado antes de navegar).
   - Reordenar ejercicios en rutina y sesión: los demás elementos se recolocan con Flip.
   - Commit: `F5: transiciones Flip`.

4. **GSAP ScrollTrigger (con moderación)**
   - Historial del ejercicio y Progreso: entrada escalonada de las tarjetas con `ScrollTrigger.batch` una sola vez (`once: true`).
   - Gráficas: la línea se dibuja al entrar en pantalla la primera vez.
   - Nada de pin ni scrub en pantallas de uso diario.
   - Commit: `F5: animaciones de scroll`.

5. **Momento de récord**
   - Al cerrar una sesión con récords: un único momento de celebración contenido (impeccable `delight`): la tarjeta de récord entra con una timeline GSAP corta (< 800 ms) y vibración breve. Sin confeti.
   - Commit: `F5: celebración de récords`.

6. **Pasada de detalle final**
   - `/make-interfaces-feel-better full` pantalla a pantalla: Hoy, Calendario, Sesión, Biblioteca, Ficha, Rutinas, Progreso, Cuerpo, Ajustes. Aplicar severidad alta y media.
   - `/impeccable polish` y `/impeccable adapt` (móvil 390 px y escritorio 1280 px).
   - `/impeccable audit`: corregir accesibilidad, rendimiento y responsive.
   - Comprobar 60 fps en la sesión en un móvil real (DevTools → Performance con CPU 4× más lenta).
   - Commit: `F5: pulido final`.

## Criterios de aceptación
- [ ] Marcar series y valorar se siente instantáneo; nada espera a que termine una animación.
- [ ] Cambio semana ↔ mes y abrir ficha se animan con Flip de forma fluida.
- [ ] Con «reducir movimiento» activado, no hay desplazamientos ni escalados.
- [ ] Todas las duraciones y curvas salen de los tokens (`transitions refine` no encuentra valores sueltos).
- [ ] `/impeccable audit` sin problemas de severidad alta.
- [ ] Las animaciones GSAP se limpian al cambiar de pantalla (sin avisos en consola ni fugas).
