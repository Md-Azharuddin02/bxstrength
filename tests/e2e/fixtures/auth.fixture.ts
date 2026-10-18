import { test as base, Page } from '@playwright/test';
import { e2eUsers } from './test-users.fixture';

type AuthFixtures = {
  authenticatedAdminPage: Page;
  authenticatedClientPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedAdminPage: async ({ page }, use) => {
    await page.goto('/');
    // Set localStorage auth state directly for fast isolated E2E execution
    await page.evaluate((admin) => {
      localStorage.setItem('velocity_user', JSON.stringify({
        id: 'admin-e2e-1',
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isVerified: true,
      }));
      localStorage.setItem('velocity_jwt_token', 'mock_admin_token_e2e');
    }, e2eUsers.admin);

    await page.reload();
    await use(page);
  },

  authenticatedClientPage: async ({ page }, use) => {
    await page.goto('/');
    await page.evaluate((client) => {
      localStorage.setItem('velocity_user', JSON.stringify({
        id: 'client-e2e-1',
        name: client.name,
        email: client.email,
        role: client.role,
        isVerified: true,
      }));
      localStorage.setItem('velocity_jwt_token', 'mock_client_token_e2e');
    }, e2eUsers.client);

    await page.reload();
    await use(page);
  },
});

export { expect } from '@playwright/test';
