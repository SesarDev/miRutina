---
name: miRutina
description: Registro personal de fuerza. Cada serie se lee como un dorsal.
---

<!-- SEED: established with the user before implementation; re-run $impeccable document once there's code to capture the actual tokens and components. -->

# Design System: miRutina

## Overview

**Dirección: «Dorsal».** El mundo viene de las equipaciones de liga: el nombre y el número termoimpresos en vinilo a la espalda de la camiseta, los colores de la equipación y el brazalete de capitán. La cifra es la identidad: peso y reps se leen como se lee un dorsal desde la grada, grandes, condensados y sin adornos.

El mundo aporta exactamente cuatro cosas: **tipo, paleta, densidad y un gesto propio**. Nunca aporta la navegación ni los controles: la app es una herramienta de registro de su categoría (barra inferior en móvil, barra lateral en escritorio, botones, steppers, listas y tablas estándar).

- **Escena física:** un gimnasio con luz variable (fluorescentes, ventanales, zonas en penumbra), el móvil en una mano entre series. Esto obliga al **tema oscuro por defecto**: fondo azul marino de equipación, nunca negro puro. En casa, en PC, el tema claro invierte la camiseta: fondo vinilo crema con tinta marina.
- **Gesto propio — el brazalete de capitán:** en cada pantalla, el elemento activo (la serie en curso, el día de hoy en el calendario, el ejercicio seleccionado) se envuelve en una banda invertida: fondo vinilo, cifra marina y franja dorada. Es el **único bloque invertido de la pantalla**.
- **«La espalda de la camiseta»:** la «Última vez» de un ejercicio se compone como un dorsal: el nombre en versalitas espaciadas arriba y el peso enorme debajo, con reps y valoración en una línea. La anterior, en tono apagado.
- **Imágenes:** solo la media del dataset (GIF e imagen de 180×180 px con fondo blanco). Van siempre en un recuadro claro de vinilo con radio suave, nunca recortados ni flotando sobre el fondo oscuro. Con `prefers-reduced-motion` se muestra la imagen fija y el GIF solo se reproduce al tocar. No hay fotografía de stock ni ilustración.
- **Motion:** sobrio y funcional. Duraciones de 100 a 400 ms; la sesión en curso, por debajo de 300 ms. El brazalete se desplaza a la siguiente serie al marcarla (es el momento de motion de la app); el resto son cambios de estado de un solo elemento en CSS. Sin secuencias de carga orquestadas.

## Colors

**Estrategia: comprometida en la carcasa, contenida en el contenido.** La equipación pinta la estructura (fondo marino, banda granate en la cabecera de la sesión y en el elemento activo de la navegación); el contenido vive en vinilo sobre marino. El dorado es la acción.

### Primary

- **Marino de equipación** (`#0f1828`, aprox.): fondo de la app en oscuro; tinta principal en claro. Los neutros se tiñen hacia este azul, nunca grises puros.
- **Vinilo** (`#f2eee4`, aprox.): texto principal en oscuro; fondo en claro; fondo del brazalete y del recuadro de los GIF.

### Secondary

- **Granate** (`#7d1f37`, aprox.): la franja de la equipación. Cabecera de la sesión en curso y marca del elemento activo de la navegación. No es un color de error.

### Tertiary

- **Oro de patrocinio** (`#e3b23c`, aprox.): acción principal («Serie hecha», «Empezar»), temporizador de descanso y franja del brazalete. Solo en acciones y en el estado activo, nunca como decoración.

### Neutral

- Superficies marinas en 3 o 4 pasos de luminosidad (fondo, superficie elevada, panel de los controles inferiores, separadores) y vinilo con opacidades graduadas para texto secundario y terciario. Los valores exactos, en OKLCH, se fijan en `src/styles/tokens.css` [to be resolved during implementation].

### Valoración (`feel`)

Cinco colores semánticos en una escala que va del esfuerzo excesivo a la facilidad. Siempre acompañan al texto de la etiqueta; nunca aparecen solos:

| Valor | Etiqueta | Tono |
| --- | --- | --- |
| `demasiado` | Demasiado | rojo |
| `justo` | Voy justo | naranja coral (separado del oro de acción) |
| `bien` | Bien | verde |
| `puedo_mas` | Puedo más | verde azulado |
| `poco` | Poco | azul |

Valores OKLCH con contraste AA sobre marino y sobre vinilo [to be resolved during implementation].

### Named Rules

