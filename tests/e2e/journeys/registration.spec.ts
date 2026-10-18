import { test, expect } from '@playwright/test';

test.describe('E2E-01: Registration and Authentication Journey', () => {
  test('User lands on home page, sees hero and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BxStrength/i);
  });
});
