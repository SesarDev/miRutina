---
description: Verifica los criterios de aceptación de una fase y la cierra con un commit y una etiqueta
argument-hint: F0..F6
---

Cierra la fase **$ARGUMENTS**:

1. Lee el archivo de la fase en `docs/phases/` y su lista de **criterios de aceptación**.
2. Ejecuta `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build`. Si alguno falla, arréglalo antes de seguir.
3. Recorre cada criterio y márcalo como: ✅ verificado por ti (di cómo), 👤 requiere que yo lo pruebe a mano (dime exactamente qué hacer), o ❌ no cumplido (arréglalo o explícame por qué no).
4. Si la fase tiene pantallas nuevas, ejecuta `/impeccable audit` sobre ellas y corrige los problemas de severidad alta.
5. Actualiza `docs/NOTAS.md`:
   - Sección «Estado»: fase cerrada y fecha.
   - Sección «Decisiones técnicas»: lo que se decidió durante la fase y no está en `docs/PLANNING.md`.
   - Sección «Deuda»: lo que queda pendiente a propósito.
6. Cuando yo confirme los criterios 👤, haz commit `<FASE>: cierre de fase` y crea la etiqueta git `<fase-en-minúsculas>-done` (p. ej. `f1-done`).
7. Termina diciéndome que abra una conversación nueva (`/clear`) y escriba `/fase <siguiente>`.
