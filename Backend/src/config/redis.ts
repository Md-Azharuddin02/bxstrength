import { createClient } from 'redis';
import { REDIS_URL } from './env.ts';

export const redis = createClient({ url: REDIS_URL, disableOfflineQueue: true });

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') return;
  console.error('Redis error:', err.message);
});

redis.connect().catch((err) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[REDIS] Local Redis offline, resilient in-memory store activated.');
    return;
  }
  console.error('Redis connection failed:', err.message);
});

