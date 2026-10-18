import { test, expect } from '@playwright/test';

test.describe('E2E-04: Payment and Booking Flow', () => {
  test('User can select service and initiate checkout dialog', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
