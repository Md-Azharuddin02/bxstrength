import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import express from 'express';
import type { AddressInfo } from 'net';
import { JWT_SECRET } from '../src/config/env';
import { redis } from '../src/config/redis';
import { authenticate, requireRefreshSession } from '../src/middlewares/authMiddleware';
import apiGuard from '../src/middlewares/apiGuard';
import { resetPassword } from '../src/controllers/authController';
import {
  startSession, verifyAccessToken, verifyRefreshToken, revokeToken, revokeAllSessions,
  createPasswordResetToken, consumePasswordResetToken
} from '../src/services/tokenService';

// these tests need a running Redis, see REDIS_URL in the test script
before(async () => {
  for (let i = 0; i < 100 && !redis.isReady; i++) {
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  assert.ok(redis.isReady, 'Redis is not reachable');
});
after(() => redis.quit());

const fakeRes = () => {
  const res: any = { statusCode: 200, body: null };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: any) => { res.body = body; return res; };
  return res;
};

const fakeCookieRes = () => {
  const res = fakeRes();
  res.cookies = {} as Record<string, string>;
  res.cookie = (name: string, value: string) => { res.cookies[name] = value; return res; };
  res.clearCookie = (name: string) => { delete res.cookies[name]; return res; };
  return res;
};

const user = (id: string) => ({ id, email: `${id}@example.com`, role: 'client', name: 'Test User' });
const newUserId = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const runAuth = async (authorization?: string) => {
  const req: any = { headers: authorization ? { authorization } : {} };
  const res = fakeRes();
  let passed = false;
  await authenticate(req, res, () => { passed = true; });
  return { req, res, passed };
};

const runRefreshGuard = async (refreshToken?: string, csrf?: string) => {
  const req: any = { headers: { ...(refreshToken ? { cookie: `bx_refresh=${refreshToken}` } : {}), ...(csrf ? { 'x-csrf-token': csrf } : {}) } };
  const res = fakeRes();
  let passed = false;
  await requireRefreshSession(req, res, () => { passed = true; });
  return { req, res, passed };
};

