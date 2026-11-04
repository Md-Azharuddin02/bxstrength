import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

// db.ts only builds its pool when DATABASE_URL is set. The pool never connects because query is replaced below.
process.env.DATABASE_URL = 'postgres://test@127.0.0.1:1/unused';
const realSetInterval = globalThis.setInterval;
// db.ts starts a heartbeat timer that would keep the test process alive
globalThis.setInterval = ((fn: any, ms: any) => realSetInterval(fn, ms).unref()) as any;

const rows: any[] = [];
const queries: { sql: string; params: any[] }[] = [];

// Returns numerics as strings and the date as text, like pg does for this query
const fakeQuery = async (sql: string, params: any[] = []) => {
  queries.push({ sql, params });
  if (sql.startsWith('INSERT INTO body_stats')) {
    if (rows.some(r => r.id === params[0])) return { rows: [] };
    const [id, user_id, date, weight_kg, height_cm, bmi, bmi_category, body_fat_percentage, chest_cm, waist_cm, biceps_cm, thighs_cm] = params;
    const row = {
      id, user_id, date: date ?? new Date().toISOString().split('T')[0], weight_kg: String(weight_kg), height_cm: String(height_cm), bmi: String(bmi), bmi_category,
      body_fat_percentage: body_fat_percentage === null ? null : String(body_fat_percentage), chest_cm, waist_cm, biceps_cm, thighs_cm,
    };
    rows.push(row);
    return { rows: [row] };
  }
  if (sql.startsWith('SELECT')) {
    assert.match(sql, /WHERE user_id = \$1/);
    return { rows: rows.filter(r => r.user_id === params[0]) };
  }
  return { rows: [] };
};

let server: Server;
let base: string;
let tokenFor: (id: string) => string;
let quitRedis: () => Promise<unknown>;

const fakeCookieRes = () => {
  const res: any = {};
  res.cookie = () => res;
  res.clearCookie = () => res;
  return res;
};