**La regla del bloque único.** En cada pantalla hay como máximo un bloque invertido (vinilo sobre marino): el brazalete del elemento activo. Si aparece un segundo, uno de los dos sobra.

**La regla del oro.** El oro solo marca lo que se puede pulsar ahora mismo o el tiempo que corre. Nada decorativo es dorado.

**La regla del texto.** Ninguna valoración ni estado se comunica solo con color.

## Typography

**Una superfamilia: Barlow.** Barlow Condensed (500–700) para las cifras y los títulos de pantalla; Barlow (400–600) para etiquetas, cuerpo y controles. Las dos se sirven desde el propio proyecto (paquete `@fontsource`), sin hojas de Google Fonts, para que funcionen sin conexión. Todas las cifras llevan `font-variant-numeric: tabular-nums`.

### Hierarchy

- **Dorsal** (Barlow Condensed 700, ~72–80 px): el peso de «Última vez». Uno por pantalla como máximo.
- **Cifra de serie** (Barlow Condensed 600, 24 px; 32 px en el brazalete): peso × reps en las listas.
- **Título de pantalla** (Barlow Condensed 700, ~26 px, mayúsculas): el nombre del ejercicio o de la pantalla.
- **Rótulo** (Barlow 600, 12 px, mayúsculas, tracking +0,08 em): «Última vez · hace 4 días», cabeceras de columna.
- **Cuerpo** (Barlow 400, 15 px) y **secundario** (Barlow 400, 13 px).
- Escala fija en rem con una proporción de 1,125 a 1,2 entre pasos; nada de tipografía fluida.

### Named Rules

**La regla de la escala.** La jerarquía de las cifras se consigue solo con el tamaño: sin cajas, sombras ni fondos alrededor de un número (salvo el brazalete).

**La regla de la columna.** Peso × reps se alinea a la derecha en una columna rígida, pegada al margen, para leer en vertical.

## Layout

- **Móvil (360–430 px):** navegación inferior (Hoy, Calendario, Biblioteca, Progreso, Más). La sesión en curso coloca los controles (steppers de peso y reps y «Serie hecha») en un panel fijo abajo, al alcance del pulgar. Margen lateral de 16–20 px.
- **Escritorio (≥ 1024 px):** barra lateral fija y layouts de 2 o 3 columnas con container queries.
- **Espaciado:** escala de 4 px. Grupos apretados y separación generosa entre bloques; más aire encima de un rótulo que debajo.
- **Comparación a escala fija:** «Última vez» y la serie de hoy comparten tamaño y línea base para compararlas sin leer.
- **Despliegue del activo:** en la sesión, el ejercicio activo se despliega y los demás se recogen a una línea (nombre y series × reps).

## Elevation & Depth

Sin sombras como sistema. La profundidad se expresa con **pasos de luminosidad del marino** y separadores de 1 px en vinilo de opacidad baja. Solo las capas que flotan de verdad (el panel inferior de controles, las *sheets* y lo que se arrastra en PC) llevan una sombra suave con desplazamiento, oscura y tintada de marino. Cada elemento declara su elevación una sola vez: o borde, o sombra.

## Shapes

- **Controles** (botones, steppers): esquinas firmes, de unos 12 px.
- **Chips de valoración:** píldora.
- **Contenedores:** radio de 12 a 16 px, siguiendo la regla concéntrica (radio exterior = radio interior + padding).
- **Brazalete:** banda de borde a borde sin radio, con franja dorada en el lado de entrada.
- Las áreas táctiles miden siempre 44 × 44 px o más.

## Do's and Don'ts

### Do:

- Componer la «Última vez» como la espalda de una camiseta: nombre arriba, cifra enorme debajo.
- Mantener controles estándar (botones, steppers +/−, listas, tablas) en el vocabulario de la equipación: color y tipo, nada más.
- Teñir todos los neutros hacia el marino.
- Mostrar los GIF del dataset en su recuadro claro, con la atribución «© Gym visual — gymvisual.com» en la ficha.

### Don't:

- Disfrazar la interfaz de camiseta: nada de textura de malla, costuras, escudos, cuellos ni números con contorno de vinilo.
- Usar negro con un acento neón, degradados o brillos.
- Usar sombras pesadas, tarjetas idénticas de icono más título como estructura de página ni rótulos encima de los títulos.
- Celebrar constantemente: sin insignias ni confeti. Un único momento de reconocimiento cuando hay récord.
- Usar el granate para errores ni el oro para decorar.
