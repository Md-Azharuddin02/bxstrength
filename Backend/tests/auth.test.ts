import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import express from 'express';
import type { AddressInfo } from 'net';
import { JWT_SECRET } from '../src/config/env';
import { redis } from '../src/config/redis';
import { authenticate, requireRefreshSession } from '../src/middlewares/authMiddleware';
import apiGuard from '../src/middlewares/apiGuard';
import { requireCoachOwnsBooking } from '../src/middlewares/paidBookingAccess';
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
  app.use(express.json());
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
      ['POST', '/email/test'], ['POST', '/journey/verify-payment'], ['GET', '/journey/booking/BXSC12345'],
      ['POST', '/payments/create-intent'], ['POST', '/payments/verify'], ['POST', '/journey/initiate'],
      ['POST', '/journey/create-checkout-intent'], ['GET', '/journey/latest-by-email/client%40example.com'],
      ['GET', '/route-that-does-not-exist']
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
      ['POST', '/consultations'], ['POST', '/webhooks/razorpay'], ['POST', '/auth/login']
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
    assert.equal(await call(base, 'POST', '/payments/create-intent', client), 200);
    assert.equal(await call(base, 'POST', '/payments/verify', client), 200);
    assert.equal(await call(base, 'POST', '/journey/initiate', client), 200);
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

test('paid bookings reject every method without a token', async () => {
  const { server, base } = await startGuardedApp();
  try {
    for (const [method, path] of [
      ['GET', '/paid-bookings'], ['GET', '/paid-bookings?email=client%40example.com'], ['POST', '/paid-bookings'],
      ['PATCH', '/paid-bookings/b1/assign'], ['PATCH', '/paid-bookings/b1/session'], ['DELETE', '/paid-bookings/b1']
    ]) {
      assert.equal(await call(base, method, path), 401, `${method} ${path}`);
    }
  } finally {
    server.close();
  }
});

test('paid booking lists are limited by role', async () => {
  const { server, base } = await startGuardedApp();
  const clientId = newUserId();
  const coachId = newUserId();
  const client = tokenFor('client', clientId);
  const coach = tokenFor('coach', coachId);
  try {
    assert.equal(await call(base, 'GET', `/paid-bookings?email=${clientId}%40example.com`, client), 200);
    assert.equal(await call(base, 'GET', `/paid-bookings?email=${clientId.toUpperCase()}%40EXAMPLE.COM`, client), 200);
    assert.equal(await call(base, 'GET', '/paid-bookings?email=other%40example.com', client), 403);
    assert.equal(await call(base, 'GET', '/paid-bookings', client), 403);
    assert.equal(await call(base, 'GET', `/paid-bookings?coachId=${coachId}`, client), 403);
    // These shapes make the route drop its email filter, so they must never pass
    assert.equal(await call(base, 'GET', `/paid-bookings?email[]=${clientId}%40example.com`, client), 403);
    assert.equal(await call(base, 'GET', `/paid-bookings?email=${clientId}%40example.com&email=other%40example.com`, client), 403);

    assert.equal(await call(base, 'GET', `/paid-bookings?coachId=${coachId}`, coach), 200);
    assert.equal(await call(base, 'GET', '/paid-bookings?coachId=other-coach', coach), 403);
    assert.equal(await call(base, 'GET', `/paid-bookings?coachId[]=${coachId}`, coach), 403);
    assert.equal(await call(base, 'GET', '/paid-bookings', coach), 403);

    for (const role of ['admin', 'headcoach', 'customer_support']) {
      assert.equal(await call(base, 'GET', '/paid-bookings', tokenFor(role)), 200, role);
    }
  } finally {
    server.close();
  }
});

