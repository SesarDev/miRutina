# Planning — App de registro fitness

Versión 29 oct 2026. Documento de referencia para todas las fases.

## Objetivo
Responder en cada momento a tres preguntas:
1. **¿Qué toca hoy?** — calendario con rutinas planificadas por día.
2. **¿Con qué peso?** — al abrir un ejercicio ves la última sesión (peso, reps, valoración) y decides tú.
3. **¿Estoy mejorando?** — historial, récords, gráficas por ejercicio y peso corporal.

Criterio de éxito del MVP: registrar una sesión completa (5–6 ejercicios, ~20 series) con menos de 2 minutos de interacción total, con una mano y sin conexión.

## Decisiones tomadas
- Uso personal (un solo usuario). La media del dataset (© Gym visual) se usa tal cual con atribución.
- PC y móvil, sincronizados (Supabase) desde la F1. PC para organizar, móvil para entrenar.
- Sin programas predefinidos: el usuario crea sus rutinas.
- Sin sugerencia automática de peso: valoración de sensaciones de cinco opciones.
- Peso corporal y medidas incluidos. Unidades en kg.

## Dataset de ejercicios
Repo: https://github.com/hasaneyldrm/exercises-dataset
- `data/exercises.json`: 1.324 ejercicios; `data/exercises.schema.json` (JSON Schema 2020-12).
- Campos: `id`, `name` (solo inglés), `category`/`body_part`, `equipment`, `target`, `muscle_group`, `secondary_muscles[]`, `instructions.{en,es,…}`, `instruction_steps.{en,es,…}[]`, `media_id`, `image` (`images/XXXX-id.jpg`, 180×180), `gif_url` (`videos/XXXX-id.gif`, 180×180), `attribution`.
- Body parts: upper arms, upper legs, back, waist, chest, shoulders, lower legs, lower arms, cardio, neck.
- Falta: nombre en español → generamos `nameEs` (diccionario de términos + revisión manual de los más usados).

## Pantallas
| Pantalla | Dispositivo | MVP |
| --- | --- | --- |
| Hoy | Móvil | Entreno del día, "Empezar", resumen semanal |
| Calendario | PC | Semana y mes; asignar rutina arrastrando; hecho/planificado/saltado; repetir semanal |
| Sesión en curso | Móvil | Series precargadas de la última vez; valoración de un toque; descanso; notas |
| Biblioteca | Ambos | Buscar ES/EN, filtros músculo/equipo, ficha con GIF y pasos en español, favoritos |
| Ejercicio · Progreso | Ambos | Historial con valoraciones, 1RM estimado, récords, gráfica |
| Rutinas | PC | Plantillas en dos columnas: biblioteca ↔ rutina, arrastrar y soltar |
| Cuerpo | Ambos | Peso corporal y medidas con gráfica |
| Ajustes | Ambos | kg, descanso por defecto, cuenta de sync, exportar JSON |

## Valoración de sensaciones (`feel`)
| Valor | Etiqueta | Significado |
| --- | --- | --- |
| `demasiado` | Demasiado | No completé las reps o se rompió la técnica |
| `justo` | Voy justo | Completé, al límite |
| `bien` | Bien | Exigente, quedaban 1–2 reps |
| `puedo_mas` | Puedo más | Sobraban 3 o más reps |
| `poco` | Poco | Muy fácil |

La app NO traduce esto en recomendaciones. Solo lo muestra junto a la última sesión y en el historial.

Flujo en el gimnasio:
1. Al abrir el ejercicio: "Última vez (hace 4 días): 60 kg × 10, 10, 9 · Puedo más" + la anterior en gris.
2. Campos precargados con peso y reps de la última vez; +/− grandes o teclado.
3. Marcar serie hecha → aparecen los 5 botones; tocar uno (opcional) arranca el descanso.
4. Historial y gráfica muestran la valoración de cada punto.

## Cálculos
- 1RM estimado (Epley): `w * (1 + r / 30)`, solo series de trabajo con r ≤ 12.
- Récords al cerrar sesión: más peso, más reps a un peso dado, mejor 1RM estimado, más volumen (Σ peso × reps) por sesión.

## Sincronización
- Local-first: la UI lee y escribe en Dexie. Cada escritura marca `updatedAt` y añade el registro a una cola `outbox`.
- Push: sube la outbox a Supabase con `upsert`. Pull: descarga filas con `server_updated_at > lastPulledAt` (hora del servidor, inmune a relojes desajustados).
- Conflictos: gana el `updatedAt` más reciente por registro (last-write-wins).
- Disparadores: al arrancar, al recuperar red (`online`), al volver a la pestaña (`visibilitychange`), cada 60 s con la app abierta, y tras cerrar una sesión.
- Login con enlace mágico; la sesión de Supabase persiste en el dispositivo.

## Diseño y motion
| Herramienta | Papel | Cuándo |
| --- | --- | --- |
| impeccable | Lenguaje visual, color OKLCH, tipo, espaciado, UX writing, anti-patrones | `init` en F0; `shape` antes de cada pantalla; `critique`/`audit`/`polish` al cerrar fases |
| transitions.dev | Micro-interacciones CSS + tokens de motion | `review`/`apply`/`refine` en F5 (y puntualmente antes) |
| GSAP skills | Flip, ScrollTrigger, timelines, `useGSAP` | F5 sobre pantallas estables |
| make-interfaces-feel-better | Radios concéntricos, tabular-nums, hit areas, escala al pulsar, sombras | Al terminar cada pantalla y en F5 |

Dónde va cada cosa:
- Marcar serie → "success check" (transitions.dev) + escala 0,96; botones de valoración entran escalonados.
- Descanso → anillo SVG en CSS; cifras tabular-nums.
- Mes ↔ semana y abrir tarjeta de ejercicio → GSAP Flip.
- Arrastrar en PC → elemento elevado con sombra; hueco de destino animado.
- Historial → ScrollTrigger con moderación (entrada escalonada, gráfica que se dibuja). Sin scroll secuestrado.
- Nuevo récord → un único momento de "delight" al cerrar la sesión.
- Gimnasio → hit areas ≥ 44 px, botones grandes, alto contraste en oscuro.
- Escritorio → layouts 2–3 columnas con container queries.

## Fases
| Fase | Contenido | Semana orientativa |
| --- | --- | --- |
| F0 | Base y diseño | 2–8 nov |
| F1 | Datos, sincronización y biblioteca | 9–15 nov |
| F2 | Rutinas y calendario | 16–26 nov |
| F3 | Sesión en curso → **MVP usable en el gimnasio** | 27 nov–7 dic |
| F4 | Historial, progreso y cuerpo | 8–14 dic |
| F5 | Motion y pulido | 15–21 dic |
| F6 | PWA y lanzamiento | 22–28 dic |
