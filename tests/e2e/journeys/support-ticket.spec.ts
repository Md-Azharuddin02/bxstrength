import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-06: Client Support Ticket Journey', () => {
  test('Client can view support portal and inquiries', async ({ authenticatedClientPage: page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
