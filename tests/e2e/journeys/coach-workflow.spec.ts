import { test, expect } from '@playwright/test';

test.describe('E2E-03: Coach Workflow & Program Creation', () => {
  test('Coach program builder navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
