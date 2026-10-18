# BxStrength Dedicated Testing Infrastructure

Comprehensive, automated test suite for BxStrength's React 19 + Vite frontend, Express / TypeScript backend, PostgreSQL database, and `VelocityAPI` client layer.

---

## 1. Directory Structure

```
bxstrength/
├── tests/
│   ├── README.md                           # Documentation & testing handbook
│   ├── test-data/
│   │   ├── factories/                      # Synthetic data generators
│   │   │   ├── user.factory.ts
│   │   │   ├── trainer.factory.ts
│   │   │   ├── workout.factory.ts
│   │   │   ├── subscription.factory.ts
│   │   │   ├── payment.factory.ts
│   │   │   └── booking.factory.ts
│   │   ├── fixtures/                       # Static JSON test fixtures
│   │   │   ├── users.json
│   │   │   └── plans.json
│   │   └── payloads/                       # Malicious & boundary test inputs
│   │       ├── invalid-inputs.ts
│   │       └── security-payloads.ts
│   │
│   ├── unit/                               # Fast, isolated unit tests
│   │   ├── backend/
│   │   │   ├── auth/                       # JWT validation, password hashing
│   │   │   ├── permissions/                # RBAC matrix evaluation
│   │   │   ├── pricing/                    # Server-derived pricing & currencies
│   │   │   ├── payments/                   # Signature validation & payment rules
│   │   │   ├── bookings/                   # Booking state progression
│   │   │   ├── subscriptions/              # Subscription validity & expiry
│   │   │   ├── workouts/                   # Approval & publication rules
│   │   │   ├── nutrition/                  # Macro calculation rules
│   │   │   ├── coaching/                   # Coach assignment authorization
│   │   │   ├── support/                    # Ticket ownership rules
│   │   │   ├── notifications/              # Recipient scoping
│   │   │   ├── validation/                 # Zod payload schemas
│   │   │   └── state-machines/             # UK booking journey state machine
│   │   └── frontend/
│   │       ├── api/                        # VelocityAPI client & rate limiters
│   │       ├── auth/                       # AuthContext session management
│   │       ├── permissions/                # Role-based frontend navigation
│   │       ├── forms/                      # Form inputs & validation state
│   │       ├── components/                 # UI components & modal interactions
│   │       └── state/                      # Client-side session persistence
│   │
│   ├── integration/                        # Real HTTP API & DB integration tests
│   │   ├── setup/
│   │   │   ├── test-app.ts                 # Supertest Express app instance
│   │   │   ├── test-database.ts            # PostgreSQL pool & migrations
│   │   │   ├── reset-database.ts           # Deterministic table truncation
│   │   │   └── cleanup.ts                  # Teardown & pool disconnection
│   │   ├── auth/                           # Register, login, me, otp, reset
│   │   ├── users/                          # User CRUD & role updates
│   │   ├── trainers/                       # Trainer management & bio updates
│   │   ├── workouts/                       # Workout plans CRUD & publication
│   │   ├── nutrition/                      # Nutrition plans CRUD
│   │   ├── coaching/                       # Coach-athlete assignments
│   │   ├── classes/                        # Schedules and booking rules
│   │   ├── subscriptions/                  # Subscriptions retrieval & cancellation
│   │   ├── tickets/                        # Support tickets CRUD & ownership
│   │   ├── notifications/                  # Notifications & read status
│   │   ├── announcements/                  # System announcements CRUD
│   │   ├── audit/                          # Audit log retrieval & protections
│   │   ├── reviews/                        # Client reviews CRUD
│   │   ├── payments/                       # Order creation & verification
│   │   ├── bookings/                       # UK booking journey lifecycle
│   │   └── email/                          # Email status & dispatch
│   │
│   ├── security/                           # Mandatory release gate security suite
│   │   ├── auth-bypass.test.ts             # Invalid/expired/missing JWT tests
│   │   ├── rbac-matrix.test.ts             # Strict role matrix enforcement
│   │   ├── idor.test.ts                    # Insecure direct object reference tests
│   │   ├── mass-assignment.test.ts         # Injected role/approval protections
│   │   ├── password-reset.test.ts          # Reset token lifecycle & secrets leak
│   │   ├── payment-tampering.test.ts       # Client price tampering rejection
│   │   ├── webhook-signatures.test.ts      # HMAC-SHA256 signature enforcement
│   │   ├── webhook-replay.test.ts          # Idempotency & replay protection
│   │   ├── injection.test.ts               # SQL injection & stored XSS prevention
│   │   ├── rate-limits.test.ts             # Throttling & brute-force limits
│   │   └── secrets-and-logging.test.ts     # Leak prevention & audit protection
│   │
│   ├── e2e/                                # Playwright end-to-end browser journeys
│   │   ├── playwright.config.ts            # E2E test configuration
│   │   ├── fixtures/
│   │   │   ├── auth.fixture.ts             # Pre-authenticated user sessions
│   │   │   └── test-users.fixture.ts       # Synthetic credentials by role
│   │   ├── journeys/
│   │   │   ├── registration.spec.ts        # User registration journey
│   │   │   ├── client-dashboard.spec.ts    # Client overview & workouts
│   │   │   ├── coach-workflow.spec.ts      # Coach program authoring
│   │   │   ├── head-coach-approval.spec.ts # Head coach approval workflow
│   │   │   ├── admin-management.spec.ts    # User administration & role change
│   │   │   ├── payment-booking.spec.ts     # Service selection to booking
│   │   │   ├── subscription.spec.ts        # Membership management
│   │   │   └── support-ticket.spec.ts      # Client inquiry desk
│   │   └── accessibility/
│   │       └── a11y.spec.ts                # Landmarks, H1 count, alt tags
│   │
│   ├── contract/
│   │   ├── routes-inventory.test.ts        # Automatic route catalog & policy audit
│   │   ├── api-schemas.test.ts             # Response schema contracts
│   │   └── error-responses.test.ts         # Standard error shape contracts
│   │
│   ├── resilience/
│   │   ├── database-failure.test.ts        # DB connection drop & honesty tests
│   │   ├── restart-recovery.test.ts        # Crash/reboot state recovery
│   │   ├── payment-provider-outage.test.ts # Gateway timeout handling
│   │   └── concurrent-requests.test.ts     # Race condition & parallel webhook tests
│   │
│   └── helpers/
│       ├── test-env.ts                     # Test environment bootstrapper
│       ├── api-client.ts                   # Supertest request wrapper
│       ├── auth-helpers.ts                 # JWT & bcrypt test utilities
│       ├── assertions.ts                   # Custom security & contract assertions
│       ├── database-helpers.ts             # DB isolation & table cleaners
│       └── mock-providers.ts               # Payment HMAC & email spied mocks
│
├── vitest.config.ts                        # Vitest root runner config
├── playwright.config.ts                    # Root Playwright config
├── .env.example                            # Configuration template
├── .env.test                               # Automated test environment
└── .env.e2e                                # Browser E2E environment
```

