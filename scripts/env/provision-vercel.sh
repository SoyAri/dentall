#!/usr/bin/env bash
# Crea/vincula el proyecto en Vercel y carga sus variables de entorno.
# Se ejecuta UNA vez (o al recrear el entorno). Requiere:
#   - Vercel CLI (npm i -g vercel) y sesión iniciada (vercel login) o VERCEL_TOKEN
#   - SUPABASE_URL y SUPABASE_ANON_KEY exportadas en la terminal
# Uso: bash scripts/env/provision-vercel.sh [nombre-proyecto]
set -euo pipefail

PROJECT="${1:-dentall}"
TOKEN_ARG=()
[ -n "${VERCEL_TOKEN:-}" ] && TOKEN_ARG=(--token "$VERCEL_TOKEN")

: "${SUPABASE_URL:?Exporta SUPABASE_URL antes de ejecutar}"
: "${SUPABASE_ANON_KEY:?Exporta SUPABASE_ANON_KEY antes de ejecutar}"

echo "▶ Vinculando el directorio con el proyecto Vercel '$PROJECT'"
vercel link --yes --project "$PROJECT" "${TOKEN_ARG[@]}"

# Carga (o reemplaza) una variable en un entorno de Vercel.
set_env() {
  local name="$1" value="$2" target="$3"
  vercel env rm "$name" "$target" --yes "${TOKEN_ARG[@]}" >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$name" "$target" "${TOKEN_ARG[@]}" >/dev/null
  echo "  $name → $target"
}

echo "▶ Cargando variables de entorno"
for target in preview production; do
  set_env SUPABASE_URL      "$SUPABASE_URL"      "$target"
  set_env SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY" "$target"
done
set_env APP_ENV staging    preview
set_env APP_ENV production production

ORG_ID=$(node -p "require('./.vercel/project.json').orgId")
PROJECT_ID=$(node -p "require('./.vercel/project.json').projectId")

cat <<MSG

✔ Proyecto Vercel listo. Registra estos secretos en GitHub
  (Settings → Secrets and variables → Actions):
    VERCEL_ORG_ID      = $ORG_ID
    VERCEL_PROJECT_ID  = $PROJECT_ID
    VERCEL_TOKEN       = (créalo en https://vercel.com/account/tokens)
MSG
