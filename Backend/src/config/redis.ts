import { createClient } from 'redis';
import { REDIS_URL } from './env.ts';

export const redis = createClient({ url: REDIS_URL, disableOfflineQueue: true });

redis.on('error', (err) => console.error('Redis error:', err.message));
redis.connect().catch((err) => console.error('Redis connection failed:', err.message));
