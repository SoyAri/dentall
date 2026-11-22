#!/usr/bin/env bash
# Revierte producción al despliegue anterior en Vercel (recuperación ante fallo).
# El pipeline lo ejecuta automáticamente si fallan las pruebas post-despliegue.
#
# Uso:  bash scripts/deploy/rollback.sh [url-o-id-del-despliegue-destino]
#       Sin argumento usa el penúltimo despliegue de producción en estado READY.
# Env:  VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
set -euo pipefail

: "${VERCEL_TOKEN:?Falta VERCEL_TOKEN}"
: "${VERCEL_ORG_ID:?Falta VERCEL_ORG_ID}"
: "${VERCEL_PROJECT_ID:?Falta VERCEL_PROJECT_ID}"
export VERCEL_ORG_ID VERCEL_PROJECT_ID

DESTINO="${1:-}"

if [ -z "$DESTINO" ]; then
  echo "▶ Buscando el despliegue de producción anterior"
  vercel pull --yes --environment=production --token="$VERCEL_TOKEN" >/dev/null
  DESTINO=$(vercel list --environment production --status READY --limit 5 --json --token="$VERCEL_TOKEN" \
    | node -e '
        const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
        const lista = Array.isArray(data) ? data : (data.deployments ?? []);
        const anterior = lista[1];               // [0] = despliegue actual (fallido)
        if (!anterior) process.exit(1);
        console.log(anterior.url.startsWith("http") ? anterior.url : "https://" + anterior.url);
      ') || { echo "✖ No hay un despliegue de producción anterior al cual volver"; exit 1; }
fi

echo "▶ Revirtiendo producción a: $DESTINO"
vercel rollback "$DESTINO" --yes --timeout=5m --token="$VERCEL_TOKEN"

echo "✔ Rollback completado"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "### ⏪ Rollback de producción ejecutado → $DESTINO" >> "$GITHUB_STEP_SUMMARY"
fi
