import test from 'node:test';
import assert from 'node:assert/strict';

const KEY = 'bxstrength_body_stats';

// Minimal Web Storage, as in logout-cleanup.test.ts
const makeStorage = () => {
  const store: Record<string, string> = {};
  Object.defineProperties(store, {
    getItem: { value: (k: string) => (k in store ? store[k] : null) },
    setItem: { value: (k: string, v: string) => { store[k] = String(v); } },
    removeItem: { value: (k: string) => { delete store[k]; } },
  });
  return store;
};

const entry = (id: string, userId = 'u1') => ({ id, userId, date: '2026-01-15', weightKg: 80, heightCm: 180, bmi: 24.7, bmiCategory: 'Normal' });

const setup = async (saved: unknown, respondToPost: (importId: string) => Response) => {
  const posts: any[] = [];
  Object.assign(globalThis, {
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    document: { cookie: '' },
    fetch: async (_url: string, init?: RequestInit) => {
      if (init?.method !== 'POST') return new Response('[]', { status: 200 });
      const body = JSON.parse(String(init.body));
      posts.push(body);
      return respondToPost(body.importId);
    },
  });
  localStorage.setItem(KEY, JSON.stringify(saved));
  const { bodyStatsApi } = await import('../../src/services/features/bodyStats');
  return { api: bodyStatsApi, posts, left: () => JSON.parse(localStorage.getItem(KEY) || '[]').map((s: any) => s.id) };
};

const created = () => new Response('{}', { status: 201 });

test('own entries are sent with their original date and removed from the browser', async () => {
  const { api, posts, left } = await setup([entry('a'), entry('b')], created);
  await api.fetchBodyStats('u1');
  assert.deepEqual(posts.map(p => p.importId), ['a', 'b']);
  assert.equal(posts[0].date, '2026-01-15');
  assert.equal(posts[0].userId, undefined);
  assert.deepEqual(left(), []);
});

test('the next load does not send anything again', async () => {
  const { api, posts } = await setup([entry('a')], created);
  await api.fetchBodyStats('u1');
  await api.fetchBodyStats('u1');
  assert.equal(posts.length, 1);
});

test('entries belonging to another user are neither sent nor removed', async () => {
  const { api, posts, left } = await setup([entry('a', 'someone-else')], created);
  await api.fetchBodyStats('u1');
  assert.equal(posts.length, 0);
  assert.deepEqual(left(), ['a']);
});

test('a server error keeps the entry for the next load', async () => {
  const { api, left } = await setup([entry('a'), entry('b')], () => new Response('{}', { status: 500 }));
  await api.fetchBodyStats('u1');
  assert.deepEqual(left(), ['a', 'b']);
});

test('an entry the server rejects as invalid is dropped so it cannot block the others', async () => {
  const { api, left } = await setup([entry('bad'), entry('good')], id => new Response('{}', { status: id === 'bad' ? 400 : 201 }));
  await api.fetchBodyStats('u1');
  assert.deepEqual(left(), []);
});

test('a failed import still loads the list', async () => {
  const { api } = await setup([entry('a')], () => { throw new Error('offline'); });
  assert.deepEqual(await api.fetchBodyStats('u1'), []);
});

test('a failed load and a failed save are reported, not hidden', async () => {
  const { api } = await setup([], () => new Response(JSON.stringify({ error: 'Weight must be positive' }), { status: 400 }));
  await assert.rejects(() => (api as any).addBodyStat({ weightKg: -1, heightCm: 180 }), /Weight must be positive/);

  Object.assign(globalThis, { fetch: async () => new Response('{}', { status: 500 }) });
  await assert.rejects(() => api.fetchBodyStats('u1'), /Could not load body stats/);
});
