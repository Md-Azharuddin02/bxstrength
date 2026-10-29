import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal Web Storage: data keys are own enumerable props, methods are not (like the browser's Storage)
const makeStorage = (initial: Record<string, string>) => {
  const store: Record<string, string> = { ...initial };
  Object.defineProperties(store, {
    getItem: { value: (k: string) => (k in store ? store[k] : null) },
    setItem: { value: (k: string, v: string) => { store[k] = String(v); } },
    removeItem: { value: (k: string) => { delete store[k]; } },
  });
  return store;
};

test('logout clears every cached BxStrength record from the device but keeps the market preference', async () => {
  const local = makeStorage({
    bxstrength_current_user: '{"id":"u1"}',
    bxstrength_body_stats: '[{"weight":80}]',
    bxstrength_users: '[{"email":"other@example.com"}]',
    bxstrength_trainers_local_store: '[]',
    bxstrength_store_v2_initialized: 'true',
    bx_current_page: 'dashboard',
    bxstrength_market_country: 'GB',
    unrelated_site_key: 'keep',
  });
  const session = makeStorage({ bxstrength_ticket_draft_desc: 'my knee hurts', other_key: 'keep' });
  Object.assign(globalThis, { localStorage: local, sessionStorage: session });

  const { sessionApi } = await import('../../src/services/features/session');
  sessionApi.clearSession();

  assert.deepEqual(Object.keys(local).sort(), ['bxstrength_market_country', 'unrelated_site_key']);
  assert.deepEqual(Object.keys(session), ['other_key']);
});
