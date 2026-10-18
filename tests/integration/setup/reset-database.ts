import { Pool } from 'pg';
import { initializeTestDatabase } from './test-database';

export async function resetDatabase() {
  const pool = initializeTestDatabase();
  if (!pool) return;

  const truncateQuery = `
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `;

  try {
    await pool.query(truncateQuery);
  } catch (err: any) {
    console.warn('[RESET DATABASE WARNING]', err?.message || err);
  }
}
