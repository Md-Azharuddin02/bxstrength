import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.ts';

interface LeakyBucketOptions {
  keyPrefix: string; 
  capacity: number; 
  windowMs: number;
  message: object;
  skip?: (req: Request) => boolean;
}

const LEAKY_BUCKET_LUA = `
local capacity = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local leakPerMs = capacity / windowMs
local data = redis.call('HMGET', KEYS[1], 'level', 'last')
local level = tonumber(data[1]) or 0
local last = tonumber(data[2]) or now
level = math.max(0, level - (now - last) * leakPerMs)
local allowed = 0
local retryMs = 0
if level + 1 > capacity then
  retryMs = math.ceil((level + 1 - capacity) / leakPerMs)
else
  level = level + 1
  allowed = 1
end
redis.call('HSET', KEYS[1], 'level', level, 'last', now)
redis.call('PEXPIRE', KEYS[1], windowMs)
return {allowed, math.floor(capacity - level), retryMs}
`;

export function leakyBucket({ keyPrefix, capacity, windowMs, message, skip }: LeakyBucketOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (skip?.(req)) return next();

    const key = `rl:${keyPrefix}:${req.ip || 'unknown'}`;
    let allowed = 1;
    let remaining = capacity - 1;
    let retryMs = 0;
    try {
      const [a, rem, retry] = (await redis.eval(LEAKY_BUCKET_LUA, {
        keys: [key],
        arguments: [String(capacity), String(windowMs), String(Date.now())]
      })) as [number, number, number];
      allowed = a;
      remaining = rem;
      retryMs = retry;
    } catch (err) {
      // Redis unavailable: fail open so a limiter outage cannot lock everyone out.
      console.error(`Rate limiter (${keyPrefix}) unavailable, allowing request:`, (err as Error).message);
      return next();
    }

    res.setHeader('RateLimit-Limit', String(capacity));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, remaining)));
    if (!allowed) {
      res.setHeader('Retry-After', String(Math.ceil(retryMs / 1000)));
      return res.status(429).json(message);
    }
    next();
  };
}

export const authLimiter = leakyBucket({
  keyPrefix: 'auth',
  capacity: 20,
  windowMs: 15 * 60 * 1000,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

export const emailLimiter = leakyBucket({
  keyPrefix: 'email',
  capacity: 10,
  windowMs: 60 * 60 * 1000,
  message: { error: 'Too many email requests. Please try again later.' }
});