before(async () => {
  const { dbPool } = await import('../src/config/db');
  (dbPool as any).query = fakeQuery;
  const { redis } = await import('../src/config/redis');
  for (let i = 0; i < 100 && !redis.isReady; i++) await new Promise(resolve => setTimeout(resolve, 30));
  assert.ok(redis.isReady, 'Redis is not reachable');
  quitRedis = () => redis.quit();

  const { startSession } = await import('../src/services/tokenService');
  tokenFor = (id: string) => startSession(fakeCookieRes(), { id, email: `${id}@example.com`, role: 'client', name: 'Test User' } as any) as any;

  const { default: apiGuard } = await import('../src/middlewares/apiGuard');
  const { default: bodyStatRoutes } = await import('../src/routes/bodyStatRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api', apiGuard);
  app.use('/api/body-stats', bodyStatRoutes);
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/body-stats`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  await quitRedis();
});

const post = async (token: string | undefined, body: unknown) => {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const list = async (token: string | undefined, query = '') => {
  const res = await fetch(base + query, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, body: await res.json() };
};

const valid = { weightKg: 80, heightCm: 180 };
let counter = 0;
const newUser = () => `body-stats-user-${Date.now()}-${counter++}`;

test('both endpoints reject a request without a token', async () => {
  assert.equal((await list(undefined)).status, 401);
  assert.equal((await post(undefined, valid)).status, 401);
});

test('the server calculates BMI and category and ignores values sent by the client', async () => {
  const { status, body } = await post(await tokenFor(newUser()), { ...valid, bmi: 1, bmiCategory: 'Underweight', id: 'chosen-by-client' });
  assert.equal(status, 201);
  assert.equal(body.bmi, 24.7);
  assert.equal(body.bmiCategory, 'Normal');
  assert.notEqual(body.id, 'chosen-by-client');
  assert.equal(body.date, new Date().toISOString().split('T')[0]);
});

test('BMI categories follow the WHO bands', async () => {
  const token = await tokenFor(newUser());
  for (const [weightKg, expected] of [[59, 'Underweight'], [60, 'Normal'], [81, 'Overweight'], [97.2, 'Obese']] as const) {
    assert.equal((await post(token, { weightKg, heightCm: 180 })).body.bmiCategory, expected, `${weightKg}kg`);
  }
});

test('a user cannot write stats onto another user, whatever the body says', async () => {
  const [alice, bob] = [newUser(), newUser()];
  const { body } = await post(await tokenFor(alice), { ...valid, userId: bob, user_id: bob });
  assert.equal(body.userId, alice);
  assert.deepEqual((await list(await tokenFor(bob))).body, []);
});

test('a user cannot read another user\'s stats, whatever the query says', async () => {
  const [alice, bob] = [newUser(), newUser()];
  await post(await tokenFor(bob), { ...valid, waistCm: 90 });
  const res = await list(await tokenFor(alice), `?userId=${bob}&user_id=${bob}`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
  assert.equal(queries.at(-1)?.params[0], alice);
});

test('a client reads their own stats back as numbers', async () => {
  const token = await tokenFor(newUser());
  await post(token, { ...valid, bodyFatPercentage: 18.5 });
  const { body } = await list(token);
  assert.equal(body.length, 1);
  assert.strictEqual(body[0].weightKg, 80);
  assert.strictEqual(body[0].bodyFatPercentage, 18.5);
  assert.strictEqual(body[0].waistCm, undefined);
});

test('invalid numbers are rejected and nothing is saved', async () => {
  const token = await tokenFor(newUser());
  const saved = rows.length;
  for (const bad of [
    {}, { weightKg: 80 }, { heightCm: 180 },
    { weightKg: 0, heightCm: 180 }, { weightKg: -80, heightCm: 180 }, { weightKg: 80, heightCm: 0 }, { weightKg: 80, heightCm: -180 },
    { weightKg: '80', heightCm: 180 }, { weightKg: 80, heightCm: '180' }, { weightKg: null, heightCm: 180 }, { weightKg: [80], heightCm: 180 },
    { weightKg: 501, heightCm: 180 }, { weightKg: 80, heightCm: 301 },
    { weightKg: 500, heightCm: 1 }, // BMI too big for its column
    { weightKg: 0.01, heightCm: 300 }, // BMI rounds to zero
    { ...valid, bodyFatPercentage: 101 }, { ...valid, waistCm: -1 }, { ...valid, chestCm: 'wide' },
  ]) {
    assert.equal((await post(token, bad)).status, 400, JSON.stringify(bad));
  }
  assert.equal(rows.length, saved);
});

test('only real dates up to today are accepted', async () => {
  const token = await tokenFor(newUser());
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  for (const date of [tomorrow, '2026-02-30', '2026-13-01', 'yesterday', '2026-1-1', 20260101, null]) {
    assert.equal((await post(token, { ...valid, date })).status, 400, String(date));
  }
  assert.equal((await post(token, { ...valid, date: '2026-01-15' })).body.date, '2026-01-15');
});

test('importing the same entry twice saves it once', async () => {
  const token = await tokenFor(newUser());
  const entry = { ...valid, date: '2026-01-15', importId: 'stat-1700000000000' };
  assert.equal((await post(token, entry)).status, 201);
  const second = await post(token, entry);
  assert.equal(second.status, 200);
  assert.equal(second.body.alreadyImported, true);
  assert.equal((await list(token)).body.length, 1);
});

test('two users importing entries with the same local id do not clash', async () => {
  const entry = { ...valid, date: '2026-01-15', importId: 'stat-1700000000001' };
  const [alice, bob] = [newUser(), newUser()];
  assert.equal((await post(await tokenFor(alice), entry)).status, 201);
  assert.equal((await post(await tokenFor(bob), entry)).status, 201);
  assert.equal((await list(await tokenFor(alice))).body.length, 1);
  assert.equal((await list(await tokenFor(bob))).body.length, 1);
});

test('a bad import id is rejected', async () => {
  const token = await tokenFor(newUser());
  for (const importId of ['', 'x'.repeat(65), 42]) {
    assert.equal((await post(token, { ...valid, importId })).status, 400);
  }
});
