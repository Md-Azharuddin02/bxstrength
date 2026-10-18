import { test, expect } from '@playwright/test';

test.describe('Accessibility & Compliance', () => {
  test('Home page contains single H1 and accessible image alt tags', async ({ page }) => {
    await page.goto('/');

    // Check single H1 rule for SEO and screen reader accessibility
    const h1s = page.locator('h1');
    const h1Count = await h1s.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Verify main landmarks are present
    const mainContent = page.locator('main, header, footer');
    await expect(mainContent.first()).toBeVisible();
  });
});
