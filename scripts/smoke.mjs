
const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const EXPECTED_SHA = (process.env.EXPECTED_SHA || '').trim();
const READY_TIMEOUT_MS = Number(process.env.READY_TIMEOUT_MS || 600000); // 10 min
const POLL_MS = Number(process.env.POLL_MS || 15000);

if (!BASE) {
  console.error('BASE_URL is required');
  process.exit(2);
}

const get = (path, opts = {}) => fetch(BASE + path, { redirect: 'manual', ...opts });

const shaMatches = (live) =>
  !EXPECTED_SHA || !live ? false : live === EXPECTED_SHA || live.startsWith(EXPECTED_SHA) || EXPECTED_SHA.startsWith(live);

async function waitForDeploy() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let liveSha = null;
  while (Date.now() < deadline) {
    try {
      const r = await get('/api/health');
      if (r.ok) {
        const body = await r.json().catch(() => ({}));
        liveSha = body.sha ?? null;
        if (shaMatches(liveSha)) {
          console.log(`deploy confirmed: live sha ${liveSha} matches ${EXPECTED_SHA}`);
          return;
        }
        if (!EXPECTED_SHA || !liveSha) {
          // No SHA to compare (local run, or health.sha not deployed yet): accept a healthy 200.
          console.log(`health 200 (live sha=${liveSha ?? 'n/a'}, expected=${EXPECTED_SHA || 'n/a'}) — cannot verify commit, accepting`);
          return;
        }
        console.log(`waiting: live sha ${liveSha} != expected ${EXPECTED_SHA}`);
      } else {
        console.log(`health ${r.status}, retrying…`);
      }
    } catch (e) {
      console.log(`health unreachable (${e.message}), retrying…`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`Timed out waiting for deploy (last live sha=${liveSha ?? 'none'})`);
}

const checks = [
  ['health is 200', async () => (await get('/api/health')).status === 200],
  ['reviews public 200', async () => (await get('/api/reviews')).status === 200],
  ['trainers public 200', async () => (await get('/api/trainers')).status === 200],
  ['classes public 200', async () => (await get('/api/classes')).status === 200],
  ['/auth/me needs auth (401)', async () => (await get('/api/auth/me')).status === 401],
  ['admin route needs auth (401)', async () => (await get('/api/admin/users/smoke/role', { method: 'PUT' })).status === 401],
];

(async () => {
  await waitForDeploy();
  let failed = 0;
  for (const [name, fn] of checks) {
    try {
      const ok = await fn();
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
      if (!ok) failed++;
    } catch (e) {
      console.log(`FAIL  ${name} (${e.message})`);
      failed++;
    }
  }
  console.log(`\n${checks.length - failed}/${checks.length} smoke checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('smoke error:', e.message);
  process.exit(1);
});
