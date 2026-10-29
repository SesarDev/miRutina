---
name: miRutina
description: Registro personal de fuerza. Cada serie se lee como un dorsal.
colors:
  kit-navy: "oklch(0.2 0.035 258)"
  surface: "oklch(0.235 0.037 258)"
  surface-2: "oklch(0.275 0.038 258)"
  dock: "oklch(0.17 0.032 258)"
  vinyl: "oklch(0.95 0.015 85)"
  text-2: "oklch(0.82 0.018 85)"
  text-3: "oklch(0.66 0.02 85)"
  band-granate: "oklch(0.4 0.125 8)"
  sponsor-gold: "oklch(0.79 0.14 80)"
  media-plate: "oklch(0.98 0.004 85)"
  on-media: "oklch(0.45 0.02 258)"
  scrim: "oklch(0.12 0.03 258 / 0.55)"
  feel-demasiado: "oklch(0.7 0.17 25)"
  feel-justo: "oklch(0.75 0.14 50)"
  feel-bien: "oklch(0.77 0.15 150)"
  feel-puedo-mas: "oklch(0.77 0.1 195)"
  feel-poco: "oklch(0.74 0.11 250)"
typography:
  dorsal:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "4.75rem"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.sponsor-gold}"
    textColor: "{colors.kit-navy}"
    rounded: "{rounded.md}"
    height: "44px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.vinyl}"
    rounded: "{rounded.md}"
    height: "44px"
  stepper:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.vinyl}"
    rounded: "{rounded.md}"
    height: "56px"
  nav-item-active:
    backgroundColor: "{colors.band-granate}"
    textColor: "{colors.vinyl}"
    rounded: "{rounded.md}"
---

<!-- Fuente normativa de los valores: src/styles/tokens.css (tema oscuro arriba; el claro, allí). Este archivo describe el sistema construido en F0. -->

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

- **Marino de equipación**: fondo de la app en oscuro; tinta principal en claro. Los neutros se tiñen hacia este azul, nunca grises puros.
- **Vinilo**: texto principal en oscuro; fondo en claro; fondo del brazalete y del recuadro de los GIF.

### Secondary

- **Granate**: la franja de la equipación. Cabecera de la sesión en curso y marca del elemento activo de la navegación. No es un color de error.

### Tertiary

- **Oro de patrocinio**: acción principal («Serie hecha», «Empezar»), temporizador de descanso y franja del brazalete. Solo en acciones y en el estado activo, nunca como decoración.

### Neutral

- Cuatro pasos del marino: fondo, superficie, superficie 2 y *dock* (barra inferior, barra lateral y panel de controles; el más oscuro). Separadores en vinilo al 12 % y al 22 %.
- Texto en tres niveles sólidos tintados (vinilo, texto 2 y texto 3), todos AA sobre cualquier superficie.
- Tema claro («segunda equipación»): fondo vinilo, tinta marina; el brazalete se invierte a marino con texto vinilo; el oro como texto pasa a un tono oscuro (`--color-accent-ink`) para mantener AA.

### Valoración (`feel`)

Cinco colores semánticos en una escala que va del esfuerzo excesivo a la facilidad. Siempre acompañan al texto de la etiqueta; nunca aparecen solos:

| Valor | Etiqueta | Tono |
| --- | --- | --- |
| `demasiado` | Demasiado | rojo |
| `justo` | Voy justo | naranja coral (separado del oro de acción) |
| `bien` | Bien | verde |
| `puedo_mas` | Puedo más | verde azulado |
| `poco` | Poco | azul |

Cada tono cumple AA como texto sobre el fondo y como chip relleno con su texto encima, en los dos temas. Lo comprueba `src/styles/tokens.test.ts`.

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

## Components

Primitivas en `src/components/ui/`; todas visibles en `/dev/ui` con los dos temas a la vez.

### Buttons

- **Primario** (oro, texto marino): la acción de la pantalla. Uno por vista.
- **Secundario** (borde vinilo al 22 %) y **fantasma** (sin borde, texto 2).
- 44 px de alto (56 px en tamaño `lg`, el de la sesión), radio 12 px, escala 0,96 al pulsar. Los enlaces con aspecto de botón usan `buttonClassName`.
- **IconButton**: 44 × 44 px (56 en `lg`), con nombre accesible obligatorio.

### Chips (if used)

Píldora con borde del color de la valoración; seleccionada, se rellena con texto marino (vinilo en claro). Siempre con la etiqueta de la valoración. Interactiva: 36 px visibles y área táctil de 44 px.

### Cards / Containers

Superficie con filete de 1 px y radio 16 px; padding 16 px. Elementos internos con radio = 16 − padding.

### Inputs / Fields

**Stepper**: −/valor/+ en una pieza de 56 px de alto. La cifra en Barlow Condensed 700, tabular, editable con teclado (acepta coma decimal) y flechas. En huecos estrechos (≤ 184 px) los extremos bajan a 44 px, la cifra a 26 px y la unidad pasa solo al nombre accesible.

### Navigation

- Móvil: barra inferior en el *dock* con Hoy, Calendario, Biblioteca, Progreso y Más (este abre un Sheet con Rutinas, Cuerpo y Ajustes). La pestaña activa lleva el icono sobre una píldora granate.
- Escritorio (≥ 1024 px): barra lateral de 15 rem con la marca y los siete destinos; el activo, en granate.
- **Sheet**: `<dialog>` nativo; panel inferior en móvil, lateral derecho en escritorio. Se cierra con Esc, tocando fuera o con la X.

### Brazalete (signature)

Fila invertida (fondo vinilo, cifra marina a 32 px) con franja dorada de 6 px a la izquierda. Uno por pantalla. Se construye en F3; muestra en `/dev/ui`.

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
