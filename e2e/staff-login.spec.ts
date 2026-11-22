import { test, expect } from '@playwright/test';

// Flujo con sesión de staff. SOLO LECTURA: staging y producción comparten la
// base de datos Supabase, así que estas pruebas no crean ni modifican datos.
const email = process.env.E2E_STAFF_EMAIL;
const password = process.env.E2E_STAFF_PASSWORD;

test.describe('Entorno de liberación · sesión de staff', () => {
  test.skip(!email || !password, 'Requiere E2E_STAFF_EMAIL y E2E_STAFF_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login/equipo');
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole('button', { name: /Entrar al sistema/ }).click();
    await expect(page).toHaveURL(/\/consultorio$/, { timeout: 15_000 });
  });

  test('inicia sesión y carga el dashboard con la agenda de hoy', async ({ page }) => {
    await expect(page.locator('h1.page__title')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agenda de hoy' })).toBeVisible();
  });

  test('navega a la agenda (calendario de citas)', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page.locator('h1.page__title')).toHaveText(/Mi Agenda|Gestión de Citas/);
  });

  test('navega al directorio de pacientes', async ({ page }) => {
    await page.goto('/pacientes');
    await expect(page.locator('h1.page__title')).toHaveText(/Mis Pacientes|Directorio de Pacientes/);
  });

  test('con sesión activa, /login/equipo redirige al dashboard', async ({ page }) => {
    await page.goto('/login/equipo');
    await expect(page).toHaveURL(/\/consultorio$/);
  });
});
