import { test, expect } from '@playwright/test';

test.describe('Dashboard Pages', () => {
  test('achievements page should be accessible', async ({ page }) => {
    await page.goto('/achievements');
    await expect(page).toHaveURL(/login|achievements/);
  });

  test('settings page should be accessible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/login|settings/);
  });

  test('parent dashboard should be accessible', async ({ page }) => {
    await page.goto('/parent');
    await expect(page).toHaveURL(/login|parent/);
  });

  test('profiles page should be accessible', async ({ page }) => {
    await page.goto('/profiles');
    await expect(page).toHaveURL(/login|profiles/);
  });
});

test.describe('Navigation', () => {
  test('login page should have proper navigation links', async ({ page }) => {
    await page.goto('/login');
    
    const logo = page.getByRole('link', { name: /Lernello/i });
    await expect(logo).toBeVisible();
  });

  test('register page should have proper navigation', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByRole('link', { name: /Se connecter/i })).toBeVisible();
  });
});
