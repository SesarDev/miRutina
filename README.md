# Kit de construcción — App de registro fitness

Kit para construir la app fase a fase con **VS Code + extensión de Claude (Claude Code)**.

## Contenido

```
fitness-app-kit/
├── CLAUDE.md                     ← contexto del proyecto (Claude lo lee siempre)
├── .claude/commands/
│   ├── fase.md                   ← /fase F1  → ejecuta una fase
│   ├── cerrar-fase.md            ← /cerrar-fase F1 → verifica criterios y hace commit
│   └── estado.md                 ← /estado → resumen de en qué punto está el proyecto
├── docs/
│   ├── PLANNING.md               ← el planning resumido (fuente de verdad)
│   ├── design-brief.md           ← respuestas para /impeccable init
│   └── phases/F0…F6              ← instrucciones detalladas por fase
├── scripts/
│   ├── install-skills.sh         ← instala las 4 skills de diseño (macOS/Linux/Git Bash)
│   └── install-skills.ps1        ← lo mismo para PowerShell (Windows)
├── supabase/schema.sql           ← tablas + seguridad (RLS) para la sincronización
└── .env.example
```

## Cómo empezar

1. **Requisitos**: Node.js 20+, Git, VS Code con la extensión de Claude Code, una cuenta gratuita en [supabase.com](https://supabase.com) (se usa a partir de la F1).
2. Crea una carpeta vacía para el proyecto (p. ej. `fitness-app`) y **copia dentro todo el contenido de este kit** (incluida la carpeta oculta `.claude`).
3. Ábrela en VS Code y abre el panel de Claude.
4. Escribe: `/fase F0`
5. Cuando Claude termine y lo hayas probado: `/cerrar-fase F0`
6. Repite con `F1`, `F2`… hasta `F6`.

## Consejos

- **Una fase por conversación.** Empieza una conversación nueva en cada fase (`/clear`): el contexto viaja en `CLAUDE.md` y `docs/`, no en el chat.
- Las fases largas (F1, F3) tienen sub-pasos; si la conversación se alarga, pide a Claude que termine el sub-paso actual, haz `/cerrar-fase` parcial o un commit, y continúa en otra conversación con `/fase F3 desde el paso 4`.
- Si algo no te convence, dilo en el chat antes de cerrar la fase; los criterios de aceptación están al final de cada archivo de fase.
- Las decisiones de producto ya están tomadas en `docs/PLANNING.md`. Si cambias alguna, edita ese archivo para que Claude la respete en las siguientes fases.

## Despliegue

Pasos para publicar la app en Vercel, configurar Supabase e instalarla en el móvil: [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).
