import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let testPool: Pool | null = null;

export function initializeTestDatabase(): Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }

  // Safety check: prevent connecting to non-test databases
  if (dbUrl.includes('prod') || (!dbUrl.includes('test') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1'))) {
    throw new Error(`CRITICAL DB SAFETY: Attempted to initialize test database with URL: ${dbUrl}`);
  }

  if (!testPool) {
    testPool = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 3000,
    });
  }

  return testPool;
}

export async function migrateTestSchema(pool: Pool) {
  if (!pool) return;
  const schemaPath = path.resolve(process.cwd(), 'db_schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
  }
}

export async function closeTestDatabase() {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}
