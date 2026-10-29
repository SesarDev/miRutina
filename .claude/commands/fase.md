---
description: Ejecuta una fase del plan (p. ej. /fase F1 o /fase F3 desde el paso 4)
argument-hint: F0..F6 [desde el paso N]
---

Vamos a trabajar en la fase: **$ARGUMENTS**

1. Lee `CLAUDE.md`, `docs/PLANNING.md` y el archivo de la fase en `docs/phases/` cuyo nombre empieza por el código indicado (F0, F1…).
2. Comprueba los **prerrequisitos** de la fase (que la anterior esté cerrada: revisa `git log` y que existan los archivos que menciona). Si falta algo, dímelo y para.
3. Si se indica "desde el paso N", revisa qué pasos anteriores ya están hechos en el código y empieza en el N.
4. Muéstrame un plan breve (lista de pasos con los archivos principales que vas a crear o tocar) y **resuelve primero las preguntas marcadas como «Preguntar»** en el archivo de fase. Si no hay preguntas abiertas, empieza sin esperar.
5. Implementa paso a paso. Al terminar cada paso:
   - `npm run typecheck && npm run test` deben pasar (cuando existan esos scripts).
   - Haz un commit pequeño: `<FASE>: <qué se hizo>`.
   - Dime en una línea qué has terminado y qué puedo probar.
6. Usa las skills que indique la fase (impeccable, transitions-dev, gsap-skills, make-interfaces-feel-better) cuando toque, no antes.
7. No implementes nada de fases posteriores. Si ves algo que convendría, apúntalo en `docs/NOTAS.md` bajo «Ideas para más adelante».
8. Al final, recorre los **criterios de aceptación** de la fase y dime cuáles puedo verificar yo a mano y cómo (qué abrir, qué tocar).
