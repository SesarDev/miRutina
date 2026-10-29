# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Una sola persona: el propietario. Entrena fuerza en gimnasio varias veces por semana y usa la app en español de España. No hay otros roles ni usuarios.

## Product Purpose

miRutina es un registro personal de entrenamiento de fuerza. Responde en cada momento a tres preguntas:

1. **¿Qué toca hoy?** Calendario con rutinas planificadas por día.
2. **¿Con qué peso?** Al abrir un ejercicio se ve la última sesión (peso, reps, valoración) y la anterior; el usuario decide.
3. **¿Estoy mejorando?** Historial, récords, 1RM estimado, gráficas por ejercicio y peso corporal.

Éxito del MVP: registrar una sesión completa (5–6 ejercicios, ~20 series) con menos de 2 minutos de interacción total, con una mano y sin conexión.

## Positioning

La app **nunca sugiere ni calcula el peso de hoy**. En lugar de un algoritmo de progresión, guarda una valoración de sensaciones de cinco niveles por serie y la pone junto a la última vez, con los valores precargados. La decisión es siempre del usuario. El usuario crea sus propias rutinas o parte de una colección de rutinas ya hechas (por músculo, técnica de series y duración), con técnicas como series alemanas, descendentes, ascendentes y superseries.

## Operating Context

- **Móvil en el gimnasio (PWA instalada):** una mano, manos sudadas, entre series, luz variable, prisa, a menudo sin cobertura. Registrar una serie es un toque; la valoración es opcional y tocarla arranca el descanso.
- **PC en casa:** planificar la semana en el calendario (arrastrar rutinas a días), montar rutinas, revisar progreso con calma.
- Los dos dispositivos se sincronizan en segundo plano; todo funciona sin conexión.

## Capabilities and Constraints

- Pantallas: Hoy, Calendario, Sesión en curso, Biblioteca de ejercicios, Ejercicio · Progreso, Rutinas, Cuerpo, Ajustes.
- Valoración (`feel`): Demasiado, Voy justo, Bien, Puedo más, Poco. Se muestra siempre con texto, nunca solo con color, y no se traduce en recomendaciones.
- Unidades: kg, un decimal como máximo.
- Récords, 1RM estimado (Epley) y «última vez» se calculan a partir de las series registradas.
- La sesión en curso se guarda en cada cambio; nunca se pierden datos al cerrar la app o perder la red.
- Navegación inferior en móvil (360–430 px); barra lateral y 2–3 columnas en escritorio (≥ 1024 px).

## Brand Commitments

- Nombre: **miRutina**.
- Voz: directa, sobria, motivadora sin gritar. Frases cortas. Tuteo. Nada de jerga fitness exagerada ni mensajes tipo «¡Bestia!».
- Tema oscuro primero (gimnasio), claro también disponible.
- Anti-referencias: dashboards SaaS genéricos con tarjetas idénticas; apps fitness con fotos de stock y sombras pesadas; gamificación infantil (insignias, confeti constante).
- Referencias de sensación: la claridad de una app de cronómetro; la densidad de una hoja de cálculo bien hecha; el cuidado del detalle de Linear o Things.

## Evidence on Hand

- Catálogo de 1.324 ejercicios del dataset `hasaneyldrm/exercises-dataset`, con imagen y GIF de 180×180 px y pasos en español. Atribución obligatoria en la ficha: «© Gym visual — gymvisual.com».
- No hay fotografía propia ni ilustraciones; no se deben inventar.

## Product Principles

1. **El usuario decide.** Mostrar el contexto (última vez, la anterior, sensaciones) con claridad, nunca prescribir.
2. **Un toque en el gimnasio.** Cada acción de la sesión en curso, alcanzable con el pulgar y en menos de 300 ms.
3. **Las cifras son las protagonistas.** Peso, reps y fechas grandes, tabulares y legibles a un brazo de distancia.
4. **Nunca perder un dato.** Local primero, sin conexión, sincronización silenciosa salvo error.
5. **Sobriedad.** Sin celebraciones constantes; un único momento de reconocimiento cuando hay récord.

## Accessibility & Inclusion

- Contraste AA mínimo; AAA en las cifras de la sesión en curso.
- Áreas táctiles ≥ 44×44 px.
- `prefers-reduced-motion` respetado en toda la app.
- La valoración siempre lleva texto además del color.
