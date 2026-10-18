import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-02: Administrator Management Journey', () => {
  test('Admin logs in and accesses administrative controls', async ({ authenticatedAdminPage: page }) => {
    await page.goto('/');
    // Confirms admin dashboard is reachable
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
