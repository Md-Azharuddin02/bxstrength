import { Pool } from 'pg';
import { dbPool } from '../../server';

export function getTestPool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }

  // Safety check: Ensure test database does NOT run against production
  if (dbUrl.includes('prod') || (!dbUrl.includes('test') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1'))) {
    throw new Error(`CRITICAL SAFETY ERROR: Attempted to run tests against suspected non-test database URL: ${dbUrl}`);
  }

  return dbPool;
}

export async function resetTestDatabaseTables(pool: Pool) {
  if (!pool) return;
  const tables = [
    'audit_logs',
    'otps',
    'notifications',
    'support_tickets',
    'payment_transactions',
    'bookings',
    'subscriptions',
    'workout_plans',
    'nutrition_plans',
    'reviews',
    'enquiries',
  ];

  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE;`);
    } catch {
      // Table may not exist in minimal environments
    }
  }
}