test('a customer can only create a paid booking for themselves', async () => {
  const { server, base } = await startGuardedApp();
  const id = newUserId();
  const token = tokenFor('client', id);
  const post = (body: object) => fetch(`${base}/paid-bookings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.status);
  try {
    assert.equal(await post({ clientEmail: `${id}@example.com`, userId: id }), 200);
    assert.equal(await post({ clientEmail: ` ${id.toUpperCase()}@EXAMPLE.COM ` }), 200);
    assert.equal(await post({ clientEmail: 'other@example.com' }), 403);
    assert.equal(await post({ clientEmail: `${id}@example.com`, userId: 'someone-else' }), 403);
    assert.equal(await post({}), 403);
    assert.equal(await post({ clientEmail: [`${id}@example.com`] }), 403);
  } finally {
    server.close();
  }
});

test('changing paid bookings is limited by role', async () => {
  const { server, base } = await startGuardedApp();
  const client = tokenFor('client');
  const coach = tokenFor('coach');
  const support = tokenFor('customer_support');
  const admin = tokenFor('admin');
  const headCoach = tokenFor('headcoach');
  try {
    assert.equal(await call(base, 'PATCH', '/paid-bookings/b1/assign', client), 403);
    assert.equal(await call(base, 'PATCH', '/paid-bookings/b1/session', client), 403);
    assert.equal(await call(base, 'DELETE', '/paid-bookings/b1', client), 403);
    assert.equal(await call(base, 'PATCH', '/paid-bookings/b1/assign', coach), 200);
    assert.equal(await call(base, 'PATCH', '/paid-bookings/b1/session', support), 200);
    assert.equal(await call(base, 'DELETE', '/paid-bookings/b1', coach), 403);
    assert.equal(await call(base, 'DELETE', '/paid-bookings/b1', support), 403);
    assert.equal(await call(base, 'DELETE', '/paid-bookings/b1', admin), 200);
    assert.equal(await call(base, 'DELETE', '/paid-bookings/b1', headCoach), 200);
  } finally {
    server.close();
  }
});

test('a coach can only change paid bookings assigned to them', async () => {
  const run = async (role: string, assigned: () => Promise<string | null | undefined>) => {
    const req: any = { user: { id: 'coach-1', role }, params: { id: 'b1' } };
    const res = fakeRes();
    let passed = false;
    await requireCoachOwnsBooking(assigned)(req, res, () => { passed = true; });
    return { passed, status: res.statusCode };
  };

  assert.deepEqual(await run('coach', async () => 'coach-1'), { passed: true, status: 200 });
  assert.deepEqual(await run('coach', async () => 'coach-2'), { passed: false, status: 403 });
  assert.deepEqual(await run('coach', async () => null), { passed: false, status: 403 });
  assert.deepEqual(await run('coach', async () => undefined), { passed: false, status: 403 });
  assert.deepEqual(await run('coach', async () => { throw new Error('db down'); }), { passed: false, status: 503 });
  assert.deepEqual(await run('customer_support', async () => 'coach-2'), { passed: true, status: 200 });
  assert.deepEqual(await run('admin', async () => null), { passed: true, status: 200 });
});

test('consultations, assessments and enquiries reject reads and changes without a token', async () => {
  const { server, base } = await startGuardedApp();
  try {
    for (const [method, path] of [
      ['GET', '/consultations'], ['GET', '/consultations?email=client%40example.com'], ['PATCH', '/consultations/c1/assign'],
      ['PATCH', '/consultations/c1/status'], ['DELETE', '/consultations/c1'],
      ['GET', '/assessments'], ['GET', '/assessments?email=client%40example.com'], ['PATCH', '/assessments/a1/assign'],
      ['PATCH', '/assessments/a1/status'], ['DELETE', '/assessments/a1'],
      ['GET', '/enquiries'], ['DELETE', '/enquiries/e1']
    ]) {
      assert.equal(await call(base, method, path), 401, `${method} ${path}`);
    }
  } finally {
    server.close();
  }
});

test('public forms can still be submitted without a login', async () => {
  const { server, base } = await startGuardedApp();
  try {
    for (const path of ['/consultations', '/assessments', '/enquiries']) {
      assert.equal(await call(base, 'POST', path), 200, path);
    }
  } finally {
    server.close();
  }
});

test('consultation and assessment lists are limited by role', async () => {
  const { server, base } = await startGuardedApp();
  const clientId = newUserId();
  const coachId = newUserId();
  const client = tokenFor('client', clientId);
  const coach = tokenFor('coach', coachId);
  try {
    for (const path of ['/consultations', '/assessments']) {
      assert.equal(await call(base, 'GET', `${path}?email=${clientId}%40example.com`, client), 200, path);
      assert.equal(await call(base, 'GET', `${path}?email=other%40example.com`, client), 403, path);
      assert.equal(await call(base, 'GET', `${path}?email[]=${clientId}%40example.com`, client), 403, path);
      assert.equal(await call(base, 'GET', path, client), 403, path);
      assert.equal(await call(base, 'GET', `${path}?coachId=${coachId}`, coach), 200, path);
      assert.equal(await call(base, 'GET', `${path}?coachId=other-coach`, coach), 403, path);
      assert.equal(await call(base, 'GET', path, coach), 403, path);
      assert.equal(await call(base, 'GET', path, tokenFor('customer_support')), 200, path);
      assert.equal(await call(base, 'GET', path, tokenFor('headcoach')), 200, path);
    }
  } finally {
    server.close();
  }
});

test('changing consultations and assessments is limited by role', async () => {
  const { server, base } = await startGuardedApp();
  const client = tokenFor('client');
  const coach = tokenFor('coach');
  const support = tokenFor('customer_support');
  const headCoach = tokenFor('headcoach');
  try {
    for (const path of ['/consultations/x1', '/assessments/x1']) {
      assert.equal(await call(base, 'PATCH', `${path}/status`, client), 403, path);
      assert.equal(await call(base, 'PATCH', `${path}/assign`, client), 403, path);
      assert.equal(await call(base, 'DELETE', path, client), 403, path);
      assert.equal(await call(base, 'PATCH', `${path}/status`, coach), 200, path);
      assert.equal(await call(base, 'PATCH', `${path}/assign`, coach), 403, path);
      assert.equal(await call(base, 'DELETE', path, coach), 403, path);
      assert.equal(await call(base, 'PATCH', `${path}/status`, support), 200, path);
      assert.equal(await call(base, 'DELETE', path, support), 403, path);
      assert.equal(await call(base, 'PATCH', `${path}/assign`, headCoach), 200, path);
      assert.equal(await call(base, 'DELETE', path, headCoach), 200, path);
    }
  } finally {
    server.close();
  }
});

test('only staff can read website enquiries', async () => {
  const { server, base } = await startGuardedApp();
  try {
    assert.equal(await call(base, 'GET', '/enquiries', tokenFor('client')), 403);
    assert.equal(await call(base, 'GET', '/enquiries', tokenFor('coach')), 200);
    assert.equal(await call(base, 'GET', '/enquiries', tokenFor('customer_support')), 200);
    assert.equal(await call(base, 'DELETE', '/enquiries/e1', tokenFor('customer_support')), 403);
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
