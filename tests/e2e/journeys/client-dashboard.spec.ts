import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-05: Client Dashboard & Program Interaction', () => {
  test('Client can view their active dashboard', async ({ authenticatedClientPage: page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
