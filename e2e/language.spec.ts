import { test, expect } from '@playwright/test';

test.describe('Language Support', () => {
  test('login page should be in French by default', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText('Connexion')).toBeVisible();
    await expect(page.getByText('Se connecter')).toBeVisible();
  });

  test('register page should be in French', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByText('Créer un compte')).toBeVisible();
  });

  test('forgot password page should be in French', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await expect(page.getByText(/mot de passe/i)).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('login page should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('login page should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('login page should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });
});
