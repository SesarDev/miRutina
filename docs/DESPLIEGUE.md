# Despliegue e instalación

La app es estática (Vite) y se publica en **Vercel** desde el repositorio de GitHub. Supabase guarda los datos y hace el login por enlace mágico. Todo lo que hay en el repositorio ya está preparado (`vercel.json`, PWA, iconos); estos son los pasos que hay que hacer **a mano** en las webs de Vercel y Supabase.

## 1. Vercel (una vez)

1. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub → **Add New… → Project** → importa el repositorio `miRutina`.
2. Vercel detecta Vite. No cambies nada de *Build & Output* (lo fija `vercel.json`).
3. **Environment Variables** (Production y Preview), copiadas de tu `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**. Cada `git push` a `main` vuelve a desplegar solo.
5. Apunta la URL de producción (algo como `https://mirutina-xxxx.vercel.app`).

> La media del dataset (`public/exercises/`, 138 MB, © Gym visual) no está en el repositorio: `npm run build` la descarga antes de compilar (`prebuild` → `npm run fetch:media`), fijada a un commit del dataset. Vercel tiene `git` en el entorno de build, así que no hace falta configurar nada.

## 2. Supabase (una vez)

Supabase → tu proyecto → **Authentication → URL Configuration**:

- **Site URL**: la URL de producción de Vercel.
- **Redirect URLs**: añade la URL de producción con `/**` al final (p. ej. `https://mirutina-xxxx.vercel.app/**`). Deja también `http://localhost:5173/**` si sigues usando el servidor de desarrollo.

Sin esto, el enlace mágico del correo te lleva a localhost en vez de a la app publicada.

## 3. Comprobar en el PC

1. Abre la URL de producción → **Ajustes → Cuenta** → escribe tu correo → abre el enlace del correo **en el mismo navegador**.
2. Debe aparecer tu sesión iniciada y tus datos sincronizados.

## 4. Instalar en el móvil

Abre la URL de producción en el móvil (con conexión) e inicia sesión como en el PC. Después:

- **Android (Chrome)**: menú ⋮ → **Instalar app** (o «Añadir a pantalla de inicio»). Se abre a pantalla completa con el icono de miRutina.
- **iPhone (Safari)**: botón **Compartir** → **Añadir a pantalla de inicio**. (En iPhone el enlace mágico se abre en Safari, no en la app instalada: inicia sesión **antes** de instalarla, o abre el enlace y vuelve a la app).

La primera vez, con conexión, la app descarga lo necesario para funcionar sin red: la app, las 1.324 imágenes (≈ 12 MB) y los GIF de tus favoritos y de los ejercicios de tus rutinas. Deja la app abierta un minuto con wifi antes de ir al gimnasio la primera vez.

## 5. Prueba de extremo a extremo

1. En el PC: planifica una rutina para hoy en el Calendario.
2. En el móvil: activa el **modo avión**, abre la app, haz la sesión completa (miniaturas y GIF de la rutina deben verse) y termínala.
3. Desactiva el modo avión y abre la app un momento.
4. En el PC: el entreno de hoy sale **Hecho**, la sesión aparece en el historial del ejercicio y los récords en Progreso.

## Actualizaciones

Al publicar una versión nueva, la app instalada muestra «Nueva versión disponible · Recargar» (nunca durante una sesión en curso). Si no lo tocas, se actualiza la próxima vez que se cierre del todo.

## Copia de seguridad

**Ajustes → Copia de seguridad → Exportar datos** descarga un JSON con todo. «Importar datos» lo fusiona sin duplicar (gana la versión más reciente de cada registro). Ajustes avisa si la última copia tiene más de 30 días.
