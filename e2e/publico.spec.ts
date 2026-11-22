import { test, expect } from '@playwright/test';

// Pruebas sin sesión: validan que el despliegue sirve la app correctamente.
const esVercel = !/localhost|127\.0\.0\.1/.test(process.env.BASE_URL ?? 'http://localhost');

test.describe('Entorno de liberación · páginas públicas', () => {
  test('la landing responde 200 y muestra la marca', async ({ page }) => {
    const resp = await page.goto('/');
    expect(resp?.status()).toBe(200);
    await expect(page).toHaveTitle(/DENTall/i);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('la landing carga en menos de 3 s (SLO de carga)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    const ms = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return nav.loadEventEnd - nav.startTime;
    });
    test.info().annotations.push({ type: 'tiempo-carga-ms', description: String(Math.round(ms)) });
    expect(ms).toBeLessThan(3000);
  });

  test('login del equipo médico renderiza el formulario', async ({ page }) => {
    await page.goto('/login/equipo');
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar al sistema/ })).toBeDisabled();
  });

  test('login del paciente renderiza la captura de número', async ({ page }) => {
    await page.goto('/login/paciente');
    await expect(page.getByRole('heading', { name: /Ingresa tu número/ })).toBeVisible();
  });

  for (const ruta of ['/consultorio', '/agenda', '/pacientes', '/configuracion']) {
    test(`ruta protegida ${ruta} redirige al login sin sesión`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/login\/equipo$/);
    });
  }

  test('enlace profundo (deep link) no devuelve 404 gracias al rewrite SPA', async ({ request }) => {
    const resp = await request.get('/pacientes/123/historial');
    expect(resp.status()).toBe(200);
    expect(await resp.text()).toContain('<app-root>');
  });

  test('la landing no genera errores de JavaScript', async ({ page }) => {
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(errores).toEqual([]);
  });

  test('cabeceras de seguridad y caché configuradas en Vercel', async ({ request }) => {
    test.skip(!esVercel, 'Solo aplica al entorno desplegado en Vercel');
    const resp = await request.get('/');
    const h = resp.headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['strict-transport-security']).toContain('max-age=');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');

    const html = await resp.text();
    const js = html.match(/src="(main-[A-Z0-9]+\.js)"/i)?.[1];
    expect(js, 'no se encontró el bundle main-*.js').toBeTruthy();
    const asset = await request.get('/' + js);
    expect(asset.headers()['cache-control']).toContain('immutable');
  });
});
