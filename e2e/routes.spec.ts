import { test, expect } from '@playwright/test';

test.describe('Routes principales', () => {
  test('la page login est accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Lernello/);
    await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible();
    await expect(page.getByPlaceholder(/parent@exemple.com/i)).toBeVisible();
  });

  test('la page register est accessible', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/Lernello/);
    await expect(page.getByRole('heading', { name: /Créer un compte/i })).toBeVisible();
  });

  test('les routes protégées redirigent vers login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/learn');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/parent');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/achievements');
    await expect(page).toHaveURL(/\/login/);
  });

  test('le formulaire de connexion fonctionne', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder(/parent@exemple.com/i);
    const passwordInput = page.getByPlaceholder(/••••••••/i);
    const submitButton = page.getByRole('button', { name: /Se connecter/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('la navigation vers register fonctionne', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Créer un compte/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Page d\'accueil', () => {
  test('la page d\'accueil est accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Lernello/);
  });
});
