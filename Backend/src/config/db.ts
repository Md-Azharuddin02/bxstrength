import { Pool } from 'pg';
import './env.ts';

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
  dbUrl = dbUrl
    .replace(/[?&]channel_binding=[^&]+/g, '')
    .replace('sslmode=require', 'sslmode=verify-full');
}

const isLocalDb =
  /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(dbUrl) ||
  /[?&]sslmode=disable/.test(dbUrl);

export const dbPool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: dbUrl,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    max: 25,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  })
  : null;
