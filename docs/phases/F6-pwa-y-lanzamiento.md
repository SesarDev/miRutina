# F6 · PWA y lanzamiento

**Objetivo:** app instalada en el móvil, funcionando sin conexión, desplegada en internet y con copia de seguridad exportable.

**Prerrequisitos:** F5 cerrada (`f5-done`).

## Preguntar antes de empezar
- ¿Dónde desplegar? Propongo Vercel (gratis, conectado a GitHub). Necesitarás una cuenta y subir el repo a GitHub (privado).
- Nombre e icono de la app (el nombre que verás en la pantalla de inicio del móvil).

## Pasos

1. **PWA** (`vite-plugin-pwa`)
   - Manifest: nombre, nombre corto, `display: standalone`, `orientation: portrait` (solo móvil), colores del tema oscuro, iconos 192/512 y maskable (generarlos a partir de un SVG con `@vite-pwa/assets-generator`).
   - Workbox:
     - Precache del shell (HTML, JS, CSS, fuentes) y de `exercises.json`.
     - Miniaturas: `CacheFirst` con caducidad larga.
     - GIFs: `CacheFirst` bajo demanda; precachear en segundo plano solo los de ejercicios en rutinas y favoritos.
     - Peticiones a Supabase: nunca cachear (la sync ya gestiona offline).
   - Aviso discreto «Nueva versión disponible · Recargar» con `registerType: 'prompt'`, que **no** aparece durante una sesión en curso.
   - Commit: `F6: PWA instalable y offline`.

2. **Copia de seguridad**
   - Ajustes → «Exportar datos»: descarga un JSON con todas las tablas de usuario (incluidas las borradas lógicamente) y versión del esquema.
   - «Importar datos»: valida el JSON y fusiona con last-write-wins; muestra un resumen antes de confirmar.
   - Recordatorio en Ajustes si la última exportación tiene más de 30 días (solo informativo).
   - Commit: `F6: exportar e importar`.

3. **Despliegue**
   - Subir el repo a GitHub (privado). `vendor/` y `.env*` fuera del repo; `public/exercises/` sí va en el repo (o en Supabase Storage si pesa demasiado — medirlo y preguntarme).
   - Proyecto en Vercel: variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
   - Supabase → Authentication → URL Configuration: añadir la URL de producción como Site URL y Redirect URL.
   - Cabeceras: caché larga para `/assets/*` y `/exercises/*`; sin caché para `index.html` y `sw.js`.
   - Commit: `F6: despliegue`.

4. **Instalación y prueba final**
   - Guíame para instalar la app en el móvil (Android: menú → Instalar app; iPhone: Compartir → Añadir a pantalla de inicio).
   - Lighthouse (móvil): PWA instalable, Rendimiento ≥ 90, Accesibilidad ≥ 95.
   - Prueba de extremo a extremo real: planificar en el PC → entrenar en modo avión → recuperar red → ver la sesión y los récords en el PC.

## Criterios de aceptación
- [ ] La app se instala en el móvil y abre a pantalla completa.
- [ ] Con modo avión, abre y permite registrar una sesión completa (incluidas miniaturas y GIFs de mis rutinas).
- [ ] Al recuperar red, la sesión aparece en el PC.
- [ ] Puedo exportar mis datos a un JSON y volver a importarlo sin duplicados.
- [ ] La URL de producción funciona en el PC con login por enlace mágico.
- [ ] Lighthouse cumple los mínimos indicados.
