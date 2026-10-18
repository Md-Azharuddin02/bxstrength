import { closeTestDatabase } from './test-database';

export async function cleanupIntegrationEnvironment() {
  await closeTestDatabase();
}
