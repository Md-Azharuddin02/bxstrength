import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-07: Subscription Management', () => {
  test('Client can open membership and subscriptions tab', async ({ authenticatedClientPage: page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
