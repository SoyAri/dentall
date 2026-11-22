#!/usr/bin/env bash
# Prepara una máquina (desarrollador o runner de CI) para construir, probar y
# desplegar Consultorio Digital. Uso: bash scripts/env/setup-local.sh
set -euo pipefail

NODE_MIN=20

echo "▶ Verificando herramientas requeridas"
command -v node >/dev/null || { echo "✖ Node.js no está instalado (requerido >= ${NODE_MIN})"; exit 1; }
command -v npm  >/dev/null || { echo "✖ npm no está instalado"; exit 1; }
command -v git  >/dev/null || { echo "✖ git no está instalado"; exit 1; }

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt "$NODE_MIN" ]; then
  echo "✖ Node.js $NODE_MAJOR detectado; se requiere >= $NODE_MIN"; exit 1
fi
echo "  node $(node -v) · npm $(npm -v) · $(git --version)"

echo "▶ Instalando dependencias exactas (npm ci)"
npm ci

echo "▶ Instalando navegador Chromium para pruebas E2E (Playwright)"
if [ "${CI:-}" = "true" ]; then
  npx playwright install --with-deps chromium
else
  npx playwright install chromium
fi

echo "▶ Generando configuración de entorno"
node scripts/env/generate-env.mjs

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "  Se creó .env a partir de .env.example (complétalo con tus valores)."
fi

echo "✔ Entorno listo. Siguientes pasos:"
echo "    npm start          # servidor de desarrollo en http://localhost:4200"
echo "    npm run test:ci    # pruebas unitarias"
echo "    npm run e2e        # pruebas E2E (BASE_URL=http://localhost:4200 por defecto)"
