import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas E2E del entorno de liberación.
 *
 *  BASE_URL                         URL a probar (preview de staging o producción).
 *                                   Si no se define, levanta `npm start` en localhost:4200.
 *  VERCEL_AUTOMATION_BYPASS_SECRET  Salta la "Deployment Protection" de los previews de Vercel.
 *  E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD  Cuenta de staff para las pruebas con sesión.
 */
const baseURL = process.env.BASE_URL ?? 'http://localhost:4200';
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: bypass
      ? { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' }
      : undefined,
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true, timeout: 120_000 },
});