---

## 2. Test Execution Commands

Run these scripts from the repository root:

```bash
# Run unit and integration tests (default)
npm test

# Run isolated unit tests (backend + frontend)
npm run test:unit

# Run backend API integration tests
npm run test:integration

# Run security test suite (release gate)
npm run test:security

# Run API contract and route inventory tests
npm run test:contract

# Run resilience and concurrency tests
npm run test:resilience

# Run full browser End-to-End tests
npm run test:e2e

# Run test coverage analysis (v8 engine)
npm run test:coverage

# Run Vitest in interactive watch mode
npm run test:watch
```

---

## 3. Database Isolation and Safety Guardrails

- Integration tests never run against production databases.
- `tests/helpers/database-helpers.ts` checks the `DATABASE_URL` string and halts immediately if production keywords or unknown cloud hosts are detected without the `test` substring.
- Tables are deterministically cleared between test runs using `tests/integration/setup/reset-database.ts`.

---

## 4. Continuous Integration Pipeline (CI)

A GitHub Actions workflow is provided at `.github/workflows/ci.yml`. It runs in 4 progressive tiers:
1. **Unit tests**: Fast syntax, typecheck, and unit validation.
2. **Integration tests**: Runs with a transient PostgreSQL 16 container.
3. **Security gate**: Runs all security regressions and RBAC matrix tests.
4. **End-to-End**: Spins up frontend/backend and executes Playwright browser tests.
