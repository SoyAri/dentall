#!/usr/bin/env bash
# Genera y publica un despliegue en Vercel.
#
# Uso:  bash scripts/deploy/deploy.sh <staging|production>
# Env:  VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID   (obligatorias)
#       STAGING_ALIAS   (opcional) dominio fijo para staging, p. ej. dentall-staging.vercel.app
#
# Pasos: 1) descarga la configuración y variables del entorno de Vercel,
#        2) construye localmente (Angular → dist/), 3) sube el build ya
#        construido (--prebuilt), 4) publica la URL resultante.
set -euo pipefail

AMBIENTE="${1:-}"
case "$AMBIENTE" in
  staging)    VERCEL_ENV=preview;    PROD_FLAG=() ;;
  production) VERCEL_ENV=production; PROD_FLAG=(--prod) ;;
  *) echo "Uso: $0 <staging|production>"; exit 2 ;;
esac

: "${VERCEL_TOKEN:?Falta VERCEL_TOKEN}"
: "${VERCEL_ORG_ID:?Falta VERCEL_ORG_ID}"
: "${VERCEL_PROJECT_ID:?Falta VERCEL_PROJECT_ID}"
export VERCEL_ORG_ID VERCEL_PROJECT_ID

echo "▶ [1/4] Descargando configuración del entorno '$VERCEL_ENV' de Vercel"
vercel pull --yes --environment="$VERCEL_ENV" --token="$VERCEL_TOKEN"

echo "▶ [2/4] Construyendo la aplicación ($AMBIENTE)"
export APP_ENV="$AMBIENTE"
vercel build "${PROD_FLAG[@]}" --token="$VERCEL_TOKEN"

echo "▶ [3/4] Publicando el build en Vercel"
SALIDA=$(vercel deploy --prebuilt "${PROD_FLAG[@]}" --token="$VERCEL_TOKEN" \
  --meta commit="${GITHUB_SHA:-local}" --meta ambiente="$AMBIENTE")
# Sin terminal interactiva la CLI responde en JSON; con terminal, solo la URL.
URL=$(printf '%s' "$SALIDA" | node -e '
  const txt = require("fs").readFileSync(0, "utf8").trim();
  try { console.log(JSON.parse(txt).deployment.url); }
  catch { console.log(txt.split(/\s+/).filter(s => s.startsWith("https://")).pop() ?? ""); }')
[ -n "$URL" ] || { echo "✖ No se pudo obtener la URL del despliegue"; echo "$SALIDA"; exit 1; }

if [ "$AMBIENTE" = "staging" ] && [ -n "${STAGING_ALIAS:-}" ]; then
  echo "▶ Asignando alias fijo de staging: $STAGING_ALIAS"
  vercel alias set "$URL" "$STAGING_ALIAS" --token="$VERCEL_TOKEN"
fi

echo "▶ [4/4] Despliegue listo: $URL"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "url=$URL" >> "$GITHUB_OUTPUT"
fi
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "### 🚀 Despliegue $AMBIENTE" >> "$GITHUB_STEP_SUMMARY"
  echo "URL: $URL · commit \`${GITHUB_SHA:-local}\`" >> "$GITHUB_STEP_SUMMARY"
fi
