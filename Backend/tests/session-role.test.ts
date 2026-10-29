import test from 'node:test';
import assert from 'node:assert/strict';

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

const setup = async (response: () => Response) => {
  Object.assign(globalThis, {
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    document: { cookie: '' },
    fetch: async () => response(),
  });
  // A tampered cache: same user id, role edited to admin in the browser
  localStorage.setItem('bxstrength_store_v2_initialized', 'true');
  localStorage.setItem('bxstrength_current_user', JSON.stringify({ id: 'u1', email: 'c@example.com', name: 'Client', role: 'admin' }));
  const { sessionApi } = await import('../../src/services/features/session');
  const { setToken } = await import('../../src/services/core/token');
  setToken('access-token');
  return sessionApi;
};

test('the role always comes from the server, never from the cached user', async () => {
  const api = await setup(() => new Response(JSON.stringify({ user: { id: 'u1', email: 'c@example.com', role: 'client' } }), { status: 200 }));
  const me = await api.fetchMe();
  assert.equal(me?.role, 'client');
});

test('a server error is reported instead of falling back to the cached (editable) user', async () => {
  const api = await setup(() => new Response('{}', { status: 500 }));
  await assert.rejects(() => api.fetchMe(), /Session check failed \(500\)/);
});

test('if the server omits the role, the edited cached role is not used', async () => {
  const api = await setup(() => new Response(JSON.stringify({ user: { id: 'u1', email: 'c@example.com' } }), { status: 200 }));
  const me = await api.fetchMe();
  assert.equal(me?.role, 'client');
});
