import test from 'node:test';
import assert from 'node:assert/strict';

// Regression: with NODE_ENV unset (`npm run server`) the backend runs in development mode,
// so the global limiter must not throttle local dashboards (their polling used to hit 429s).
test('global API limiter is skipped when NODE_ENV is unset', async () => {
  delete process.env.NODE_ENV;
  const { globalApiLimiter } = await import('../src/middlewares/limiters.ts');
  let passed = 0;
  const res: any = { setHeader() {}, status() { return res; }, json() { return res; } };
  for (let i = 0; i < 250; i++) {
    await globalApiLimiter({ originalUrl: '/api/tickets', method: 'GET', ip: '127.0.0.1' } as any, res, () => { passed++; });
  }
  assert.equal(passed, 250);
  const { redis } = await import('../src/config/redis.ts');
  if (redis.isOpen) await redis.quit();
});
