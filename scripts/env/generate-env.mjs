#!/usr/bin/env node
/**
 * Genera src/environments/environment.ts a partir de variables de entorno.
 *
 * Variables:
 *   SUPABASE_URL       URL del proyecto Supabase            (obligatoria en CI)
 *   SUPABASE_ANON_KEY  clave pública "anon" de Supabase      (obligatoria en CI)
 *   APP_ENV            staging | production                 (default: production)
 *
 * En local, si no hay variables, conserva el archivo ya versionado.
 * En CI (CI=true) falla si faltan, para no desplegar con una configuración incorrecta.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { SUPABASE_URL, SUPABASE_ANON_KEY, APP_ENV = 'production', CI } = process.env;
const target = resolve('src/environments/environment.ts');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (CI) {
    console.error('✖ Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY en el entorno de CI.');
    process.exit(1);
  }
  console.log('ℹ Sin variables de Supabase: se conserva src/environments/environment.ts versionado.');
  process.exit(0);
}

if (!['staging', 'production'].includes(APP_ENV)) {
  console.error(`✖ APP_ENV inválido: "${APP_ENV}" (usa staging o production).`);
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SUPABASE_URL)) {
  console.error('✖ SUPABASE_URL no tiene el formato https://<ref>.supabase.co');
  process.exit(1);
}

const contenido = `// ARCHIVO GENERADO por scripts/env/generate-env.mjs (APP_ENV=${APP_ENV}).
// No editar a mano en CI: los valores vienen de los secretos del pipeline.
export const environment = {
  production: true,
  appEnv: '${APP_ENV}',
  supabase: {
    url: '${SUPABASE_URL.replace(/\/$/, '')}',
    key: '${SUPABASE_ANON_KEY}'
  },
  otpBypass: false,
  otpBypassPhone: '',
  otpBypassCode: ''
};
`;

writeFileSync(target, contenido);
console.log(`✔ environment.ts generado para APP_ENV=${APP_ENV}`);