test('request without a token is rejected', async () => {
  const { res, passed } = await runAuth();
  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

test('request with a bad token is rejected', async () => {
  const { res, passed } = await runAuth('Bearer not-a-real-token');
  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

test('access token passes and sets req.user', async () => {
  const token = startSession(fakeCookieRes(), user(newUserId()));
  const { req, passed } = await runAuth(`Bearer ${token}`);
  assert.equal(passed, true);
  assert.equal(req.user.role, 'client');
});

test('access token lives 15 minutes', () => {
  const payload = verifyAccessToken(startSession(fakeCookieRes(), user(newUserId())))!;
  assert.equal(payload.exp - payload.iat, 15 * 60);
});

test('a token without the access type is rejected', async () => {
  const token = jwt.sign({ id: 'u1', email: 'a@b.com', role: 'admin' }, JWT_SECRET);
  const { res, passed } = await runAuth(`Bearer ${token}`);
  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

test('refresh token cannot be used as an access token', async () => {
  const res = fakeCookieRes();
  startSession(res, user(newUserId()));
  const result = await runAuth(`Bearer ${res.cookies.bx_refresh}`);
  assert.equal(result.passed, false);
  assert.equal(result.res.statusCode, 401);
});

test('revoked access token is rejected', async () => {
  const token = startSession(fakeCookieRes(), user(newUserId()));
  assert.equal(await revokeToken(verifyAccessToken(token)!), true);
  const { res, passed } = await runAuth(`Bearer ${token}`);
  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

test('revoking all sessions kills the access and refresh tokens of that user only', async () => {
  const id = newUserId();
  const res = fakeCookieRes();
  const token = startSession(res, user(id));
  const otherToken = startSession(fakeCookieRes(), user(newUserId()));

  await revokeAllSessions(id);

  assert.equal((await runAuth(`Bearer ${token}`)).res.statusCode, 401);
  assert.equal((await runRefreshGuard(res.cookies.bx_refresh, res.cookies.bx_csrf)).res.statusCode, 401);
  assert.equal((await runAuth(`Bearer ${otherToken}`)).passed, true);
});

test('refresh needs the cookie and the matching csrf header', async () => {
  const res = fakeCookieRes();
  startSession(res, user(newUserId()));
  const other = fakeCookieRes();
  startSession(other, user(newUserId()));

  assert.equal((await runRefreshGuard(undefined, res.cookies.bx_csrf)).res.statusCode, 401);
  assert.equal((await runRefreshGuard(res.cookies.bx_refresh)).res.statusCode, 403);
  assert.equal((await runRefreshGuard(res.cookies.bx_refresh, other.cookies.bx_csrf)).res.statusCode, 403);
  assert.equal((await runRefreshGuard(res.cookies.bx_refresh, res.cookies.bx_csrf)).passed, true);
});

test('a refresh token works once', async () => {
  const res = fakeCookieRes();
  startSession(res, user(newUserId()));
  const payload = verifyRefreshToken(res.cookies.bx_refresh)!;

  assert.equal(await revokeToken(payload), true);
  assert.equal(await revokeToken(payload), false);
  assert.equal((await runRefreshGuard(res.cookies.bx_refresh, res.cookies.bx_csrf)).res.statusCode, 401);
});

test('revoked token is kept in redis only until it would have expired', async () => {
  const payload = verifyAccessToken(startSession(fakeCookieRes(), user(newUserId())))!;
  await revokeToken(payload);
  const ttl = await redis.ttl(`auth:revoked:${payload.jti}`);
  assert.ok(ttl > 0 && ttl <= 15 * 60);
});

test('password reset token is single use and expires in 10 minutes', async () => {
  const token = await createPasswordResetToken('reset@example.com');
  const keys = await redis.keys('auth:pwreset:*');
  const ttls = await Promise.all(keys.map(k => redis.ttl(k)));
  assert.ok(ttls.every(t => t > 0 && t <= 10 * 60));
  assert.ok(!keys.some(k => k.includes(token)), 'the raw token must not be stored');

  assert.equal(await consumePasswordResetToken(token), 'reset@example.com');
  assert.equal(await consumePasswordResetToken(token), null);
  assert.equal(await consumePasswordResetToken('made-up-token'), null);
});

test('reset password needs a token, email alone is not enough', async () => {
  const res = fakeRes();
  await resetPassword({ body: { email: 'a@b.com', newPassword: 'secret123' } } as any, res);
  assert.equal(res.statusCode, 400);
});

test('reset password rejects a login token', async () => {
  const token = startSession(fakeCookieRes(), user(newUserId()));
  const res = fakeRes();
  await resetPassword({ body: { token, newPassword: 'secret123' } } as any, res);
  assert.equal(res.statusCode, 400);
});

// --- api guard: the access rules for every /api route

const startGuardedApp = async () => {
  const app = express();
  app.use('/api', apiGuard);
  app.use((_req, res) => { res.json({ reached: true }); });
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  return { server, base };
};

const tokenFor = (role: string, id = newUserId()) => startSession(fakeCookieRes(), { ...user(id), role });
const call = (base: string, method: string, path: string, token?: string) =>
  fetch(base + path, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.status);

test('protected routes reject a request without a token', async () => {
  const { server, base } = await startGuardedApp();
  try {
    for (const [method, path] of [
      ['GET', '/users'], ['POST', '/users'], ['DELETE', '/users/u1'], ['POST', '/trainers'], ['GET', '/tickets'],
      ['GET', '/workout-programs'], ['POST', '/nutrition-plans'], ['GET', '/coach-assignments'], ['DELETE', '/audit-logs'],
      ['POST', '/announcements'], ['GET', '/subscriptions'], ['POST', '/classes'], ['GET', '/admin/journey/bookings'],
      ['POST', '/email/test'], ['GET', '/route-that-does-not-exist']
    ]) {
      assert.equal(await call(base, method, path), 401, `${method} ${path}`);
    }
  } finally {
    server.close();
  }
});

test('public routes stay open', async () => {
  const { server, base } = await startGuardedApp();
  try {
    for (const [method, path] of [
      ['GET', '/health'], ['GET', '/trainers'], ['GET', '/classes'], ['GET', '/reviews'], ['POST', '/enquiries'],
      ['POST', '/consultations'], ['POST', '/journey/initiate'], ['POST', '/webhooks/razorpay'], ['POST', '/auth/login']
    ]) {
      assert.equal(await call(base, method, path), 200, `${method} ${path}`);
    }
  } finally {
    server.close();
  }
});

test('roles decide what a logged in user can reach', async () => {
  const { server, base } = await startGuardedApp();
  const client = tokenFor('client');
  const coach = tokenFor('coach');
  const support = tokenFor('customer_support');
  const admin = tokenFor('admin');
  try {
    assert.equal(await call(base, 'GET', '/users', client), 403);
    assert.equal(await call(base, 'GET', '/users', support), 200);
    assert.equal(await call(base, 'POST', '/users', coach), 403);
    assert.equal(await call(base, 'POST', '/users', admin), 200);
    assert.equal(await call(base, 'DELETE', '/users/u1', coach), 403);
    assert.equal(await call(base, 'POST', '/workout-programs', client), 403);
    assert.equal(await call(base, 'POST', '/workout-programs', coach), 200);
    assert.equal(await call(base, 'GET', '/workout-programs', client), 200);
    assert.equal(await call(base, 'PATCH', '/tickets/t1', support), 200);
    assert.equal(await call(base, 'PATCH', '/tickets/t1', client), 403);
    assert.equal(await call(base, 'DELETE', '/audit-logs', coach), 403);
    assert.equal(await call(base, 'DELETE', '/audit-logs', admin), 200);
    assert.equal(await call(base, 'GET', '/admin/purge-reviews', coach), 403);
  } finally {
    server.close();
  }
});

test('a customer can only list their own tickets and notifications', async () => {
  const { server, base } = await startGuardedApp();
  const id = newUserId();
  const client = tokenFor('client', id);
  const support = tokenFor('support');
  try {
    assert.equal(await call(base, 'GET', '/tickets', client), 403);
    assert.equal(await call(base, 'GET', `/tickets?userId=${id}`, client), 200);
    assert.equal(await call(base, 'GET', `/tickets?userId=someone-else&userEmail=${id}@example.com`, client), 403);
    assert.equal(await call(base, 'GET', '/tickets', support), 200);
    assert.equal(await call(base, 'GET', `/notifications?email=${id}@example.com`, client), 200);
    assert.equal(await call(base, 'GET', '/notifications?email=other@example.com', client), 403);
    assert.equal(await call(base, 'GET', '/notifications', client), 403);
  } finally {
    server.close();
  }
});
