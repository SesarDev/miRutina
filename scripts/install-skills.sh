#!/usr/bin/env bash
# Instala las 4 skills de diseño en este proyecto para Claude Code.
# Uso: bash scripts/install-skills.sh   (desde la raíz del proyecto)
set -euo pipefail

echo "→ impeccable (lenguaje visual)"
npx -y impeccable install || npx -y skills add https://github.com/pbakaus/impeccable

echo "→ transitions.dev (micro-interacciones CSS)"
npx -y skills add https://github.com/Jakubantalik/transitions.dev --skill transitions-dev

echo "→ GSAP skills (Flip, ScrollTrigger, React)"
npx -y skills add https://github.com/greensock/gsap-skills

echo "→ Make Interfaces Feel Better (detalle fino)"
npx -y skills add https://github.com/jakubkrehel/make-interfaces-feel-better --skill make-interfaces-feel-better

echo ""
echo "Hecho. Si el instalador pregunta por el agente, elige Claude Code y el ámbito del proyecto."
echo "Reinicia la conversación de Claude en VS Code para que detecte las skills nuevas."
