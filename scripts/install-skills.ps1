# Instala las 4 skills de diseño en este proyecto para Claude Code (Windows PowerShell).
# Uso: powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1   (desde la raíz del proyecto)
$ErrorActionPreference = "Stop"

Write-Host "-> impeccable (lenguaje visual)"
npx -y impeccable install
if ($LASTEXITCODE -ne 0) { npx -y skills add https://github.com/pbakaus/impeccable }

Write-Host "-> transitions.dev (micro-interacciones CSS)"
npx -y skills add https://github.com/Jakubantalik/transitions.dev --skill transitions-dev

Write-Host "-> GSAP skills (Flip, ScrollTrigger, React)"
npx -y skills add https://github.com/greensock/gsap-skills

Write-Host "-> Make Interfaces Feel Better (detalle fino)"
npx -y skills add https://github.com/jakubkrehel/make-interfaces-feel-better --skill make-interfaces-feel-better

Write-Host ""
Write-Host "Hecho. Si el instalador pregunta por el agente, elige Claude Code y el ambito del proyecto."
Write-Host "Reinicia la conversacion de Claude en VS Code para que detecte las skills nuevas."
