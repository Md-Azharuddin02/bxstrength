# CI/CD

Lightweight pipeline: **GitHub Actions gates merges + validates deploys; Render deploys natively.**

```
feature branch ──PR──▶ staging ──PR(manual)──▶ main
       │  CI (ci.yml)      │  CI on release PR     │
       ▼                   ▼                       ▼
   must pass to merge   Render auto-deploys     Render auto-deploys
                        staging service         prod service
                             │                       │
                        staging.yml:            production.yml:
                        wait for deploy +        wait for deploy +
                        smoke, then open         smoke, release report
                        release PR → main
```

Nothing deploys from GitHub. Render auto-deploys the branch; GitHub only **blocks bad merges** and **verifies the live result**.

## Workflows
| File | Trigger | Does |
|---|---|---|
| `ci.yml` | PR → `staging` or `main` | `npm ci` → lint → build → auth tests (Redis) → audit + secret scan (informational) |
| `staging.yml` | push to `staging` | polls `/api/health` until the pushed SHA is live, runs non-destructive smoke (`scripts/smoke.mjs`), opens/updates the `staging → main` release PR |
| `production.yml` | **manual** (Actions → Run workflow, on `main`) | after you trigger the Render prod deploy: deploy-wait + smoke + release report |

`scripts/smoke.mjs` is GET-only + unauthenticated-401 checks — safe against prod (no data writes, emails, or payments). `/api/health` reports `sha` from Render's `RENDER_GIT_COMMIT`, so a stale instance can't be mistaken for the new release.

## One-time setup (you must do — needs repo admin / Render access)

### 1. Repo variables & secrets
Optional variables (defaults are hardcoded to the known URLs):
```bash
gh variable set STAGING_API_URL --body "https://bxstrength-stg.onrender.com"
gh variable set PROD_API_URL    --body "https://bxstrength-api.onrender.com"
```
Secret for the release PR so **CI runs on it** (a PR created by the default token does NOT trigger CI):
```bash
# Create a fine-grained PAT: repo contents=read, pull-requests=write. Then:
gh secret set RELEASE_PR_TOKEN --body "<the PAT>"
```
Without `RELEASE_PR_TOKEN`, the release PR is still created, but you must re-run CI on it manually (push an empty commit or "Re-run").

### 2. Branch protection (REQUIRED — a workflow file blocks nothing by itself)
Run a PR once so the check name registers, then:
```bash
for BR in staging main; do
gh api --method PUT "repos/Md-Azharuddin02/bxstrength/branches/$BR/protection" --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "checks": [{ "context": "Lint, build, test" }] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
done
```
Verify: `gh api repos/Md-Azharuddin02/bxstrength/branches/main/protection | jq '.required_status_checks, .required_pull_request_reviews'`.
Confirm the context string matches the check name shown on a real PR; adjust if GitHub displays it as `CI / Lint, build, test`.

### 3. Render
- **Staging service** → deploy branch = your staging branch, **Auto-Deploy = Yes** (ships on every merge to staging).
- **Production service** → deploy branch = `main`, **Auto-Deploy = No** — deploy **manually** from the dashboard after merging the release PR. This is the human gate before production ships.
- Separate **staging DB + Redis** from production (never point staging at the prod database).
- Env per service: `NODE_ENV` (`staging`/`production`), `JWT_SECRET`, `JWT_REFRESH_SECRET` (must differ), `REDIS_URL`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, **`RAZORPAY_WEBHOOK_SECRET`**, **`CASHFREE_SECRET_KEY`** (webhooks now fail closed — a missing secret rejects all webhooks), `CORS_ORIGINS`/`COOKIE_DOMAIN` as applicable.
- Vercel: staging project ← `staging` branch (`npm run build:staging`), prod project ← `main` (`npm run build`).

## Developer workflow
1. Branch from `staging`, open a PR **into `staging`**. CI runs; fix until green.
2. Get approval, **merge manually**. Render deploys staging; `staging.yml` waits + smokes it.
3. On success a `staging → main` release PR appears. Review it; CI runs (with `RELEASE_PR_TOKEN`).
4. **Merge the release PR manually.** Then: **Render dashboard → prod service → Manual Deploy → Deploy latest commit.** After that, run **Actions → Production validation → Run workflow** (on `main`) to smoke-test prod and get the release report.

> Not everything in `staging` must ship. If `staging` holds unrelated/experimental work, cut a release branch off the specific commits instead of promoting all of `staging`.

## Rollback & recovery
No automated rollback is implemented — these are **manual** procedures.

| Situation | Action |
|---|---|
| Bad prod deploy / failed smoke | Render dashboard → service → **Deploys** → previous good deploy → **Rollback** (redeploys that image). Re-run `production.yml` or re-curl `/api/health`. |
| Startup crash | Render logs → usually a missing/incorrect env var (`JWT_*`, `REDIS_URL`, webhook secrets). Fix the env var → **Manual Deploy → Clear build cache & deploy**. |
| Wrong env var only | Fix in Render env → redeploy. No code change needed. |
| DB incompatibility | **Not auto-reversed.** This app uses `db_schema.sql` (no incremental migrations), so there is no migration-rollback step. If a schema change breaks an older app version, roll the app back and reconcile the schema manually. Prefer additive (expand-and-contract) changes so old and new app versions coexist. |
| Dependency / external outage | Retry the deploy; if a dependency is the cause, pin/revert it in `package-lock.json` via a normal PR. |

Always verify recovery with `/api/health` (status + `sha`) and the smoke checks before declaring resolved.

## Honest gaps
- **Test coverage:** only the auth suite (`Backend/tests/auth.test.ts`, 18 tests) exists. No integration/API/authz/frontend tests — a real gap; add meaningful ones over time, don't fake them.
- **Dependency scan** is informational (`continue-on-error`) because advisories exist today; make it Required after triaging them.
- **No migration framework** — schema-replace only; migration validation/rollback is manual.
- **Deploy orchestration** is Render-native (not GitHub-triggered); GitHub cannot *prevent* a deploy, only block the merge that feeds it and fail validation afterward.
