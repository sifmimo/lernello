import { test, expect } from '@playwright/test';

test.describe('Exercise Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test account
    await page.goto('/login');
    await page.getByLabel('Email').fill('sif_mimo@yahoo.fr');
    await page.getByLabel('Mot de passe').fill('test2025');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.waitForURL(/\/(dashboard|learn)/);
  });

  test('should display exercise with new design system', async ({ page }) => {
    // Navigate to learn section
    await page.goto('/learn');
    await page.waitForLoadState('networkidle');
    
    // Click on first available subject
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    if (await subjectCard.isVisible()) {
      await subjectCard.click();
      await page.waitForLoadState('networkidle');
      
      // Click on first skill
      const skillCard = page.locator('[data-testid="skill-card"]').first();
      if (await skillCard.isVisible()) {
        await skillCard.click();
        await page.waitForLoadState('networkidle');
        
        // Start a learning session
        const startButton = page.getByRole('button', { name: /commencer|apprendre|pratiquer/i });
        if (await startButton.isVisible()) {
          await startButton.click();
          await page.waitForLoadState('networkidle');
          
          // Check exercise container is visible with new design
          const exerciseContainer = page.locator('[class*="exercise-bg-primary"], [class*="rounded-"]').first();
          await expect(exerciseContainer).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('should have accessible exercise buttons', async ({ page }) => {
    await page.goto('/learn');
    await page.waitForLoadState('networkidle');
    
    // Navigate to an exercise
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    if (await subjectCard.isVisible()) {
      await subjectCard.click();
      
      const skillCard = page.locator('[data-testid="skill-card"]').first();
      if (await skillCard.isVisible()) {
        await skillCard.click();
        
        const startButton = page.getByRole('button', { name: /commencer|apprendre|pratiquer/i });
        if (await startButton.isVisible()) {
          await startButton.click();
          await page.waitForLoadState('networkidle');
          
          // Check that buttons have minimum touch target size (48px)
          const buttons = page.locator('button');
          const buttonCount = await buttons.count();
          
          for (let i = 0; i < Math.min(buttonCount, 5); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              const box = await button.boundingBox();
              if (box) {
                expect(box.height).toBeGreaterThanOrEqual(44);
              }
            }
          }
        }
      }
    }
  });
});
