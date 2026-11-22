#!/usr/bin/env node
/**
 * Healthcheck del entorno de liberación (staging o producción).
 *
 * Mide disponibilidad y latencia de las rutas clave de la SPA, de un bundle
 * estático y del servicio de autenticación de Supabase. Compara contra los
 * SLO acordados y termina con código 1 si alguno se incumple.
 *
 * Uso:  node scripts/test/healthcheck.mjs <url-base>
 * Env:  SUPABASE_URL, SUPABASE_ANON_KEY       (opcional: verifica el backend)
 *       VERCEL_AUTOMATION_BYPASS_SECRET       (opcional: previews protegidos)
 *       SLO_LATENCIA_MS   (default 800)  latencia máxima p95 por ruta
 *       MUESTRAS          (default 5)    peticiones por ruta
 *       HEALTHCHECK_JSON  (opcional)     ruta donde guardar el resultado en JSON
 */
import { writeFileSync, appendFileSync } from 'node:fs';

const base = (process.argv[2] ?? process.env.BASE_URL ?? '').replace(/\/$/, '');
if (!base) {
  console.error('Uso: node scripts/test/healthcheck.mjs <url-base>');
  process.exit(2);
}

const SLO_LATENCIA_MS = Number(process.env.SLO_LATENCIA_MS ?? 800);
const MUESTRAS = Number(process.env.MUESTRAS ?? 5);
const headers = {};
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

const p95 = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)];
};

async function medir(nombre, url, opciones = {}, validar = (r) => r.ok) {
  const tiempos = [];
  let fallos = 0;
  let estado = 0;
  for (let i = 0; i < MUESTRAS; i++) {
    const t0 = performance.now();
    try {
      const r = await fetch(url, { headers: { ...headers, ...opciones.headers }, redirect: 'follow' });
      await r.arrayBuffer();
      estado = r.status;
      if (!validar(r)) fallos++;
    } catch {
      fallos++;
    }
    tiempos.push(performance.now() - t0);
  }
  const resultado = {
    nombre,
    url,
    estado,
    disponibilidad: Number((((MUESTRAS - fallos) / MUESTRAS) * 100).toFixed(1)),
    latencia_p95_ms: Math.round(p95(tiempos)),
    latencia_prom_ms: Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length),
  };
  resultado.cumple = fallos === 0 && resultado.latencia_p95_ms <= SLO_LATENCIA_MS;
  return resultado;
}

const checks = [];
for (const ruta of ['/', '/login/equipo', '/login/paciente', '/pacientes']) {
  checks.push(await medir(`ruta ${ruta}`, base + ruta));
}

// Bundle principal: confirma que los estáticos se sirven desde el CDN.
try {
  const html = await (await fetch(base + '/', { headers })).text();
  const main = html.match(/src="(main-[A-Z0-9]+\.js)"/i)?.[1];
  if (main) checks.push(await medir('bundle main.js', `${base}/${main}`));
  else checks.push({ nombre: 'bundle main.js', url: base, cumple: false, error: 'no se encontró main-*.js' });
} catch (e) {
  checks.push({ nombre: 'bundle main.js', url: base, cumple: false, error: String(e) });
}

// Backend: servicio de autenticación de Supabase.
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  const sb = process.env.SUPABASE_URL.replace(/\/$/, '');
  checks.push(
    await medir('supabase auth', `${sb}/auth/v1/health`, { headers: { apikey: process.env.SUPABASE_ANON_KEY } }),
  );
}

const resumen = {
  fecha: new Date().toISOString(),
  base,
  slo_latencia_ms: SLO_LATENCIA_MS,
  muestras_por_check: MUESTRAS,
  disponibilidad_global: Number(
    (checks.reduce((a, c) => a + (c.disponibilidad ?? 0), 0) / checks.length).toFixed(2),
  ),
  cumple_slo: checks.every((c) => c.cumple),
  checks,
};

console.table(
  checks.map((c) => ({
    check: c.nombre,
    estado: c.estado ?? '-',
    'disp. %': c.disponibilidad ?? 0,
    'p95 ms': c.latencia_p95_ms ?? '-',
    'prom ms': c.latencia_prom_ms ?? '-',
    SLO: c.cumple ? 'OK' : 'FALLA',
  })),
);
console.log(JSON.stringify({ disponibilidad_global: resumen.disponibilidad_global, cumple_slo: resumen.cumple_slo }));

if (process.env.HEALTHCHECK_JSON) writeFileSync(process.env.HEALTHCHECK_JSON, JSON.stringify(resumen, null, 2));

// Resumen visible en la página del job de GitHub Actions.
if (process.env.GITHUB_STEP_SUMMARY) {
  const filas = checks
    .map(
      (c) =>
        `| ${c.nombre} | ${c.estado ?? '-'} | ${c.disponibilidad ?? 0} % | ${c.latencia_p95_ms ?? '-'} ms | ${c.latencia_prom_ms ?? '-'} ms | ${c.cumple ? '✅' : '❌'} |`,
    )
    .join('\n');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Healthcheck · ${base}\n\nSLO de latencia p95: ${SLO_LATENCIA_MS} ms · ${MUESTRAS} muestras por check\n\n` +
      `| Check | HTTP | Disponibilidad | p95 | Promedio | SLO |\n|---|---|---|---|---|---|\n${filas}\n\n` +
      `**Disponibilidad global:** ${resumen.disponibilidad_global} % · **Cumple SLO:** ${resumen.cumple_slo ? 'sí' : 'no'}\n`,
  );
}

process.exit(resumen.cumple_slo ? 0 : 1);
