import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureSubscriptionForPayment } from '../src/services/subscriptionService';
import { createSubscription, deleteSubscription } from '../src/controllers/subscriptionController';

const fakeRes = () => {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: unknown) => { res.body = body; return res; };
  return res;
};

test('subscription is only created from a reconciled payment, keyed by order id, with no duplicates', async () => {
  const calls: { sql: string; params: unknown[] }[] = [];
  const db = { query: async (sql: string, params: unknown[]) => { calls.push({ sql, params }); return { rowCount: 1 }; } };
  const now = new Date('2026-10-29T10:00:00.000Z');

  assert.equal(await ensureSubscriptionForPayment(db, 'order_123', now), true);
  const [{ sql, params }] = calls;
  assert.match(sql, /t\.status = 'reconciled'/);
  assert.match(sql, /ON CONFLICT \(id\) DO NOTHING/);
  assert.deepEqual(params, ['order_123', '2026-10-29T10:00:00.000Z', '2026-11-28T10:00:00.000Z']);

  const noRowDb = { query: async () => ({ rowCount: 0 }) };
  assert.equal(await ensureSubscriptionForPayment(noRowDb, 'order_123', now), false);
});

test('clients cannot create or delete subscriptions directly', async () => {
  const client = { user: { id: 'u1', email: 'c@example.com', role: 'client' } };

  const created = fakeRes();
  await createSubscription({ ...client, body: { planName: 'BX Complete', price: 0, status: 'active' } } as any, created);
  assert.equal(created.statusCode, 403);

  const deleted = fakeRes();
  await deleteSubscription({ ...client, params: { id: 'sub-1' } } as any, deleted);
  assert.equal(deleted.statusCode, 403);
});

test('staff can still create subscriptions for a client', async () => {
  const res = fakeRes();
  await createSubscription({
    user: { id: 'a1', email: 'admin@example.com', role: 'admin' },
    body: { userId: 'u1', userEmail: 'c@example.com', planName: 'BX Complete', price: 80 },
  } as any, res);
  assert.equal(res.statusCode, 200);
});
