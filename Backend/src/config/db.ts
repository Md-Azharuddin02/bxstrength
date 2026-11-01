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
    max: 20,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  })
  : null;

if (dbPool) {
  dbPool.on('error', (err: any) => {
    // Avoid unhandled errors on idle sockets terminated by serverless host
    console.warn('[DB POOL] Client socket closed or idle error:', err?.message || err);
  });

  const originalQuery = dbPool.query.bind(dbPool);
  (dbPool as any).query = async function (textOrConfig: any, values?: any, callback?: any) {
    if (typeof values === 'function') {
      callback = values;
      values = undefined;
    }
    if (typeof callback === 'function') {
      return (originalQuery as any)(textOrConfig, values, callback);
    }

    let attempts = 0;
    while (attempts < 2) {
      try {
        return await (originalQuery as any)(textOrConfig, values);
      } catch (err: any) {
        attempts++;
        const msg = String(err?.message || '').toLowerCase();
        const isConnectionError =
          msg.includes('connection terminated') ||
          msg.includes('connection timeout') ||
          msg.includes('connection reset') ||
          msg.includes('closed the connection') ||
          msg.includes('socket has been ended') ||
          msg.includes('econnreset') ||
          msg.includes('econnrefused') ||
          msg.includes('timeout expired') ||
          err?.code === '57P01' ||
          err?.code === '57P02' ||
          err?.code === '57P03' ||
          err?.code === '08006' ||
          err?.code === '08001';

        if (isConnectionError && attempts < 2) {
          console.warn(`[DB POOL] Auto-reconnecting on transient error: "${err.message}". Retrying query...`);
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        throw err;
      }
    }
  };

  // Keep Neon serverless database warm and active to prevent idle connection termination
  const DB_HEARTBEAT_INTERVAL_MS = 45 * 1000;
  setInterval(async () => {
    try {
      await dbPool.query('SELECT 1');
    } catch (err: any) {
      // Reconnection handled automatically by query wrapper
    }
  }, DB_HEARTBEAT_INTERVAL_MS);
}
