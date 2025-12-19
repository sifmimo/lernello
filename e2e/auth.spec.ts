import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
  });

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirmer le mot de passe')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email').fill('invalid@test.com');
    await page.getByLabel('Mot de passe').fill('wrongpassword');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    
    await expect(page.getByText(/Invalid|Erreur|incorrect/i)).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated users from learn', async ({ page }) => {
    await page.goto('/learn');
    await expect(page).toHaveURL(/login/);
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login');
    
    const forgotLink = page.getByRole('link', { name: /oublié/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('link', { name: /Créer un compte/i }).click();
    await expect(page).toHaveURL(/register/);
    
    await page.getByRole('link', { name: /Se connecter/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});
