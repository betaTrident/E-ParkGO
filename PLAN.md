# E-ParkGO Implementation Plan

> Status: living implementation plan. Only items marked **Complete** have passed their documented gate; **Implemented — verification pending** means the code exists but the full gate has not been executed successfully in the current environment.
>
> Product source: `initial-roadmap.md`. Business rules not fixed by that source are labeled **Assumption**.

## 0. Composer 2.5 Execution Guide

> **This section is the primary entry point for Composer 2.5.** Read it before any other section, every session.
> The full product specification begins at §1. Keep §0 factual and concise; update implementation status only when supported by reproducible gate evidence.

---

### 0.1 How to Use This Plan

1. **Always start with `AGENTS.md`** — it contains the boot sequence, anti-hallucination constraints, and the skills routing table. The workspace rules inject it automatically, but confirm it has been read.
2. **Check §0.2** — find the current active phase and its gate status before touching any file.
3. **Load skills** — use the `Read` tool on every skill path listed for the active phase in `AGENTS.md §Phase Skills Routing Table` before writing a single line of implementation.
4. **Execute the phase steps** — use the numbered steps in §0.4 (Phase 2) or the corresponding phase section for later phases. Follow them in sequence. Do not skip steps.
5. **Verify each step** — each step ends with a verification command. Run it and confirm the expected result before moving to the next step.
6. **Update §0.2 status** when a phase gate passes.

**Do not read ahead and implement future phases.** Complete the active phase gate first.

---

### 0.2 Current Implementation Status

> Update the Status column when a phase gate passes. Never mark a phase Complete until its gate conditions are verified by running the stated commands.

| Phase | Status | Gate summary |
|-------|--------|--------------|
| 1. Discovery and Decisions | ✅ **Complete** | Default decisions in §3 are approved for development. Fee vectors in §17 are the approved test corpus. |
| **2. Repository and Environments** | ✅ **Complete** | `npm run build` clean; `npm test` shows RED; `npx supabase --version` works; full directory tree exists. Next.js 16.2.10, Node 22.17.0, Supabase CLI 2.109.1. |
| **3. Database Foundation** | ⚠️ **Implemented — verification pending** | Schema, tenant integrity, safe remote tooling, and 230 planned pgTAP assertions are implemented. Required gate remains `supabase db reset` + `supabase test db`; blocked locally until Docker is available. No remote deployment is implied. |
| **4. Auth & Authorization** | ⚠️ **Implemented — database gate pending** | SSR auth, safe callbacks, recovery/update flow, inactive-account handling, protected shell, permissions, grants, and expanded RLS coverage are implemented. Typecheck, lint, production build, 55 unit tests with ≥80% coverage, and 10 Chromium/Firefox/WebKit desktop/mobile auth checks pass. Completion remains blocked only by the Phase 3 database gate. |
| **5. Facility, Spaces, Rates** | ⏳ **Pending** | Database groundwork exists, but configuration RPCs, responsive UI flows, immutable publish tests, and the full phase gate are not implemented. |
| 6. Entry & QR Ticket | ⏳ Pending | Concurrent plate/space tests pass; entry E2E passes. |
| 7. Validation, Fee, Exit Preview | ⏳ Pending | Every fee vector and state transition in §17 passes. |
| 8. Cash Payment & Confirmed Exit | ⏳ Pending | Network interruption and concurrency E2E passes. |
| 9. Dashboard & Realtime | ⏳ Pending | Two-client convergence and reconnect tests pass. |
| 10. Reports & Audit | ⏳ Pending | Totals reconcile to immutable payment/snapshot rows. |
| 11. PWA & Offline | ⏳ Pending | Install/offline tests prove no mutation queue. |
| 12. Security Hardening | ⏳ Pending | Security checklist (§21) passes; no critical/high finding. |
| 13. Automated Release Suite | ⏳ Pending | ≥80% coverage on all four metrics; no skipped tests; CI green. |
| 14. Staging, Deployment & Pilot | ⏳ Pending | §33 evidence bundle signed; go-live approval obtained. |
| 15. Documentation & Handover | ⏳ Pending | New operator can deploy, run the flow, diagnose, and restore using docs alone. |

---

### 0.3 Phase → Skills Quick Reference

Load these skill files with the `Read` tool at the start of each phase. Full paths are in `AGENTS.md §Phase Skills Routing Table`.

| Phase | Skills (load in order) |
|-------|------------------------|
| 2 — Scaffolding | `nextjs-turbopack`, `repository-conventions`, `supabase`, `git-workflow`, `coding-standards`, `tdd-workflow`, `design-system` |
| 3 — Database | `supabase`, `supabase-postgres-best-practices`, `backend-patterns` |
| 4 — Auth | `supabase`, `security-review`, `backend-patterns` |
| 5 — Facility/Rates | `backend-patterns`, `api-design`, `supabase` |
| 6 — Entry/QR | `backend-patterns`, `security-review`, `api-design` |
| 7 — Fee/Preview | `backend-patterns`, `supabase-postgres-best-practices` |
| 8 — Payment/Exit | `backend-patterns`, `security-review`, `supabase` |
| 9 — Dashboard/RT | `frontend-patterns`, `supabase`, `accessibility` |
| 10 — Reports | `backend-patterns`, `frontend-patterns` |
| 11 — PWA | `frontend-patterns`, `supabase` |
| 12 — Hardening | `security-review`, `supabase-postgres-best-practices` |
| 13 — Tests | `tdd-workflow`, `ai-regression-testing`, `verification-loop` |
| 14 — Deploy | `deployment-patterns`, `supabase`, `docker-patterns` |
| 15 — Docs | `documentation-lookup` |

---

### 0.4 Phase 2: Repository and Environments — Complete Scaffolding Steps

**Before writing any code, load these skills with the `Read` tool:**

```
k:\E-ParkGO\.agents\skills\nextjs-turbopack\SKILL.md
k:\E-ParkGO\.claude\skills\repository-conventions\SKILL.md
k:\E-ParkGO\.agents\skills\supabase\SKILL.md
k:\E-ParkGO\.agents\skills\git-workflow\SKILL.md
k:\E-ParkGO\.agents\skills\coding-standards\SKILL.md
k:\E-ParkGO\.agents\skills\tdd-workflow\SKILL.md
k:\E-ParkGO\.agents\skills\design-system\SKILL.md
```

**Working directory for all commands in Phase 2:** `K:\E-ParkGO`

---

#### Step 2.1 — Pre-flight: verify required tools

```powershell
node --version      # Must be >=20.x
npm --version       # Must be >=10.x
git --version
supabase --version  # If missing, run: npm install -g supabase@latest
```

If `supabase` is not installed:

```powershell
npm install -g supabase@latest
supabase --version  # Confirm it now prints a version
```

**Verify:** All four commands print version strings without errors.

---

#### Step 2.2 — Protect existing documentation files

`create-next-app` will try to overwrite `README.md`. Rename it first:

```powershell
Rename-Item -Path "K:\E-ParkGO\README.md" -NewName "README.docs.md"
```

**Verify:**

```powershell
Test-Path "K:\E-ParkGO\README.docs.md"   # must be True
Test-Path "K:\E-ParkGO\README.md"        # must be False
```

---

#### Step 2.3 — Scaffold the Next.js application

Run from `K:\E-ParkGO`:

```powershell
npx create-next-app@latest . `
  --typescript `
  --tailwind `
  --eslint `
  --app `
  --src-dir `
  --import-alias "@/*" `
  --yes
```

If prompted about an existing directory or git repo, confirm to proceed.

**Verify (run all four):**

```powershell
Test-Path "package.json"          # True
Test-Path "next.config.ts"        # True
Test-Path "src/app/layout.tsx"    # True
Test-Path "tsconfig.json"         # True
```

---

#### Step 2.4 — Restore documentation README

```powershell
Remove-Item "K:\E-ParkGO\README.md" -Force
Rename-Item -Path "K:\E-ParkGO\README.docs.md" -NewName "README.md"
```

**Verify:**

```powershell
Test-Path "K:\E-ParkGO\README.md"       # True
Test-Path "K:\E-ParkGO\README.docs.md"  # False
```

---

#### Step 2.5 — Install production dependencies

```powershell
npm install `
  @supabase/supabase-js `
  @supabase/ssr `
  @tanstack/react-query `
  @tanstack/react-query-devtools `
  zod `
  zustand `
  date-fns `
  date-fns-tz
```

**Verify:**

```powershell
Get-Content package.json | Select-String "@supabase/ssr"
Get-Content package.json | Select-String "@tanstack/react-query"
Get-Content package.json | Select-String "zod"
```

All three must print a matching line.

---

#### Step 2.6 — Install development dependencies

```powershell
npm install -D `
  vitest `
  @vitejs/plugin-react `
  @testing-library/react `
  @testing-library/jest-dom `
  @testing-library/user-event `
  jsdom `
  @playwright/test `
  @vitest/coverage-v8
```

**Verify:**

```powershell
Get-Content package.json | Select-String "vitest"
Get-Content package.json | Select-String "@playwright/test"
```

---

#### Step 2.7 — Install Playwright browsers

```powershell
npx playwright install --with-deps chromium firefox webkit
```

This downloads browser binaries (~500 MB). Expected to take 2–5 minutes.

**Verify:**

```powershell
npx playwright --version
```

---

#### Step 2.8 — Initialise shadcn/ui

```powershell
npx shadcn@latest init --yes --defaults
```

If prompted interactively: choose **New York** style, **Neutral** base color, and **Yes** for CSS variables.

**Verify:**

```powershell
Test-Path "components.json"       # True
Test-Path "src/components/ui"     # True (directory)
Test-Path "src/lib/utils.ts"      # True
```

---

#### Step 2.9 — Initialise Supabase local stack

```powershell
supabase init
```

**Verify:**

```powershell
Test-Path "supabase/config.toml"  # True
```

Do **not** run `supabase start` yet — Phase 3 will configure the schema first.

---

#### Step 2.10 — Create environment files

Create `K:\E-ParkGO\.env.example` with the exact content below. This file is committed to git. It contains only placeholder values — never real secrets.

```dotenv
## Browser-safe: bundled into the client. Use public/publishable values only.
NEXT_PUBLIC_SUPABASE_URL=https://your-nonproduction-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-publishable-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

## Server-only: import ONLY from server modules. Never prefix with NEXT_PUBLIC.
SUPABASE_SERVICE_ROLE_KEY=replace-with-server-only-service-role-key
APP_ENV=development
RECEIPT_SIGNING_SECRET=replace-with-32-byte-server-only-hex-secret

## CI-only: set in GitHub Actions secrets, NOT in Vercel environment variables.
SUPABASE_ACCESS_TOKEN=replace-in-ci-secret-store
SUPABASE_PROJECT_ID=replace-in-ci-secret-store
SUPABASE_DB_PASSWORD=replace-in-ci-secret-store
VERCEL_TOKEN=replace-in-ci-secret-store

## Edge-only: set via Supabase secret manager, not in this file.
NOTIFICATION_PROVIDER_SECRET=replace-in-edge-secret-store
WEBHOOK_SIGNING_SECRET=replace-in-edge-secret-store
```

Then copy it to `.env.local` for local development:

```powershell
Copy-Item ".env.example" ".env.local"
```

Edit `.env.local` and fill in the local Supabase dev values. These values come from `supabase start` output (Phase 3); for now leave them as placeholders.

**Verify:**

```powershell
Test-Path ".env.example"   # True
Test-Path ".env.local"     # True
```

Confirm `.env.local` is in `.gitignore` (create-next-app adds it; verify):

```powershell
Get-Content ".gitignore" | Select-String "\.env\.local"
```

---

#### Step 2.11 — Create `vitest.config.ts`

Write `K:\E-ParkGO\vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.config.*',
        'src/components/ui/**',
        'src/lib/supabase/database.types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

---

#### Step 2.12 — Create `tests/setup.ts`

```powershell
New-Item -ItemType Directory -Force -Path "tests"
```

Write `K:\E-ParkGO\tests\setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

---

#### Step 2.13 — Create `playwright.config.ts`

Write `K:\E-ParkGO\playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
```

---

#### Step 2.14 — Update `package.json` scripts

Open `package.json`. Replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\"",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "db:start": "supabase start",
  "db:stop": "supabase stop",
  "db:reset": "supabase db reset",
  "db:types": "supabase gen types typescript --local > src/lib/supabase/database.types.ts",
  "db:migrate": "supabase migration new"
}
```

**Verify:**

```powershell
Get-Content package.json | Select-String '"typecheck"'
Get-Content package.json | Select-String '"db:reset"'
```

---

#### Step 2.15 — Create the full project directory structure

Run the following PowerShell block to create all required directories from §7 of this plan:

```powershell
$dirs = @(
  "src/app/(auth)/login",
  "src/app/(auth)/auth/callback",
  "src/app/(protected)/dashboard",
  "src/app/(protected)/entry",
  "src/app/(protected)/scanner",
  "src/app/(protected)/exit",
  "src/app/(protected)/payments",
  "src/app/(protected)/sessions",
  "src/app/(protected)/spaces",
  "src/app/(protected)/transactions",
  "src/app/(protected)/shifts",
  "src/app/(protected)/reports",
  "src/app/(protected)/admin/rates",
  "src/app/(protected)/admin/staff",
  "src/app/(protected)/admin/audit",
  "src/app/(protected)/admin/settings",
  "src/app/api/entries",
  "src/app/api/tickets",
  "src/app/api/exit",
  "src/app/api/payments",
  "src/app/api/reports",
  "src/components/forms",
  "src/components/scanner",
  "src/components/tickets",
  "src/components/dashboard",
  "src/components/spaces",
  "src/components/reports",
  "src/components/shared",
  "src/features/auth",
  "src/features/entry",
  "src/features/exit",
  "src/features/payments",
  "src/features/rates",
  "src/features/shifts",
  "src/features/reports",
  "src/lib/supabase",
  "src/lib/auth",
  "src/lib/errors",
  "src/lib/money",
  "src/lib/time",
  "src/lib/security",
  "src/lib/observability",
  "src/lib/realtime",
  "src/lib/offline",
  "src/lib/pwa",
  "src/lib/query",
  "src/hooks",
  "src/types",
  "supabase/migrations",
  "supabase/functions/receipt",
  "supabase/functions/export",
  "supabase/tests",
  "tests/unit",
  "tests/integration",
  "tests/e2e",
  "tests/fixtures",
  "tests/helpers",
  "docs/architecture",
  "docs/operations",
  "docs/security",
  "docs/adr",
  "public/icons"
)
foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $gitkeep = Join-Path $dir ".gitkeep"
  if (-not (Get-ChildItem $dir -Exclude ".gitkeep" | Where-Object { -not $_.PSIsContainer })) {
    New-Item -ItemType File -Force -Path $gitkeep | Out-Null
  }
}
Write-Host "Directory structure created successfully."
```

**Verify:**

```powershell
Test-Path "src/app/(protected)/dashboard"    # True
Test-Path "src/features/entry"               # True
Test-Path "src/lib/supabase"                 # True
Test-Path "supabase/migrations"              # True
Test-Path "tests/e2e"                        # True
Test-Path "docs/adr"                         # True
```

---

#### Step 2.16 — Create `src/lib/env.ts`

This module validates required environment variables at startup. If any required variable is missing or malformed, the application fails fast with a clear message.

Write `K:\E-ParkGO\src\lib\env.ts`:

```typescript
import { z } from 'zod'

const browserEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
})

const serverEnvSchema = browserEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  RECEIPT_SIGNING_SECRET: z.string().min(32, 'RECEIPT_SIGNING_SECRET must be at least 32 characters'),
})

export type BrowserEnv = z.infer<typeof browserEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

export const env = browserEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})

/**
 * Returns validated server-only environment variables.
 * Call only from server-side code: Route Handlers, Server Components, middleware.
 * Throws at startup if any required server variable is missing or malformed.
 */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    ...env,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    APP_ENV: process.env.APP_ENV,
    RECEIPT_SIGNING_SECRET: process.env.RECEIPT_SIGNING_SECRET,
  })
}
```

---

#### Step 2.17 — Tighten `tsconfig.json`

Open `tsconfig.json`. Confirm `"strict": true` is present (create-next-app sets it). Then add two additional flags inside `"compilerOptions"`:

```json
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true
```

**Verify:**

```powershell
Get-Content tsconfig.json | Select-String "noUncheckedIndexedAccess"
Get-Content tsconfig.json | Select-String "exactOptionalPropertyTypes"
```

---

#### Step 2.18 — Write the RED test (proves TDD harness works)

Write `K:\E-ParkGO\tests\unit\env.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

/**
 * Placeholder RED test. Intentionally fails to confirm the test harness works.
 * Replace this with real env.ts validation tests in Phase 3 once .env.local
 * has real Supabase local values.
 */
describe('env validation — RED placeholder', () => {
  it('INTENTIONALLY FAILS: replace with real env tests in Phase 3', () => {
    expect(true).toBe(false)
  })
})
```

Run the test and confirm it fails:

```powershell
npm test
```

**Expected output:** 1 test failed (`INTENTIONALLY FAILS`). This is the correct RED state.

---

#### Step 2.19 — Verify TypeScript and lint pass on existing scaffolding

```powershell
npx tsc --noEmit
```

**Expected:** no output (zero type errors on the scaffolded files).

```powershell
npx next lint
```

**Expected:** "No ESLint warnings or errors" or warnings only (no errors).

If any errors appear, fix them before proceeding. Do not proceed with TypeScript or lint errors outstanding.

---

#### Step 2.20 — Verify production build succeeds

```powershell
npm run build
```

**Expected:** Build completes successfully. The only expected failure is that `.env.local` has placeholder values — if `env.ts` is imported during build and validation throws, temporarily comment out the `env` export line at module level for the build check, then restore it. Do not remove the validation logic.

---

#### Step 2.21 — Phase 2 Gate Checklist

Run each check in order. **All must pass** before starting Phase 3. Record results.

```powershell
# 1. Required tools present
node --version; npm --version; supabase --version; git --version

# 2. TypeScript: zero errors
npx tsc --noEmit
# Expected: no output

# 3. Lint: zero errors
npx next lint
# Expected: no errors (warnings ok)

# 4. RED test fails (correct)
npm test
# Expected: 1 test FAILED

# 5. Production build clean
npm run build
# Expected: Build succeeded

# 6. Directory structure complete
Test-Path "src/app/(protected)/dashboard"
Test-Path "src/features/entry"
Test-Path "src/lib/supabase"
Test-Path "supabase/migrations"
Test-Path "tests/e2e"
Test-Path "docs/adr"
# All: True

# 7. Environment files present
Test-Path ".env.example"; Test-Path ".env.local"
# Both: True

# 8. Key config files present
Test-Path "vitest.config.ts"
Test-Path "playwright.config.ts"
Test-Path "supabase/config.toml"
Test-Path "components.json"
# All: True
```

**Phase 2 is complete when all 8 checks produce the expected results.**

Record: Next.js version, Node version, Supabase CLI version (from check 1 output).

---

#### After Phase 2: Begin Phase 3

When all gate checks pass, update §0.2 Status for Phase 2 to ✅ Complete and Phase 3 to 🔄 ACTIVE.

Then start Phase 3 by:
1. Loading Phase 3 skills: `supabase`, `supabase-postgres-best-practices`, `backend-patterns`.
2. Running `npm run db:start` to start the local Supabase stack.
3. Filling in `.env.local` with the values printed by `supabase start`.
4. Proceeding with the database migration work in §10 (schema) and §8 (domain model).

---

## 1. Executive Implementation Summary

E-ParkGO will be an installable, responsive Progressive Web Application used by parking administrators and general staff to operate one parking facility. Staff will register a vehicle and assign an available space; PostgreSQL will atomically create the parking session, record the official entry time, occupy the space, and issue a secure QR ticket. At exit, staff will scan or enter the ticket number, review a database-calculated fee, record cash payment, and separately confirm exit. Only successful exit confirmation releases the space.

The architecture is a serverless Next.js App Router application deployed on Vercel, backed by Supabase Auth, PostgreSQL, Row Level Security (RLS), Realtime, and narrowly scoped Edge Functions. Browser code owns presentation, forms, camera access, and cached read-only data. Next.js server code validates HTTP inputs and renders protected views. PostgreSQL functions own authoritative timestamps, fee calculations, state transitions, idempotency, audit records, and concurrency-sensitive writes. This boundary keeps the MVP maintainable while preventing client tampering and partial transactions.

### MVP capability

- `ADMIN` and `STAFF` authentication, account disabling, location assignment, and granular approval permissions.
- Parking zones/spaces, vehicles, entries, secure QR tickets, ticket reprints, exit review, cash payments, confirmed exits, cancellations, lost-ticket handling, corrections, shifts, audit logs, dashboards, transaction search, and basic reports.
- Configurable rate rules with immutable per-session snapshots, Philippine-peso calculations, server timestamps, and location-aware business dates.
- Realtime occupancy, installable PWA shell, online/offline indicators, and recently cached read-only operational data.
- Automated unit, component, database, integration, and critical-flow end-to-end tests; migrations, seed data, CI, deployment, rollback, monitoring, and recovery procedures.

### Deferred capability

Automatic number-plate recognition, barrier gates, physical sensors, customer reservations, subscriptions, multi-branch administration, customer mobile accounts, online payments, predictive occupancy, and fraud scoring are post-MVP. The schema retains stable location, device, event, and external-reference boundaries so those capabilities can be added without putting their complexity into the first release.

## 2. Goals, Non-Goals, and Success Criteria

### Project goals

- **Business:** replace handwritten parking records with traceable sessions, accurate fees, and daily revenue reporting.
- **Operations:** make entry, payment, and exit fast on phones, tablets, laptops, and desktops while clearly showing occupancy and exceptions.
- **Integrity:** prevent one vehicle or one space from participating in two active sessions and prevent replayed payments or exits.
- **Security:** apply least privilege, location-scoped RLS, protected permissions, server-generated time and fees, hashed QR tokens, immutable audit evidence, and secret isolation.
- **Reliability:** make each entry, payment, exit, cancellation, and correction atomic and idempotent, with explicit recovery paths.
- **Usability:** provide accessible forms, large touch targets, scanner fallbacks, printable tickets/receipts, and actionable errors.
- **Maintainability:** use typed contracts, small domain modules, migration-driven database changes, automated tests, and observable operations.

### MVP non-goals

- License-plate recognition, automatic gates, space sensors, reservations, customer accounts, subscription parking, multi-facility operations, AI prediction, and advanced fraud detection.
- Card, e-wallet, bank, or other online payment processing.
- Fully offline entry, payment, or exit processing.
- Hardware-specific printer drivers; the MVP produces browser-printable ticket and receipt layouts.
- Guaranteed commercial uptime on Supabase Free or Vercel Hobby.

### Measurable success criteria

| Area | MVP target |
| --- | --- |
| Entry | Trained staff complete a normal entry in at most 45 seconds at p95, excluding customer delay. |
| Ticket validation | A valid scan returns its session in at most 2 seconds at p95 under the pilot load. |
| Fee correctness | 100% agreement with approved fee test vectors and integer-centavo arithmetic. |
| Database integrity | Zero duplicate active vehicle sessions, active space assignments, tickets, payment references, or idempotency operations in concurrency tests. |
| Workflow | Entry-to-paid-exit E2E passes on supported mobile and desktop browsers. |
| Accessibility | Critical flows meet WCAG 2.2 AA automated checks and keyboard/manual review. |
| Availability | Graceful error/offline states; no promise beyond the selected providers' service tiers. |
| Auditability | Every sensitive mutation records actor, location, action, target, timestamp, request correlation, and before/after facts where applicable. |
| Quality | All required test suites pass; changed application code achieves at least 80% statement, branch, function, and line coverage. |
| Recovery | Operators can identify failed requests by correlation ID and execute the documented retry or reconciliation path. |

## 3. Assumptions and Constraints

### Confirmed requirements

- One staff-operated parking facility is delivered as an installable PWA using Next.js, TypeScript, Supabase/PostgreSQL, and Vercel.
- `ADMIN` and `STAFF` are the account roles. Entry, exit, and cashiering are responsibilities, not roles.
- Cash is the initial payment method; server/database logic owns final fees and official timestamps.
- QR tickets carry opaque verification material, not editable parking facts.
- Critical workflows use database constraints, transactions, locking, idempotency, and audit records.
- Exit confirmation requires connectivity in the MVP; offline features must not create authoritative parking or payment state.

### Implementation assumptions

| Decision | Default and rationale |
| --- | --- |
| Facility model | One seeded location for MVP, while every operational row carries `parking_location_id` to enforce isolation and support later expansion. |
| Zones | One or more admin-configurable zones; spaces are unique by `(parking_location_id, code)`. |
| Currency | `PHP`; authoritative amounts are nonnegative `bigint` integer centavos. UI formats `₱` with two decimals. |
| Time | PostgreSQL stores `timestamptz` in UTC. Business dates, overnight boundaries, reports, and display use `Asia/Manila`. Duration uses elapsed UTC time. |
| Payment | Cash only. A unique server-generated receipt number is required; an optional staff-entered external reference is normalized before uniqueness checks. |
| Staff shifts | Recording or reversing cash requires the actor to have an open shift at the same location; entry, ticket validation, and exit confirmation do not require a shift. |
| Paid-exit window | Payment locks the quoted fee for 15 minutes. After that, exit revalidation may require a recorded top-up before release. |
| Internet | Normal operations have internet access. Cached data is clearly marked stale and never authorizes a write. |
| Scale | Pilot target: up to 500 spaces, 50 staff accounts, 20 concurrent staff devices, 5,000 sessions/day, and 100,000 retained sessions before capacity review. |
| Printing | Standard browser print on 58/80 mm thermal paper or A4; no native driver integration. |
| Browsers | Latest two stable versions of Chrome, Edge, and Safari; camera scanning requires secure context and browser permission. Firefox receives functional desktop support where PWA installation differs. |
| Retention | Financial, session, receipt, and audit records are retained for at least five years unless the operator approves a stricter legal policy. |
| Infrastructure | Free tiers are suitable for development, demonstrations, and a limited pilot only; commercial launch requires a capacity, terms, backup, and uptime review. |

### Pre-coding product decisions

The operator must approve the actual rate amounts, grace period, daily-cap interpretation, overnight policy, lost-ticket evidence, discount authority, receipt numbering prefix, data-retention term, and whether vehicle color is mandatory. The architecture and tests below define safe defaults and configuration points without presenting those commercial values as confirmed policy.

## 4. Functional Requirements

Each requirement is accepted only when its behavior is enforced at the appropriate server/database boundary and covered by the test level named in Section 23.

| ID | Requirement and acceptance condition |
| --- | --- |
| AUTH-001 | Staff can sign in with Supabase Auth; invalid, disabled, or unassigned accounts cannot enter protected routes. |
| AUTH-002 | Sessions refresh through secure SSR cookies and sign-out clears local cached operational data before redirecting to login. |
| AUTH-003 | Password recovery uses Supabase recovery links, validates `type=recovery`, updates the password once, and revokes prior sessions. |
| STAFF-001 | An admin can create/invite, assign a location, activate, and disable staff; disabling blocks the next authenticated request. |
| STAFF-002 | An admin can grant named sensitive permissions; users cannot edit their own role, location, or permissions. |
| LOC-001 | An admin can configure the facility, zones, and uniquely coded spaces; a zone with historical sessions is deactivated rather than deleted. |
| SPACE-001 | Staff can view available, occupied, and out-of-service spaces for their assigned location; state changes are realtime and location-filtered. |
| VEH-001 | Entry normalizes the plate to uppercase alphanumeric/hyphen form and creates or reuses the location-visible vehicle record. |
| ENTRY-001 | Staff can create an entry only for an available space and a vehicle without another occupying session. One transaction records server time, actor, session, ticket, rate snapshot, and occupied space. |
| ENTRY-002 | Repeating an entry request with the same idempotency key returns the original durable session/ticket result; the one-time raw QR token is never persisted in the replay record, so a lost issuance response requires controlled ticket reissue. Changing its payload returns `IDEMPOTENCY_CONFLICT`. |
| TICKET-001 | Entry returns a unique printable ticket number and QR verification URL whose opaque token is shown once and only a hash is stored. |
| TICKET-002 | Staff can print additional copies only while the one-time issuance token remains in the current secure browser session. A later reprint request revokes the old credential, issues a replacement ticket/token, and audits both records because hash-only storage cannot reconstruct the original token. |
| TICKET-003 | Validation accepts a QR token or normalized ticket number, rejects revoked/completed/wrong-location tickets, and never changes session state by scanning alone. |
| EXIT-001 | A valid scan or manual lookup opens an exit preview containing vehicle, entry time, duration, rate explanation, amount due, and server-calculated quote expiry. |
| EXIT-002 | Exit preview moves eligible `ACTIVE` sessions to `EXIT_PENDING`; fee calculation moves unpaid sessions to `PAYMENT_PENDING` without releasing the space. |
| PAY-001 | Staff with an open same-location shift can record an exact cash payment against a locked, current quote; the transaction creates payment/audit records and moves the session to `PAID_AWAITING_EXIT`. |
| PAY-002 | Duplicate idempotency keys or payment references cannot create a second payment. Ordinary staff cannot void payments. |
| EXIT-003 | Staff separately confirms a paid exit; the transaction records server exit time, completes the session, marks the ticket completed, releases the space, and audits the actor. |
| EXIT-004 | If the paid-exit window expires and fees increased, confirmation returns `PAYMENT_REQUIRED` with the top-up amount and does not release the space. |
| RATE-001 | Admins can create versioned effective-dated rates; invalid overlapping configurations are rejected. Published versions are immutable. |
| RATE-002 | Each entry stores an immutable rate snapshot so later rate changes cannot alter historical fees. |
| LOST-001 | Staff with `can_process_lost_tickets` can place a session in `LOST_TICKET`, verify vehicle evidence, apply the configured penalty, issue a replacement ticket if needed, and audit the approval. |
| OVR-001 | Staff with the relevant permission can request cancellation, time correction, discount, complimentary handling, or manual adjustment with a reason; the database records approver and append-only evidence. |
| OVR-002 | Corrections never overwrite a payment, receipt, ticket, or audit row; they create compensating records and a recalculated snapshot where policy permits. |
| AUDIT-001 | Admins can search immutable audit events by date, actor, action, target, correlation ID, and location; no application role can update or delete them. |
| DASH-001 | The dashboard shows capacity, available/occupied/out-of-service spaces, occupancy percentage, active sessions, entries/exits today, pending payments, paid-awaiting-exit, and revenue today. |
| REALTIME-001 | Relevant space and session changes update connected dashboards; reconnect triggers a canonical refetch and displays a stale indicator until complete. |
| REPORT-001 | Authorized users can run paginated transaction, occupancy, shift, and daily revenue reports using `Asia/Manila` business dates and export CSV with audit logging. |
| SHIFT-001 | Staff can start one open shift per location/device and close it with expected/declared cash totals; discrepancies are recorded, not erased. |
| PWA-001 | Supported devices can install the application from a valid manifest and receive a controlled update prompt when a new service worker activates. |
| OFFLINE-001 | Offline users can open the cached shell and explicitly labeled recent read-only data; mutation controls are disabled with a reconnect instruction. |
| RECOVERY-001 | Retriable failures preserve form input and correlation ID; idempotent retry cannot duplicate an operation. Non-retriable conflicts direct staff to refresh or request approval. |
| DEVICE-001 | A device can be registered, named, assigned to a location, and revoked; device identity supplements but never replaces user authentication. |
| ADMIN-001 | Settings changes require admin authorization, schema validation, effective dating where applicable, and an audit event. |

## 5. Nonfunctional Requirements

| ID | Requirement and target |
| --- | --- |
| PERF-001 | Protected page server response p95 below 2 seconds and mutation p95 below 2 seconds at pilot load, excluding provider outage and camera acquisition. |
| PERF-002 | Dashboard uses bounded aggregate queries, pagination, and targeted subscriptions; no unbounded table scan or subscribe-to-all pattern. |
| REL-001 | Critical mutations are atomic, idempotent, and safe under at least 20 concurrent clients in database tests. |
| REL-002 | UI distinguishes validation, authorization, conflict, transient, offline, and internal failures; no error is silently swallowed. |
| SEC-001 | RLS is enabled and tested on every exposed table; service-role credentials never enter client bundles or logs. |
| SEC-002 | All inputs are schema-validated, output is context-escaped, mutation origins are checked, login/verification endpoints are rate-limited, and security headers are enabled. |
| PRIV-001 | Collect only operational vehicle/staff data, restrict exports, redact secrets/tokens, and document retention and deletion authority. |
| A11Y-001 | Critical workflows conform to WCAG 2.2 AA: keyboard operation, visible focus, labels, announcements, contrast, reduced motion, and non-color status cues. |
| UX-001 | Layout works from 360 px mobile width through desktop; primary touch targets are at least 44 by 44 CSS pixels. |
| COMPAT-001 | Test the latest two stable Chrome, Edge, and Safari releases; provide manual ticket entry when camera/PWA APIs are unavailable. |
| MAINT-001 | TypeScript strict mode, focused modules, functions normally under 50 lines, files normally 200-400 lines and never above 800 without documented exception. |
| OBS-001 | Every request has a correlation ID; structured logs capture operation, result, latency, actor ID, and location without QR tokens, credentials, or unnecessary PII. |
| DR-001 | Daily logical backups/exports are encrypted and restoration is rehearsed at least quarterly before commercial use. Pilot recovery objectives: RPO 24 hours, RTO 4 hours. |
| AUD-001 | Audit and financial records are append-only to application roles, timestamped by the database, and queryable for the approved retention period. |
| I18N-001 | Durations use UTC instants; business dates and display use `Asia/Manila`; currency uses integer centavos and locale-aware PHP formatting. |
| SCALE-001 | Design supports the stated pilot scale without adding a traditional always-running server; load tests establish upgrade thresholds before launch. |

## 6. Complete System Architecture

```text
Staff browser / installed PWA
  | HTTPS, Supabase SSR session, idempotency key, correlation ID
  v
Vercel: Next.js App Router
  |-- Server Components: protected reads and initial rendering
  |-- Client Components: forms, camera scanner, realtime UI, IndexedDB
  |-- Route Handlers: Zod validation, origin/CSRF checks, response mapping
  |-- Service worker: shell/static cache; never authoritative writes
  |
  | user-scoped Supabase client (publishable key + access token)
  v
Supabase
  |-- Auth: identity, recovery, token lifecycle
  |-- PostgREST/RLS: location-scoped reads
  |-- PostgreSQL RPC: atomic entry/payment/exit/correction/shift workflows
  |-- Realtime: filtered space/session operational events
  |-- Edge Functions: receipts/exports and future external integrations
  |-- Private Storage: generated artifacts only when required
  v
PostgreSQL: constraints, locks, rate snapshots, audit evidence, UTC clock
```

### Responsibility boundaries

| Layer | Owns | Must not own |
| --- | --- | --- |
| Browser | Input assistance, accessible presentation, camera, local UI state, read-only cache, realtime reconciliation | Official time, final fee, authorization, status transition, payment truth, space release, service secrets |
| Next.js server | SSR auth checks, protected route rendering, request schema validation, mutation origin/CSRF validation, correlation IDs, user-friendly error mapping | Duplicated fee/state logic or service-role bypass of normal staff authorization |
| PostgreSQL | Data integrity, RLS, actor/location authorization, server time, fee calculation, transitions, row/advisory locks, idempotency, audit | UI formatting, camera behavior, printable layouts |
| Edge Functions | Public/rate-limited external boundaries, receipt/export generation, notifications/webhooks, scheduled maintenance where needed | Routine CRUD or logic already safely transactional in PostgreSQL |
| Realtime | Invalidation hints and small location-filtered operational updates | Canonical state or full historical-report streaming |
| IndexedDB | Versioned cache of non-sensitive reference/recent read data and sync metadata | Queued entry, payment, exit, role, permission, QR token, or authoritative fee records |
| Vercel | Next.js delivery, HTTPS/CDN, previews, security headers, deployment promotion | Database transaction orchestration outside PostgreSQL |

Server Components load the session, profile, permissions, and initial data with a cookie-aware server client. Client Components are limited to interactive islands. Mutations normally pass through same-origin Route Handlers, which validate the web contract and call RPCs with the user's access token so database RLS and function authorization remain decisive. Stable reads may use RLS-protected Supabase clients directly. Business logic has one authoritative implementation in PostgreSQL and shared types are generated from the schema.

## 7. Recommended Repository Structure

```text
e-parkgo/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/ and auth/callback/
│  │  ├─ (protected)/
│  │  │  ├─ dashboard/ entry/ tickets/[ticketNumber]/ scanner/
│  │  │  ├─ exit/[sessionId]/ payments/ sessions/ spaces/
│  │  │  ├─ transactions/ rates/ staff/ shifts/ reports/
│  │  │  ├─ audit/ settings/ offline/ and error.tsx
│  │  ├─ api/{entries,tickets,exit,payments,reports}/
│  │  ├─ layout.tsx, manifest.ts, and globals.css
│  ├─ components/
│  │  ├─ ui/                 # shadcn/ui primitives
│  │  ├─ forms/ scanner/ tickets/ dashboard/ spaces/ reports/
│  │  └─ shared/             # errors, empty/loading states, navigation
│  ├─ features/
│  │  ├─ auth/ entry/ exit/ payments/ rates/ shifts/ reports/
│  │  └─ each with schemas, server service, queries, and components
│  ├─ lib/
│  │  ├─ supabase/{browser,server,middleware,types}.ts
│  │  ├─ auth/ errors/ money/ time/ security/ observability/
│  │  ├─ realtime/ offline/ pwa/ and query/
│  │  └─ env.ts
│  ├─ hooks/ and types/
│  └─ middleware.ts
├─ public/
│  ├─ icons/ and offline.html
│  └─ sw.js                    # generated/managed by selected PWA tooling
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/
│  ├─ seed.sql
│  ├─ tests/                  # pgTAP: constraints, RLS, RPC, concurrency
│  └─ functions/{receipt,export}/
├─ tests/
│  ├─ unit/ integration/ e2e/ fixtures/ and helpers/
├─ docs/
│  ├─ architecture/ operations/ security/ and adr/
├─ .env.example, package.json, playwright.config.ts, and vitest.config.ts
└─ PLAN.md
```

Routes group by user workflow, while `features/` owns cohesive domain-facing UI and server adapters. Cross-domain infrastructure lives in `lib/`; generated database types are never manually edited. SQL migrations are the schema source of truth. Tests mirror user capabilities rather than internal file types. New team knowledge belongs under `docs/`, while agent assets remain in the existing `.agents/` and `contexts/` surfaces.

## 8. Domain Model and Business Rules

| Entity | Purpose, ownership, lifecycle, and key validation |
| --- | --- |
| Profile | Protected extension of `auth.users`; belongs to one location, has `ADMIN` or `STAFF`, and is deactivated rather than deleted. |
| Staff permission | One-to-one capability flags for sensitive operations; admin-managed, location-scoped, and never self-editable. |
| Parking location | Facility identity, timezone, currency, receipt prefix, and operational settings; one active MVP row. |
| Parking zone | Named grouping within a location; codes are unique and historical zones are deactivated. |
| Parking space | Uniquely coded space with vehicle compatibility and `AVAILABLE`, `OCCUPIED`, or `OUT_OF_SERVICE` status; writes occur through RPCs. |
| Vehicle | Normalized plate plus display plate, type, and optional color; reused across sessions without exposing unrelated-location activity. |
| Parking session | Aggregate root for entry-to-exit lifecycle, actors, space, times, state, fee totals, and version. Terminal rows are immutable except append-only corrections. |
| Parking ticket | One active verification credential per session; has public ticket number, token hash, status, reprint count, and revocation/completion facts. |
| Parking rate | Effective-dated, versioned rule owned by location and optional vehicle type; published versions are immutable. |
| Rate snapshot | Complete rate configuration copied for one session so historical calculations never depend on mutable configuration. |
| Payment | Append-only cash transaction or compensating void/top-up linked to a session and shift; amount and receipt reference are unique/integrity checked. |
| Receipt | Immutable receipt metadata and optional private artifact path; regeneration creates a new artifact version without changing payment truth. |
| Staff shift | Staff/device/location cash-accountability window with declared and computed totals; only one open shift per staff/location. |
| Device | Optional registered workstation identity, location assignment, last-seen, and revocation state; never an authentication substitute. |
| Audit log | Append-only evidence of sensitive actions, result, actor, target, correlation, reason, and safe before/after data. |
| Idempotency key | Hash of actor, operation, key, and canonical request; stores a stable sanitized response for exact retries and detects changed-payload reuse. Bearer credentials such as raw QR tokens are never stored. |
| Session correction | Append-only before/after evidence for an authorized time, space, fee, payment, or state correction; records reason, requester, approver, and correlation. |
| Rate-limit bucket | Private actor/location/operation time bucket used inside abuse-sensitive RPCs so direct Data API calls cannot bypass enforcement. |

### Critical invariants

1. A normalized vehicle and a parking space can each have at most one occupying session across all nonterminal states.
2. Database time is authoritative for entry, fee quote, payment, and exit. Client timestamps are informational only.
3. QR validation is a read/preview operation; it cannot record payment or release a space.
4. Completed or revoked tickets cannot be reused. Token hashes, not raw tokens, are stored.
5. Payment and exit are separate idempotent transactions. Exit requires sufficient non-voided payment and a current quote.
6. A space is released only when exit completes, cancellation safely unwinds an unpaid session, or an authorized corrective transaction explicitly releases it.
7. Published rates and per-session snapshots are immutable. Calculations use the entry snapshot except explicitly approved penalties/adjustments.
8. Sensitive changes require a named permission, reason, correlation ID, and audit evidence. Client-supplied actor IDs are ignored.
9. Cancellation and correction never delete historical facts; compensating rows explain financial changes.
10. Every read and mutation is restricted to the authenticated profile's location unless an explicitly designed cross-location admin scope is later added.

## 9. Parking Session State Machine

`COMPLETED` and `CANCELLED` are terminal. `LOST_TICKET` and `MANUAL_REVIEW` remain occupying states until an authorized resolution. Each transition locks the session row, validates the current version and actor, updates related records atomically, and appends an audit event. A failed transaction changes nothing.

| State | Meaning | Allowed incoming | Allowed outgoing and actor/validation |
| --- | --- | --- | --- |
| `ACTIVE` | Vehicle is parked with a valid active ticket. | New entry only | `EXIT_PENDING` by staff after valid lookup; `LOST_TICKET` by permitted staff; `CANCELLED` by permitted staff only if cancellation rules pass; `MANUAL_REVIEW` on authorized exception. |
| `EXIT_PENDING` | Ticket was validated and exit review began. | `ACTIVE`, resolved `MANUAL_REVIEW` | `PAYMENT_PENDING` when authoritative calculation finds an amount due; `PAID_AWAITING_EXIT` with an audited `NOT_REQUIRED` settlement when the total is zero; `ACTIVE` when review is abandoned safely; `LOST_TICKET` or `MANUAL_REVIEW` on exception. |
| `PAYMENT_PENDING` | A current fee is due. | `EXIT_PENDING`, expired paid-exit window, `LOST_TICKET` resolution | `PAID_AWAITING_EXIT` after exact valid payment; `MANUAL_REVIEW` for authorized dispute; `CANCELLED` is prohibited once financial evidence exists. |
| `PAID_AWAITING_EXIT` | Required payment was recorded or an auditable zero-fee settlement was marked `NOT_REQUIRED`; space remains occupied. | `PAYMENT_PENDING`, zero-fee `EXIT_PENDING` | `COMPLETED` after separate confirmation within the paid-exit window; `PAYMENT_PENDING` if a later fee delta is due; `MANUAL_REVIEW` on discrepancy. |
| `COMPLETED` | Exit time is final, ticket completed, and space released. | `PAID_AWAITING_EXIT` or authorized zero-fee resolution | None. Corrections append evidence without reopening the state. |
| `CANCELLED` | Entry was invalidated by an authorized, evidenced workflow and the space was released. | `ACTIVE` or eligible `EXIT_PENDING` | None. Payment is forbidden. |
| `LOST_TICKET` | Physical/digital ticket is unavailable; space remains occupied. | Any nonterminal unpaid state | `PAYMENT_PENDING` after identity/evidence checks and penalty calculation; `MANUAL_REVIEW` if evidence is insufficient; permitted cancellation only under explicit policy. |
| `MANUAL_REVIEW` | An exception blocks automatic progression; space remains occupied. | Any nonterminal state | Return to the recorded prior eligible state, `PAYMENT_PENDING`, `PAID_AWAITING_EXIT`, or authorized terminal resolution according to reviewed evidence. |

Illegal transitions return `INVALID_STATUS_TRANSITION` without side effects. Optimistic version checks prevent stale screens from overwriting newer work. A scan of `COMPLETED` returns `TICKET_ALREADY_COMPLETED`; payment against `CANCELLED` returns `SESSION_CANCELLED`; unpaid exit returns `PAYMENT_REQUIRED`.

| State | Required database/audit effects and failure behavior |
| --- | --- |
| `ACTIVE` | Session, ticket, snapshot, occupied space, entry actor/time, and entry audit already exist. Failed lookup leaves all unchanged. |
| `EXIT_PENDING` | Set review-start time/version and scan audit; do not write payment/exit/release. Abandoned review uses an explicit audited reset. |
| `PAYMENT_PENDING` | Persist itemized quote, fee version/expiry, and calculation audit. Failure rolls back quote/state together. |
| `PAID_AWAITING_EXIT` | Persist append-only payment/receipt when money is due, or an audited `NOT_REQUIRED` zero settlement; record actor/time and current settlement facts while space/ticket stay occupied/active. Duplicate exact request returns the original result. |
| `COMPLETED` | Persist official exit/duration, exit actor, terminal ticket/session, released space, version, and audit atomically. Any validation failure leaves the space occupied. |
| `CANCELLED` | Persist cancellation actor/reason/time, revoked/cancelled ticket, released space, correction/audit. Ineligible or paid session fails without release. |
| `LOST_TICKET` | Persist lost-ticket evidence/reason/approver, revoke/reissue facts where applicable, penalty basis, and audit; insufficient evidence routes to manual review. |
| `MANUAL_REVIEW` | Persist reason/source state/version and exception audit; resolution appends correction/approval evidence and cannot bypass payment or jump directly to an unsupported terminal state. |

## 10. Database ERD and Complete Schema Plan

### Textual ERD

```text
auth.users 1--1 profiles *--1 parking_locations 1--* parking_zones 1--* parking_spaces
profiles 1--1 staff_permissions
parking_locations 1--* vehicles
vehicles 1--* parking_sessions *--1 parking_spaces
parking_sessions 1--* parking_tickets
parking_sessions 1--1 parking_rate_snapshots *--1 parking_rates
parking_sessions 1--* payments 1--* receipts
parking_sessions 1--* session_corrections
profiles 1--* staff_shifts *--1 devices
profiles 1--* audit_logs; parking_sessions 1--* audit_logs
profiles 1--* idempotency_keys
```

### Enum strategy

Use schema-owned PostgreSQL enums for stable lifecycle values (`app_role`, `space_status`, `session_status`, `ticket_status`, `session_payment_status`, `payment_kind`, `rate_mode`, `shift_status`) and reference tables for operator-extensible values such as vehicle types. `session_payment_status` contains `UNPAID`, `PAID`, `NOT_REQUIRED`, and `VOIDED`; `payment_kind` contains `COLLECTION`, `TOP_UP`, and `REVERSAL`; `rate_mode` contains `TIERED` and `FLAT`. Add enum values only through forward migrations. All timestamps are `timestamptz`; identifiers are `uuid` generated with `gen_random_uuid()`; money is `bigint` centavos with nonnegative checks. Unless a nullable field or alternative default is stated below, required business columns are `NOT NULL`; all mutable tables include database-defaulted `created_at` and `updated_at`.

### Tables and columns

| Table | Required columns and constraints |
| --- | --- |
| `profiles` | `id uuid PK/FK auth.users`, `parking_location_id uuid FK`, `role app_role`, `full_name text`, `is_active boolean default true`, `disabled_at timestamptz`, `created_at`, `updated_at`; nonblank name and disabled-state consistency. |
| `staff_permissions` | `profile_id uuid PK/FK`, `can_approve_overrides`, `can_void_payments`, `can_process_lost_tickets`, `can_correct_session_times`, and `can_cancel_sessions` booleans default false, `updated_by uuid FK`, timestamps; only protected admin/RPC writes. |
| `parking_locations` | `id`, `code citext UNIQUE`, `name`, `timezone default 'Asia/Manila'`, `currency char(3) default 'PHP'`, `receipt_prefix`, `settings jsonb default '{}'`, `is_active`, timestamps; validate timezone and bounded settings schema. |
| `parking_zones` | `id`, `parking_location_id`, `code citext`, `name`, `sort_order int`, `is_active`, timestamps; `UNIQUE(location_id, code)`. |
| `vehicle_types` | `id`, `parking_location_id`, `code citext`, `name`, `is_active`; unique location/code. |
| `parking_spaces` | `id`, `parking_location_id`, `zone_id`, `code citext`, `vehicle_type_id nullable`, `status space_status`, `version bigint default 1`, `is_active`, timestamps; unique location/code and zone/location consistency enforced by composite FKs. |
| `vehicles` | `id`, `parking_location_id`, `display_plate_number`, `normalized_plate_number`, `vehicle_type_id`, `color nullable`, timestamps; normalized plate check and `UNIQUE(location_id, normalized_plate_number)`; one vehicle row may have many historical sessions. |
| `parking_rates` | `id`, `parking_location_id`, `vehicle_type_id nullable`, `version int`, `mode text`, `grace_minutes`, `initial_minutes`, `initial_fee_centavos`, `succeeding_interval_minutes`, `succeeding_fee_centavos`, `flat_fee_centavos nullable`, `daily_max_centavos nullable`, `overnight_fee_centavos`, `lost_ticket_penalty_centavos`, `effective_from`, `effective_to nullable`, `is_published`, `created_by`, timestamps; mode-specific checks and exclusion constraint prevent invalid or overlapping published ranges per scope. |
| `parking_rate_snapshots` | `id`, `parking_session_id UNIQUE`, `parking_rate_id`, `rate_version`, copied mode/minute/centavo/cap/overnight/penalty fields, `snapshot_json jsonb`, `snapshot_hash bytea`, `created_at`; no update/delete grants. |
| `parking_sessions` | `id`, `parking_location_id`, `vehicle_id`, `parking_space_id`, `status`, actor FKs, `entry_time`, `exit_time`, `fee_calculated_at`, `quote_expires_at`, `total_minutes`, `subtotal_centavos`, `discount_centavos`, `penalty_centavos`, `adjustment_centavos`, `total_centavos`, `payment_status`, `version`, timestamps; time/order and money checks. |
| `parking_tickets` | `id`, `parking_session_id`, `parking_location_id`, `ticket_number citext UNIQUE`, `qr_token_hash bytea UNIQUE`, `status`, `issued_at`, `expires_at nullable`, `reissue_of_ticket_id nullable`, `reprint_count`, `last_reprinted_at`, `revoked_at`, `completed_at`; hash length/lifecycle checks and one active ticket per session via partial unique index. |
| `payments` | `id`, `parking_session_id`, `parking_location_id`, `staff_shift_id nullable`, `kind payment_kind`, `amount_centavos`, `cash_tendered_centavos nullable`, `change_centavos nullable`, `receipt_number citext UNIQUE`, `external_reference citext nullable`, `reverses_payment_id nullable`, `processed_by`, `processed_at`, `reason nullable`; append-only rows, positive amounts, cash/change checks for collections, and one reversal per referenced payment. |
| `receipts` | `id`, `parking_location_id`, `payment_id`, `version int`, `artifact_path nullable`, `content_hash text`, `generated_at`, `generated_by`; composite same-location FKs, unique payment/version, and no destructive writes. |
| `staff_shifts` | `id`, `parking_location_id`, `profile_id`, `device_id nullable`, `status`, `opened_at`, `closed_at`, `opening_float_centavos`, `expected_cash_centavos`, `declared_cash_centavos`, `variance_centavos`, notes; time and close-total consistency. |
| `devices` | `id`, `parking_location_id`, `name`, `public_identifier citext`, `is_active`, `last_seen_at`, `revoked_at`, timestamps; unique public identifier. |
| `session_corrections` | `id`, `parking_session_id`, `parking_location_id`, `correction_type`, `before_data jsonb`, `after_data jsonb`, `reason`, `requested_by`, `approved_by`, `correlation_id`, `created_at`; append-only, same-location constrained, and no direct client writes. |
| `audit_logs` | `id bigint generated always as identity`, `parking_location_id`, `actor_id`, `action`, `target_type`, `target_id`, `result`, `reason`, `correlation_id uuid`, `request_metadata jsonb`, `before_data jsonb`, `after_data jsonb`, `created_at default clock_timestamp()`; insert-only through trusted functions. |
| `idempotency_keys` | `id`, `actor_id`, `parking_location_id`, `operation`, `key uuid`, `request_hash bytea`, `resource_id`, `response_json jsonb`, `status`, `locked_until`, `expires_at`, timestamps; unique `(actor_id, operation, key)`. `response_json` is sanitized and excludes tokens, secrets, cookies, and bearer credentials. |
| `rate_limit_buckets` | `id`, `actor_id`, `parking_location_id`, `operation`, `bucket_start`, `request_count`, `blocked_until nullable`, `updated_at`; private/unexposed and unique `(actor_id, operation, bucket_start)` for transactional RPC-side throttling. |

### Canonical column contract

The implementation migrations must use this baseline; `FK` targets are explicit and operational/history parents use `ON DELETE RESTRICT` unless `CASCADE` is stated for a true owned extension.

```text
parking_locations(
  id uuid PK DEFAULT gen_random_uuid(), code citext NOT NULL UNIQUE,
  name text NOT NULL, timezone text NOT NULL DEFAULT 'Asia/Manila',
  currency char(3) NOT NULL DEFAULT 'PHP', receipt_prefix text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}', is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
)

profiles(
  id uuid PK FK auth.users(id) ON DELETE RESTRICT,
  parking_location_id uuid NOT NULL FK parking_locations(id) ON DELETE RESTRICT,
  role app_role NOT NULL DEFAULT 'STAFF', full_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true, disabled_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, parking_location_id)
)

staff_permissions(
  profile_id uuid PK FK profiles(id) ON DELETE CASCADE,
  can_approve_overrides boolean NOT NULL DEFAULT false,
  can_void_payments boolean NOT NULL DEFAULT false,
  can_process_lost_tickets boolean NOT NULL DEFAULT false,
  can_correct_session_times boolean NOT NULL DEFAULT false,
  can_cancel_sessions boolean NOT NULL DEFAULT false,
  updated_by uuid NULL FK profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
)

parking_zones(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL FK parking_locations(id),
  code citext NOT NULL, name text NOT NULL, sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(parking_location_id, code),
  UNIQUE(id, parking_location_id)
)

vehicle_types(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL FK parking_locations(id),
  code citext NOT NULL, name text NOT NULL, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parking_location_id, code), UNIQUE(id, parking_location_id)
)

parking_spaces(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL,
  zone_id uuid NOT NULL, code citext NOT NULL, vehicle_type_id uuid NULL,
  status space_status NOT NULL DEFAULT 'AVAILABLE', version bigint NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(parking_location_id, code),
  UNIQUE(id, parking_location_id),
  FK(zone_id, parking_location_id) -> parking_zones(id, parking_location_id),
  FK(vehicle_type_id, parking_location_id) -> vehicle_types(id, parking_location_id)
)

vehicles(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL FK parking_locations(id),
  display_plate_number text NOT NULL, normalized_plate_number text NOT NULL,
  vehicle_type_id uuid NOT NULL, color text NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parking_location_id, normalized_plate_number), UNIQUE(id, parking_location_id),
  FK(vehicle_type_id, parking_location_id) -> vehicle_types(id, parking_location_id)
)

parking_rates(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL FK parking_locations(id),
  vehicle_type_id uuid NULL, version integer NOT NULL, mode rate_mode NOT NULL,
  grace_minutes integer NOT NULL DEFAULT 0, initial_minutes integer NULL,
  initial_fee_centavos bigint NULL, succeeding_interval_minutes integer NULL,
  succeeding_fee_centavos bigint NULL, flat_fee_centavos bigint NULL,
  daily_max_centavos bigint NULL, overnight_fee_centavos bigint NOT NULL DEFAULT 0,
  lost_ticket_penalty_centavos bigint NOT NULL DEFAULT 0,
  effective_from timestamptz NOT NULL, effective_to timestamptz NULL,
  is_published boolean NOT NULL DEFAULT false, created_by uuid NOT NULL FK profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, parking_location_id),
  UNIQUE NULLS NOT DISTINCT (parking_location_id, vehicle_type_id, version),
  FK(vehicle_type_id, parking_location_id) -> vehicle_types(id, parking_location_id),
  FK(created_by, parking_location_id) -> profiles(id, parking_location_id)
)

parking_sessions(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL FK parking_locations(id),
  vehicle_id uuid NOT NULL, parking_space_id uuid NOT NULL,
  status session_status NOT NULL DEFAULT 'ACTIVE',
  payment_status session_payment_status NOT NULL DEFAULT 'UNPAID',
  entry_processed_by uuid NOT NULL FK profiles(id), payment_processed_by uuid NULL FK profiles(id),
  exit_processed_by uuid NULL FK profiles(id), override_approved_by uuid NULL FK profiles(id),
  entry_time timestamptz NOT NULL DEFAULT clock_timestamp(), exit_time timestamptz NULL,
  fee_calculated_at timestamptz NULL, quote_expires_at timestamptz NULL,
  total_minutes integer NULL, subtotal_centavos bigint NULL, discount_centavos bigint NULL,
  penalty_centavos bigint NULL, adjustment_centavos bigint NULL, total_centavos bigint NULL,
  version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id, parking_location_id),
  FK(vehicle_id, parking_location_id) -> vehicles(id, parking_location_id),
  FK(parking_space_id, parking_location_id) -> parking_spaces(id, parking_location_id),
  FK(entry_processed_by, parking_location_id) -> profiles(id, parking_location_id),
  FK(payment_processed_by, parking_location_id) -> profiles(id, parking_location_id),
  FK(exit_processed_by, parking_location_id) -> profiles(id, parking_location_id),
  FK(override_approved_by, parking_location_id) -> profiles(id, parking_location_id)
)

parking_rate_snapshots(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL,
  parking_session_id uuid NOT NULL UNIQUE, parking_rate_id uuid NOT NULL, rate_version integer NOT NULL,
  mode rate_mode NOT NULL, grace_minutes integer NOT NULL,
  initial_minutes integer NULL, initial_fee_centavos bigint NULL,
  succeeding_interval_minutes integer NULL, succeeding_fee_centavos bigint NULL,
  flat_fee_centavos bigint NULL, daily_max_centavos bigint NULL,
  overnight_fee_centavos bigint NOT NULL, lost_ticket_penalty_centavos bigint NOT NULL,
  snapshot_json jsonb NOT NULL, snapshot_hash bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FK(parking_session_id, parking_location_id) -> parking_sessions(id, parking_location_id),
  FK(parking_rate_id, parking_location_id) -> parking_rates(id, parking_location_id)
)

parking_tickets(
  id uuid PK DEFAULT gen_random_uuid(), parking_session_id uuid NOT NULL,
  parking_location_id uuid NOT NULL FK parking_locations(id), ticket_number citext NOT NULL UNIQUE,
  qr_token_hash bytea NOT NULL UNIQUE, status ticket_status NOT NULL DEFAULT 'ACTIVE',
  reissue_of_ticket_id uuid NULL FK parking_tickets(id), issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NULL, reprint_count integer NOT NULL DEFAULT 0,
  last_reprinted_at timestamptz NULL, revoked_at timestamptz NULL,
  completed_at timestamptz NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, parking_location_id),
  FK(parking_session_id, parking_location_id) -> parking_sessions(id, parking_location_id),
  FK(reissue_of_ticket_id, parking_location_id) -> parking_tickets(id, parking_location_id)
)

staff_shifts(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL FK parking_locations(id),
  profile_id uuid NOT NULL FK profiles(id), device_id uuid NULL,
  status shift_status NOT NULL DEFAULT 'OPEN', opened_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  closed_at timestamptz NULL, opening_float_centavos bigint NOT NULL DEFAULT 0,
  expected_cash_centavos bigint NULL, declared_cash_centavos bigint NULL,
  variance_centavos bigint NULL, notes text NULL, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id, parking_location_id),
  FK(profile_id, parking_location_id) -> profiles(id, parking_location_id),
  FK(device_id, parking_location_id) -> devices(id, parking_location_id) added after devices migration
)

payments(
  id uuid PK DEFAULT gen_random_uuid(), parking_session_id uuid NOT NULL,
  parking_location_id uuid NOT NULL FK parking_locations(id), staff_shift_id uuid NULL FK staff_shifts(id),
  kind payment_kind NOT NULL, amount_centavos bigint NOT NULL,
  cash_tendered_centavos bigint NULL, change_centavos bigint NULL,
  receipt_number citext NOT NULL UNIQUE, external_reference citext NULL,
  reverses_payment_id uuid NULL FK payments(id), processed_by uuid NOT NULL FK profiles(id),
  processed_at timestamptz NOT NULL DEFAULT clock_timestamp(), reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(parking_location_id, external_reference),
  UNIQUE(id, parking_location_id),
  FK(parking_session_id, parking_location_id) -> parking_sessions(id, parking_location_id),
  FK(staff_shift_id, parking_location_id) -> staff_shifts(id, parking_location_id),
  FK(processed_by, parking_location_id) -> profiles(id, parking_location_id),
  FK(reverses_payment_id, parking_location_id) -> payments(id, parking_location_id)
)

receipts(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL FK parking_locations(id),
  payment_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1, artifact_path text NULL, content_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT clock_timestamp(), generated_by uuid NOT NULL,
  UNIQUE(payment_id, version),
  FK(payment_id, parking_location_id) -> payments(id, parking_location_id),
  FK(generated_by, parking_location_id) -> profiles(id, parking_location_id)
)

devices(
  id uuid PK DEFAULT gen_random_uuid(), parking_location_id uuid NOT NULL FK parking_locations(id),
  name text NOT NULL, public_identifier citext NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true, last_seen_at timestamptz NULL,
  revoked_at timestamptz NULL, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id, parking_location_id)
)

session_corrections(
  id uuid PK DEFAULT gen_random_uuid(), parking_session_id uuid NOT NULL,
  parking_location_id uuid NOT NULL FK parking_locations(id), correction_type text NOT NULL,
  before_data jsonb NOT NULL, after_data jsonb NOT NULL, reason text NOT NULL,
  requested_by uuid NOT NULL FK profiles(id), approved_by uuid NULL FK profiles(id),
  correlation_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FK(parking_session_id, parking_location_id) -> parking_sessions(id, parking_location_id),
  FK(requested_by, parking_location_id) -> profiles(id, parking_location_id),
  FK(approved_by, parking_location_id) -> profiles(id, parking_location_id)
)

audit_logs(
  id bigint GENERATED ALWAYS AS IDENTITY PK, parking_location_id uuid NOT NULL FK parking_locations(id),
  actor_id uuid NULL FK profiles(id), action text NOT NULL, target_type text NOT NULL,
  target_id uuid NULL, result text NOT NULL, reason text NULL, correlation_id uuid NOT NULL,
  request_metadata jsonb NOT NULL DEFAULT '{}', before_data jsonb NULL, after_data jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FK(actor_id, parking_location_id) -> profiles(id, parking_location_id)
)

idempotency_keys(
  id uuid PK DEFAULT gen_random_uuid(), actor_id uuid NOT NULL FK profiles(id),
  parking_location_id uuid NOT NULL FK parking_locations(id), operation text NOT NULL,
  key uuid NOT NULL, request_hash bytea NOT NULL, resource_id uuid NULL,
  response_json jsonb NULL, status text NOT NULL, locked_until timestamptz NULL,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(actor_id, operation, key),
  FK(actor_id, parking_location_id) -> profiles(id, parking_location_id)
)

rate_limit_buckets(
  id uuid PK DEFAULT gen_random_uuid(), actor_id uuid NOT NULL FK profiles(id),
  parking_location_id uuid NOT NULL FK parking_locations(id), operation text NOT NULL,
  bucket_start timestamptz NOT NULL, request_count integer NOT NULL DEFAULT 0,
  blocked_until timestamptz NULL, updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(actor_id, operation, bucket_start),
  FK(actor_id, parking_location_id) -> profiles(id, parking_location_id)
)
```

Checks enforce bounded nonblank text; known timezone/currency; nonnegative money/minutes/counts; positive configured intervals; mode-consistent rate fields; `effective_to > effective_from`; 32-byte hashes; correction/reversal reason length; collection cash/change consistency; reversal reference/kind consistency; terminal state/time/payment consistency; and matching location across composite FKs. Lifecycle fields are intentionally nullable until their corresponding transition succeeds.

### Integrity and indexes

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE parking_rates
ADD CONSTRAINT no_overlapping_published_rates
EXCLUDE USING gist (
  parking_location_id WITH =,
  (COALESCE(vehicle_type_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
  (tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)')) WITH &&
) WHERE (is_published);

CREATE UNIQUE INDEX one_occupying_session_per_vehicle
ON parking_sessions (parking_location_id, vehicle_id)
WHERE status IN ('ACTIVE','EXIT_PENDING','PAYMENT_PENDING',
                 'PAID_AWAITING_EXIT','LOST_TICKET','MANUAL_REVIEW');

CREATE UNIQUE INDEX one_occupying_session_per_space
ON parking_sessions (parking_location_id, parking_space_id)
WHERE status IN ('ACTIVE','EXIT_PENDING','PAYMENT_PENDING',
                 'PAID_AWAITING_EXIT','LOST_TICKET','MANUAL_REVIEW');

CREATE UNIQUE INDEX one_open_shift_per_staff_location
ON staff_shifts (parking_location_id, profile_id) WHERE status = 'OPEN';

CREATE UNIQUE INDEX one_active_ticket_per_session
ON parking_tickets (parking_session_id) WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX unique_external_payment_reference
ON payments (parking_location_id, external_reference)
WHERE external_reference IS NOT NULL;

CREATE UNIQUE INDEX one_reversal_per_payment
ON payments (reverses_payment_id)
WHERE kind = 'REVERSAL';
```

The all-zero UUID is a reserved rate-scope sentinel and cannot be used as a real `vehicle_types.id`. `UNIQUE NULLS NOT DISTINCT` protects version identity for facility-wide rates, while the GiST exclusion constraint is the race-safe authority preventing two published facility/vehicle scopes from matching the same instant. Drafts may overlap, but publishing locks the scope and must satisfy the constraint.

Also index sessions by `(location_id, status, entry_time desc)`, `(location_id, exit_time desc)`, tickets by ticket number/hash, vehicles by `(location_id, normalized_plate_number)`, spaces by `(location_id, status, zone_id)`, payments by `(location_id, processed_at desc)` and session, audits by `(location_id, created_at desc)`, actor/action, and correlation ID. Composite foreign keys enforce that session, space, zone, vehicle, ticket, rate, and payment belong to the same location. Triggers may maintain `updated_at`, but lifecycle and audit mutations remain explicit in RPCs.

Payment rows are immutable ledger entries. Voiding never updates the original collection or its receipt: `void_parking_payment` appends one `REVERSAL` row referencing it, preserves the external reference permanently, updates only the session's current `session_payment_status`/state inside the same transaction, and appends correction/audit evidence. Net revenue and settlement sufficiency are the signed sum of `COLLECTION` plus `TOP_UP` minus `REVERSAL` entries; one reversed reference can never be reused.

### Migration order

1. Extensions and private/app schemas; enums and shared authorization helpers.
2. Locations, profiles, permissions, vehicle types, zones, spaces, devices.
3. Vehicles, rates, sessions, tickets, snapshots, payments, receipts, shifts, corrections, idempotency, rate-limit buckets, audit.
4. Checks, composite FKs, exclusion/partial indexes, immutable-row triggers.
5. Authorization helpers, RLS policies, grants, and transactional RPCs.
6. Realtime publication allowlist, storage policies, pgTAP tests, and deterministic seed data.

Production migrations are forward-only and reviewed. Historical/financial rows are not soft-deleted; configuration uses `is_active` and compensating workflows. Idempotency rows may be purged after the approved retry window only after their referenced durable resource exists.

No generated column is required for the MVP: occupancy depends on related active sessions, and fee totals depend on time plus an immutable snapshot, so both are maintained and verified inside atomic RPCs rather than hidden in unsuitable generated expressions.

## 11. Supabase Authentication Design

1. **Account creation:** public sign-up is disabled. An authenticated admin invokes an idempotent trusted server workflow that first invites/creates the Auth identity and then transactionally creates the protected profile, location assignment, and default permissions. Auth Admin API work and PostgreSQL do not share one transaction: until the profile transaction succeeds, missing-profile default denial blocks access. On failure, retry safely or disable/delete the new Auth identity as compensation, record reconciliation evidence, and surface identities without active profiles in an admin reconciliation view. The bootstrap admin is created through a documented one-time procedure and bootstrap authority is removed afterward.
2. **Login:** email/password authentication uses generic failure text. Use the browser-compatible Supabase SSR cookie/session model so the browser client can authenticate RLS reads and Realtime while the server client can refresh the same session. Because browser JavaScript must access this session material, do not claim the cookies are `HttpOnly`; set `Secure` in HTTPS environments, an appropriate same-site policy, narrow path/domain, and short token lifetime with refresh rotation. Mitigate the additional XSS exposure with a strict nonce-based CSP, no raw HTML, dependency/SAST scanning, output escaping, no third-party scripts without review, and immediate session revocation on incident. Middleware performs only refresh, while each protected Server Component/Route Handler verifies the user and active protected profile.
3. **Authorization:** `profiles`, `staff_permissions`, and location assignment are authoritative. Server-managed `app_metadata` may cache stable claims but is never the only authority; editable `user_metadata` is never used. RPCs re-read protected authorization data inside the transaction.
4. **Refresh and disable:** SSR helpers rotate refreshed tokens. A disabled profile fails every protected read/RPC immediately even if its JWT has not expired. Admin disable also revokes known sessions through a trusted server operation.
5. **Recovery:** `resetPasswordForEmail` redirects only to an allowlisted callback. The callback verifies the recovery flow, forces one password update, signs out other sessions, clears local caches, and records a security event.
6. **Sign-out:** revoke the refresh session, clear auth cookies, TanStack Query state, IndexedDB operational cache, camera streams, and sensitive in-memory values before redirecting.
7. **Protection:** route groups require authentication and active profile/location; admin pages additionally require `ADMIN`; sensitive mutations require the named permission inside the RPC. MFA is required for admins and approval-capable staff before a real pilot.

Auth redirects are restricted to known local, preview, staging, and production origins. Rate limits and alerts cover login and recovery abuse. No Auth service key, password, token, or recovery secret is logged.

## 12. Row Level Security Plan

RLS is enabled on every table exposed through Supabase APIs. Grants are default-deny, policies call stable security-definer helper functions in a non-exposed schema to obtain the caller's active profile/location, and critical writes go through explicitly granted RPCs. Application roles have no direct `DELETE` on operational or historical tables.

| Table | `SELECT` | Direct `INSERT`/`UPDATE` | `DELETE` and required RPC path |
| --- | --- | --- | --- |
| `profiles` | Staff: self; admin: profiles in own location | Self may update limited display fields through RPC; admin account management RPC only | None; deactivate account |
| `staff_permissions` | Self and own-location admin | Admin permission RPC only; self-elevation denied | None |
| `parking_locations` | Assigned active location | Admin settings RPC only | None |
| `parking_zones`, `vehicle_types` | Active same-location rows; admins may see inactive | Admin configuration RPC only | None; deactivate |
| `parking_spaces` | Same-location staff/admin | No direct writes; space configuration/reassignment/status RPCs | None; deactivate or out-of-service |
| `vehicles` | Same-location records needed for operations | No direct writes; entry/correction RPCs | None |
| `parking_rates` | Staff: published effective same-location; admin: all same-location | Admin version/publish RPC | None; unpublished draft may be withdrawn through RPC |
| `parking_rate_snapshots` | Same-location users with access to the parent session | None | None |
| `parking_sessions` | Same-location staff; admin includes historical rows | None; all lifecycle changes through named RPCs | None |
| `parking_tickets` | Same-location staff; token hash is omitted from API-facing views | None; ticket RPCs only | None |
| `payments`, `receipts` | Same-location staff for operational lookup; report/export restricted as configured | Payment/void/receipt RPCs or Edge Function | None |
| `staff_shifts` | Staff: own shifts; admin: same-location shifts | Start/close shift RPCs | None |
| `devices` | Active devices in assigned location; admin sees revoked | Registration/heartbeat/revocation RPCs | None |
| `session_corrections` | Same-location admin and staff who can view the parent session; sensitive details may be restricted to approvers | Trusted correction/void/cancellation RPCs only | None |
| `audit_logs` | Own-location admin; optionally approval-capable staff for scoped review | Trusted functions only | None for all application roles |
| `idempotency_keys` | No general client reads; owning RPC may retrieve its sanitized result | Trusted RPCs only | Maintenance job after expiry |
| `rate_limit_buckets` | None; private schema | Abuse-sensitive RPCs only | Controlled expiry maintenance |

Every policy checks `parking_location_id = private.current_location_id()` and `private.is_active_user()`. Cross-location access remains denied even for an MVP admin. Views used for dashboards omit sensitive columns and use invoker security. Automated RLS tests cover unauthenticated, staff-self, staff-same-location, staff-other-location, admin, permissioned staff, self-elevation, and each CRUD verb.

## 13. PostgreSQL Functions and Transaction Boundaries

Functions return typed rows that the web layer maps to the Section 15 envelope. Mutation functions accept `p_idempotency_key uuid` and `p_correlation_id uuid`, derive actor/location from `auth.uid()`, hash a canonical request, and return the stored sanitized response for an exact retry. Reuse with changed input fails. One-time credentials are never persisted in idempotency storage; issuance/reissue replay returns durable identifiers plus `credential_recovery: REISSUE_REQUIRED`.

| Function | Contract, validations, affected rows, locking, audit, and errors |
| --- | --- |
| `create_parking_entry(p_plate, p_vehicle_type_id, p_color, p_space_id, p_idempotency_key, p_correlation_id)` | Requires active staff/location; entry itself does not require an open shift. Normalizes plate, takes an advisory lock on location+plate and `FOR UPDATE` lock on space, checks vehicle/space availability and effective rate, creates/reuses vehicle, session, snapshot, ticket, occupied status, sanitized idempotency response, and `PARKING_ENTRY_CREATED` audit. The raw QR token is returned only on the first successful response; replay returns durable IDs plus `credential_recovery: REISSUE_REQUIRED`. Errors include `ACTIVE_SESSION_EXISTS`, `SPACE_NOT_AVAILABLE`, `RATE_NOT_CONFIGURED`. |
| `validate_parking_ticket(p_token, p_ticket_number, p_idempotency_key, p_correlation_id)` | Exactly one lookup input; validates length before hashing, atomically consumes a private actor/location/operation rate-limit bucket in addition to web IP/device throttling, locks ticket/session only if transitioning `ACTIVE` to `EXIT_PENDING`, verifies location/status, and audits scans without storing token. Exact retry returns the original safe response; a distinct scan can append bounded evidence without advancing an already-reviewing session. Errors: `TICKET_INVALID`, `WRONG_LOCATION`, `TICKET_ALREADY_COMPLETED`, `TICKET_REVOKED`, `RATE_LIMITED`. |
| `calculate_parking_exit(p_session_id, p_idempotency_key, p_correlation_id)` | Locks session and snapshot; accepts eligible nonterminal state, uses database time and deterministic fee function, writes quote totals/expiry and `PAYMENT_PENDING` (or auditable zero settlement path), then audits rule breakdown. Error: `INVALID_STATUS_TRANSITION`. |
| `record_parking_payment(p_session_id, p_cash_tendered_centavos, p_external_reference, p_idempotency_key, p_correlation_id)` | Locks session/quote and open shift, recalculates if quote expired, derives amount due, validates cash and unique reference, inserts cash payment/receipt metadata, moves to `PAID_AWAITING_EXIT`, stores response, audits actor. Errors: `QUOTE_EXPIRED`, `INSUFFICIENT_CASH`, `PAYMENT_ALREADY_RECORDED`, `SESSION_CANCELLED`. |
| `confirm_vehicle_exit(p_session_id, p_idempotency_key, p_correlation_id)` | Locks session, ticket, and space; requires sufficient non-voided settlement and valid exit window, records server exit/duration, completes session/ticket, releases space, stores response, and audits. If a delta is due, returns `PAYMENT_REQUIRED` with no release. |
| `cancel_parking_session(p_session_id, p_reason, p_idempotency_key, p_correlation_id)` | Requires `can_cancel_sessions`, bounded reason, unpaid eligible state, and locks session/ticket/space; revokes ticket, cancels session, releases space, and audits before/after. Financial evidence forces manual correction instead. |
| `process_lost_ticket(p_session_id, p_evidence, p_reason, p_idempotency_key, p_correlation_id)` | Requires permission and same location; locks session, records lost state/evidence digest, adds snapshot penalty, optionally revokes/reissues ticket, routes to payment/manual review, and audits approver. |
| `reissue_parking_ticket(p_session_id, p_reason, p_idempotency_key, p_correlation_id)` | Requires active staff, same location, eligible nonterminal session, and bounded reason; locks session/current ticket, revokes it, creates a new number/hash while returning the plaintext token once, stores only a sanitized token-free replay response, and audits both ticket IDs. Lost response requires another intentional reissue with a new key. |
| `void_parking_payment(p_payment_id, p_reason, p_idempotency_key, p_correlation_id)` | Requires `can_void_payments`; locks the payment/session/shift, rejects an already reversed collection or completed exit, appends a reversal payment and correction evidence, moves the session to `MANUAL_REVIEW`, adjusts shift totals, stores the response, and audits without deleting the original payment/receipt. |
| `correct_parking_session(p_session_id, p_correction_type, p_values, p_reason, p_idempotency_key, p_correlation_id)` | Requires matching permission and allowlisted correction schema; locks aggregate, appends correction/compensating financial evidence, recalculates derived facts when allowed, never rewrites audit/payment history, and records approver. |
| `start_staff_shift(p_device_id, p_opening_float_centavos, p_idempotency_key, p_correlation_id)` | Locks actor/location advisory key, rejects another open shift, validates device/location and nonnegative float, creates shift and audit. |
| `close_staff_shift(p_shift_id, p_declared_cash_centavos, p_notes, p_idempotency_key, p_correlation_id)` | Locks shift and related payments, computes expected cash and variance, records declared total/server close time, closes once, and audits discrepancy. |

All privileged functions use `SECURITY DEFINER` only where necessary, set `search_path = ''`, fully qualify every object, revoke `EXECUTE` from `PUBLIC`, grant only to `authenticated` or the narrow service role, and perform their own caller, active-profile, location, role, and permission checks. Dynamic SQL is prohibited. Expected domain errors use stable codes; unexpected database details are logged server-side and mapped to `INTERNAL_ERROR`. Any error rolls back idempotency, audit, status, payment, and occupancy changes together.

## 14. Edge Function Plan

| Function | Contract and controls | MVP status |
| --- | --- | --- |
| `generate-receipt` | Authenticated POST with payment ID and desired format; validates same-location access, reads immutable payment/session facts, renders PDF, writes a versioned private Storage object, inserts receipt metadata, and returns a short-lived signed URL. Per-user/location rate limit, correlation log, retry-safe content hash. | Optional; browser print is the MVP fallback. |
| `export-report` | Admin or permitted staff POSTs a bounded report/date schema; creates a streamed CSV from a location-scoped database function, stores privately only if asynchronous, audits export, and returns/sends a short-lived result. | MVP only if synchronous Route Handler export exceeds platform limits. |
| `public-ticket-verification` | Rate-limited POST accepting only the opaque token and returning minimal status without plate, fee, staff, or timestamps. Uses a narrow RPC and generic invalid response; strict CORS and abuse alerts. | Excluded unless the operator confirms a public verification need. |
| `notification-dispatch`, `payment-webhook`, `hardware-webhook` | Provider signature verification, replay protection, allowlisted event schemas, idempotency, narrow RPC calls, redacted logs, and retry/dead-letter handling. | Post-MVP. |
| `maintenance` | Scheduled expiry/cleanup for safe caches and idempotency rows plus monitoring checks; never deletes required audit/financial evidence. | Add only when measured need justifies it. |

Login, profile, spaces, entry, authenticated validation, fee calculation, cash payment, exit, lost-ticket handling, corrections, shifts, dashboard reads, and routine configuration do not need Edge Functions. Edge code never reimplements fees or state transitions.

### Edge contract details

- `generate-receipt`: `POST { payment_id: UUID, format: "PDF" }`; caller JWT plus same-location receipt access; calls a read-only receipt-payload RPC and writes a versioned private object/metadata. Returns the canonical envelope with `{ receipt_id, version, signed_url, expires_at }`. Errors: validation, unauthorized, not found, generation/storage unavailable. Limit 10/user/5 minutes; log correlation, actor, payment ID, version, latency, result, never receipt content/token.
- `export-report`: `POST { type, from, to, format: "CSV" }`; admin/permitted JWT, bounded range, same location; calls a location-scoped report RPC and either streams or stores one private version. Returns `{ export_id, signed_url, expires_at }`. Errors: validation, permission, range too large, throttled, unavailable. Limit 5/user/15 minutes and one concurrent export/location; audit the export and log safe dimensions/row count.
- `public-ticket-verification`: `POST { token }`; no user identity, but strict CORS plus IP/device/token-prefix and database bucket throttles; calls a narrow generic-status RPC and returns only `{ valid, status: "ACTIVE" | "UNAVAILABLE" }`. Invalid/wrong-location are indistinguishable. Limit 10/IP/minute and 3/token-prefix/minute; log only token-hash prefix, source hash, result, correlation. This surface remains excluded until product/security approval.
- `notification-dispatch` (post-MVP): internal signed request `{ event_id }`; loads approved template/data, invokes the provider, and stores delivery attempt. `payment-webhook` and `hardware-webhook` (post-MVP) accept raw provider bodies, verify signature/timestamp/nonce before parsing, deduplicate provider event ID, and call a transactional RPC. Each requires provider-specific error/retry/dead-letter, persistent limit, and redacted event log before implementation.
- `maintenance`: scheduled service-only invocation with platform signature/secret, no public payload; calls bounded cleanup/reconciliation RPCs and returns affected counts. A concurrent-run lock prevents overlap; failure alerts operations. It can expire rate buckets/idempotency records only under policy and cannot delete financial/audit evidence.

## 15. API and RPC Contract

### Shared response types

```ts
type ApiErrorCode =
  | "VALIDATION_FAILED" | "AUTHENTICATION_REQUIRED" | "INSUFFICIENT_PERMISSION"
  | "RESOURCE_NOT_FOUND" | "ACTIVE_SESSION_EXISTS" | "SPACE_NOT_AVAILABLE"
  | "TICKET_INVALID" | "TICKET_REVOKED" | "TICKET_ALREADY_COMPLETED"
  | "WRONG_LOCATION" | "INVALID_STATUS_TRANSITION" | "QUOTE_EXPIRED"
  | "PAYMENT_REQUIRED" | "PAYMENT_ALREADY_RECORDED" | "SESSION_CANCELLED"
  | "RATE_NOT_CONFIGURED" | "INSUFFICIENT_CASH" | "SHIFT_REQUIRED"
  | "DUPLICATE_PAYMENT_REFERENCE" | "OFFLINE_OPERATION_NOT_ALLOWED"
  | "IDEMPOTENCY_CONFLICT" | "RATE_LIMITED" | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: null | {
    code: ApiErrorCode;
    message: string;
    field_errors?: Record<string, string[]>;
    correlation_id: string;
    retryable: boolean;
  };
  meta?: { server_time: string; request_id: string; pagination?: Pagination };
}
```

```ts
type UUID = string;
type SessionStatus = "ACTIVE" | "EXIT_PENDING" | "PAYMENT_PENDING"
  | "PAID_AWAITING_EXIT" | "COMPLETED" | "CANCELLED"
  | "LOST_TICKET" | "MANUAL_REVIEW";

interface ProfileResult { id: UUID; full_name: string; role: "ADMIN" | "STAFF"; permissions: string[]; location_id: UUID; active_shift_id: UUID | null }
interface SpaceResult { id: UUID; zone_id: UUID; code: string; status: "AVAILABLE" | "OCCUPIED" | "OUT_OF_SERVICE"; version: number }
interface EntryRequest { plate_number: string; vehicle_type_id: UUID; color?: string; parking_space_id: UUID }
interface EntryResult { session_id: UUID; ticket_id: UUID; ticket_number: string; qr_payload: string | null; entry_time: string; status: "ACTIVE"; credential_recovery?: "REISSUE_REQUIRED" }
interface TicketValidationRequest { token?: string; ticket_number?: string }
interface TicketValidationResult { session_id: UUID; ticket_number: string; display_plate_number: string; vehicle_type: string; space_code: string; entry_time: string; status: SessionStatus }
interface ExitPreviewRequest { session_id: UUID; expected_version: number }
interface ExitPreviewResult { session_id: UUID; status: "PAYMENT_PENDING" | "PAID_AWAITING_EXIT"; billed_minutes: number; subtotal_centavos: number; discount_centavos: number; penalty_centavos: number; adjustment_centavos: number; total_centavos: number; fee_version: number; quote_expires_at: string }
interface PaymentRequest { session_id: UUID; fee_version: number; cash_tendered_centavos: number; external_reference?: string }
interface PaymentResult { payment_id: UUID; receipt_number: string; amount_centavos: number; cash_tendered_centavos: number; change_centavos: number; session_status: "PAID_AWAITING_EXIT" }
interface ExitConfirmationRequest { session_id: UUID; expected_version: number }
interface ExitConfirmationResult { session_id: UUID; exit_time: string; status: "COMPLETED"; released_space_id: UUID }
interface LostTicketRequest { session_id: UUID; evidence: Record<string, string>; reason: string }
interface RateDraftRequest { vehicle_type_id?: UUID; mode: "FLAT" | "TIERED"; grace_minutes: number; initial_minutes?: number; initial_fee_centavos?: number; succeeding_interval_minutes?: number; succeeding_fee_centavos?: number; flat_fee_centavos?: number; daily_max_centavos?: number; overnight_fee_centavos: number; lost_ticket_penalty_centavos: number; effective_from: string; effective_to?: string }
interface DashboardResult { snapshot_at: string; capacity: number; available: number; occupied: number; out_of_service: number; active_sessions: number; payment_pending: number; paid_awaiting_exit: number; entries_today: number; exits_today: number; revenue_centavos: number }
interface TransactionQuery { from: string; to: string; status?: SessionStatus; plate?: string; cursor?: string; limit?: number }
interface ReportRequest { type: "DAILY_REVENUE" | "OCCUPANCY" | "MOVEMENTS" | "SHIFT_RECONCILIATION"; from: string; to: string; format: "JSON" | "CSV" }
```

Unknown fields are rejected. Mutation bodies are size-capped and require authenticated same-origin requests, CSRF protection when cookie-authenticated, a UUID `Idempotency-Key`, and a UUID correlation ID generated if absent. The server ignores client actor, location, official time, session state, and calculated total fields.

| Operation | Surface, request, response, and important behavior |
| --- | --- |
| Login | Supabase Auth password flow; email/password schema; generic 400/401 response and throttling. |
| Profile | `GET /api/me`; returns safe profile, role, named permissions, location, shift, and device context; 401/403 if inactive. |
| Spaces | `GET /api/spaces?zone=&status=&cursor=`; RLS-scoped paginated rows and `meta.pagination`; cached briefly, never cross-location. |
| Entry | `POST /api/entries` to `create_parking_entry`; plate/type/color/space; returns session ID, ticket number, one-time QR payload, entry time, and print data; idempotent. |
| Ticket validation | `POST /api/tickets/validate` to `validate_parking_ticket`; `{token}` or `{ticket_number}`; returns safe session/vehicle/space state; rate-limited and non-exiting. |
| Exit preview | `POST /api/exit/preview` to `calculate_parking_exit`; session ID; returns duration, itemized fee, total centavos, quote expiry, and state; idempotent. |
| Payment | `POST /api/payments` to `record_parking_payment`; session ID, cash tendered, optional reference; returns payment/receipt number/change/state; exact-once. |
| Exit confirmation | `POST /api/exit/confirm` to `confirm_vehicle_exit`; session ID; returns official exit time, completed status, and released space; exact-once. |
| Ticket reissue | `POST /api/tickets/{ticketNumber}/reissue`; reason required; revokes the prior credential, returns a new one-time QR payload and printable facts, and audits both records; never exposes either hash. |
| Lost ticket | `POST /api/sessions/{id}/lost-ticket`; evidence/reason; permissioned call to `process_lost_ticket`; returns penalty/review state. |
| Rates | `GET /api/rates` for scoped effective versions; admin `POST /api/rates` creates validated draft and `POST /api/rates/{id}/publish` makes it immutable. |
| Dashboard | `GET /api/dashboard?business_date=`; calls bounded aggregate RPC/view; returns capacity, state counts, movements, and revenue. |
| Transactions | `GET /api/transactions?from=&to=&status=&plate=&cursor=`; bounded, paginated, location-scoped search. |
| Reports | `POST /api/reports/preview` or `/export`; validates bounded range/type, returns aggregate/CSV result, and audits exports. |

| Operation | Domain errors beyond shared auth/validation/service errors | Idempotency |
| --- | --- | --- |
| Entry | `ACTIVE_SESSION_EXISTS`, `SPACE_NOT_AVAILABLE`, `RATE_NOT_CONFIGURED` | Required; replay omits QR and may require reissue. |
| Ticket validation/reissue | `TICKET_INVALID`, `TICKET_REVOKED`, `TICKET_ALREADY_COMPLETED`, `WRONG_LOCATION`, `RATE_LIMITED` | Required for state-changing validation and reissue. |
| Exit preview | `INVALID_STATUS_TRANSITION`, `TICKET_INVALID` | Required; replay returns the stored sanitized quote. |
| Payment | `QUOTE_EXPIRED`, `INSUFFICIENT_CASH`, `PAYMENT_ALREADY_RECORDED`, `DUPLICATE_PAYMENT_REFERENCE`, `SHIFT_REQUIRED`, `SESSION_CANCELLED` | Required; exact replay returns original payment. |
| Exit confirmation | `PAYMENT_REQUIRED`, `INVALID_STATUS_TRANSITION`, `SESSION_CANCELLED` | Required; exact replay returns original completion. |
| Lost ticket/correction/void | `INSUFFICIENT_PERMISSION`, `INVALID_STATUS_TRANSITION`, `PAYMENT_REQUIRED` | Required. |
| Rate publish | `INSUFFICIENT_PERMISSION`, `VALIDATION_FAILED`, `RATE_NOT_CONFIGURED` | Required. |
| Dashboard/space/profile/transactions | `RESOURCE_NOT_FOUND`, `WRONG_LOCATION` where non-disclosing | Not required for safe reads. |
| Report preview/export | `INSUFFICIENT_PERMISSION`, `VALIDATION_FAILED`, `RATE_LIMITED` | Required for export; preview read may omit. |

HTTP mapping is consistent: 400 validation, 401 unauthenticated, 403 unauthorized/wrong location where disclosure is safe, 404 generic resource/ticket missing, 409 state/idempotency/domain conflict, 422 valid request that cannot satisfy fee/payment rules, 429 rate limited, and 503 transient dependency failure. Responses never contain SQL text, stack traces, policy names, hashes, secrets, or raw internal exceptions.

### Example payment response

```json
{
  "success": true,
  "data": {
    "payment_id": "7c7dd674-272a-4b6a-863f-254ff038bb10",
    "receipt_number": "EPG-20260719-000123",
    "amount_centavos": 9000,
    "cash_tendered_centavos": 10000,
    "change_centavos": 1000,
    "session_status": "PAID_AWAITING_EXIT"
  },
  "error": null,
  "meta": { "server_time": "2026-07-19T09:30:00Z", "request_id": "4ee51f2d-9ae4-4388-81bb-91ec34914e01" }
}
```

## 16. QR Ticket and Scanning Design

- **Human ticket number:** `EPG-{YYMMDD}-{8 random Crockford Base32 characters}` with a check character. A unique constraint, not apparent sequence, guarantees uniqueness.
- **Token:** 32 CSPRNG bytes (256 bits), base64url without padding. The printable QR contains `https://<app-host>/verify#v1.<token>` and no session ID, plate, time, fee, or payment fact. URL fragments are not sent in the initial HTTP request or `Referer`; the authenticated PWA extracts the fragment locally, immediately removes it from browser history with `history.replaceState`, and POSTs the token in a redacted request body.
- **Storage:** hash the decoded token with SHA-256 and store the 32-byte hash. Show the raw token only in the first issuance/reissue response and immediate print surface; never place it in idempotency responses, server/CDN URL paths or queries, logs, IndexedDB, analytics, monitoring, or later API reads.
- **Validation:** enforce exact base64url shape/decoded length before hashing, query by unique hash within the caller's location, and verify ticket/session lifecycle under lock when a transition is requested. Invalid and wrong-location public responses are indistinguishable.
- **Lifecycle:** active tickets do not expire while their session legitimately occupies a space. Completion, cancellation, or explicit revoke makes them unusable. Reissue revokes the old token and creates a new credential/audit event.
- **Print/reissue:** additional copies may be printed only from the immediate issuance view while the raw token remains in that browser's memory. Any later “reprint” is a controlled revoke-and-reissue operation with a new token and visible replacement label. No server path can recreate a token from its hash.
- **Duplicate scan:** returns the current safe review state and logs the scan; it never pays or exits. Concurrent scans are serialized by session version/lock.
- **Scanner UX:** request rear camera only after a user gesture, show permission guidance, selectable camera, torch control when available, large framing target, vibration/sound confirmation subject to preference, and a 10-second manual-fallback prompt. Low light or unsupported APIs never block ticket-number entry.
- **Abuse controls:** adjustable user/device/IP/location rate limits, bounded request bodies, generic errors, invalid-scan counters, and alerts for bursts or repeated completed/revoked tokens.

## 17. Parking Fee Calculation Specification

### Authoritative algorithm

The fee engine is a pure, versioned PostgreSQL function operating on UTC entry/quote instants and the immutable rate snapshot. All outputs are integer centavos and include a machine-readable breakdown.

1. Calculate nonnegative elapsed whole seconds; reject a quote before entry.
2. Convert to billable minutes using `ceil(seconds / 60)`, so any started minute counts. If minutes are within the grace period, base fee is zero.
3. For `FLAT`, charge the flat amount. For `TIERED`, charge the initial fee once, then `ceil(remaining_minutes / interval_minutes) * interval_fee`.
4. For each complete or partial rolling 24-hour block, apply that block's base calculation and cap its base charge at `daily_max_centavos` when configured.
5. Count overnight boundaries by local `Asia/Manila` calendar dates and add the configured overnight charge according to the snapshot. Overnight charges are outside the base daily cap unless the approved tariff says otherwise.
6. Add lost-ticket and other configured penalties.
7. Apply approved percentage/fixed discount to eligible base plus overnight components using integer half-up rounding; penalties are not discounted by default.
8. If complimentary is approved, eligible base/overnight becomes zero while independently applicable penalties remain.
9. Add a signed manual adjustment with permission and reason; prevent a final negative amount.
10. Reserve explicit tax fields for a future tax policy; MVP tax is zero unless the operator provides approved requirements.

Published snapshots cannot change. Calculation preview writes a 15-minute quote. Payment recalculates under lock when the quote expires. After payment, exit has a 15-minute window; if time creates a higher fee, a top-up is required. Corrections append a new calculation/correction record and never alter the original receipt silently.

### Example fixture, not a production tariff

Grace: 15 minutes; initial 3 hours: `₱50.00`; each started succeeding hour: `₱20.00`; rolling 24-hour base maximum: `₱300.00`; each local overnight boundary: `₱50.00`; lost-ticket penalty: `₱200.00`.

| Scenario | Calculation | Total |
| --- | --- | ---: |
| 10 minutes | Within 15-minute grace | `₱0.00` |
| Exactly 3 hours | Initial block | `₱50.00` |
| 3 hours 1 minute | `₱50.00 + ceil(1/60) × ₱20.00` | `₱70.00` |
| 5 hours 30 minutes | `₱50.00 + ceil(150/60) × ₱20.00` | `₱110.00` |
| 10:00 PM–2:00 AM, 4 hours | Base `₱70.00` plus one overnight boundary `₱50.00` | `₱120.00` |
| 8:00 AM day 1–10:00 AM day 2, 26 hours | First 24-hour base capped `₱300.00`; next 2-hour block `₱50.00`; one overnight `₱50.00` | `₱400.00` |
| 5 hours, lost ticket, 10% eligible discount | Base `₱90.00 − ₱9.00 + ₱200.00` penalty | `₱281.00` |

### Fee-engine unit vectors

| Case | Expected assertion |
| --- | --- |
| 0, 15, and 16 minutes | `0`, `0`, and `5000` centavos respectively. |
| 180, 181, 240, and 241 minutes | `5000`, `7000`, `7000`, and `9000` centavos before other charges. |
| One second past a minute/hour boundary | Deterministic ceiling occurs once, never floating-point drift. |
| Cross-midnight with equal elapsed duration | Base duration stays UTC-correct; only overnight boundary differs. |
| 24 hours and 24 hours 1 minute | Daily-block cap and next partial block follow the snapshot. |
| Rate changed after entry | Existing session produces identical output from its stored snapshot. |
| Discount/penalty/complimentary | Eligibility, order, half-up rounding, and nonnegative final value match approved vectors. |
| Quote expiry/top-up | Same instant yields same quote; later payment/exit either remains sufficient or returns an exact delta. |

## 18. UI and Page-by-Page Implementation Plan

### Route map and page contract

All protected pages use a Server Component for authentication, authorization, and initial data. Client Components are introduced only for forms, camera/media APIs, printing, realtime widgets, interactive filters/maps, connectivity state, and confirmation dialogs. Every page includes a skeleton, useful empty state, recoverable error panel with correlation ID, responsive navigation, semantic headings, visible keyboard focus, labeled controls, non-color status text, and reduced-motion support.

| Route/page | Purpose, users, data, components, actions, and validation | Responsive states, accessibility, and component boundary |
| --- | --- | --- |
| `/login` | Staff/admin login with email and password; auth card, password visibility, recovery link; normalize email and require bounded password. | Centered mobile card/wide split layout; generic auth errors and lockout guidance; Server shell plus Client form with announced errors. |
| `/dashboard` | Operational overview for staff/admin; aggregate metrics, zone occupancy, active alerts, recent movements; date/zone filters and refresh. | Stacked mobile cards and desktop grid; skeleton/zero-activity/stale/offline states; Server snapshot plus Client realtime cards. |
| `/entry` | Create vehicle entry; plate, vehicle type, color, zone/space; availability picker and final summary; shared Zod schema, but RPC revalidates under lock. | Step-like mobile form and side-by-side desktop form/map; preserve input on safe failure; Client form inside protected Server page. |
| `/tickets/[ticketNumber]` | Display newly issued/active ticket, entry facts, QR, print/reprint; staff only, same location. | High-contrast QR and 80 mm/A4 print CSS; screen-reader text describes ticket number, not QR pixels; Server data plus Client print/reprint. |
| `/scanner` | Scan QR or enter ticket number; camera selector, torch if supported, framing guide, manual fallback. | Full-screen mobile scanner and constrained desktop camera panel; permission/unsupported/low-light/invalid states; Client camera with Server-protected route. |
| `/exit/[sessionId]` | Review vehicle/session and request authoritative fee preview; itemized duration/rate/penalty and quote expiry; no editable total. | Sticky mobile primary action and desktop summary columns; expired/stale/conflict states; Server facts plus Client quote/confirmation actions. |
| `/payments/[sessionId]` | Record cash; amount due read-only, tender input, computed change, shift context, explicit confirmation. | Numeric keypad-friendly mobile input; insufficient-cash, duplicate, expired-quote, offline states announced; Client form calls exact-once server mutation. |
| `/exit/[sessionId]/confirm` | Separate final exit action for paid session; displays payment, ticket, space, expiry, and release warning. | One destructive-looking but clearly labeled confirm action; stale/top-up/already-completed handling; Server verification plus Client idempotent confirmation. |
| `/sessions` | Search active/exception sessions by plate, ticket, state, zone, and age; open scan/exit/lost-ticket flows. | Mobile cards and desktop paginated table; debounced filters, empty and stale cache labels; Server first page plus Client filters/realtime invalidation. |
| `/spaces` | Zone map/list of available, occupied, out-of-service spaces; admin configuration entry points. | Mobile list/toggle and desktop grid; status text/icons in addition to color, logical focus order; Server snapshot plus Client filters/realtime. |
| `/transactions` | Paginated historical sessions/payments; date, plate, status, receipt filters; view receipt and export if permitted. | Compact mobile rows, desktop table; bounded dates and cursor pagination; Server query with Client filter form/export. |
| `/admin/rates` | Admin drafts, previews, publishes, and retires effective-dated rate versions. | Mobile accordion/desktop comparison table; invalid overlap, unsaved draft, empty state; Server list plus Client validated editor and approval dialog. |
| `/admin/staff` | Admin invites, disables, assigns location, and grants permissions; email/name/role/flags validated. | Mobile staff cards/desktop table; self-elevation and last-admin safeguards; Server list plus Client invite/permission dialogs. |
| `/shifts` | Start/close own shift; admins review open/closed shifts and variances; float/declared cash are integer-centavo inputs. | Mobile cash workflow and desktop reconciliation table; no-open-shift/variance/duplicate-close states; Server history plus Client actions. |
| `/reports` | Daily revenue, movements, occupancy, shift reconciliation; bounded date/type filters and controlled CSV export. | Mobile summary/cards and desktop charts/tables; no-data/large-range/export-processing states; Server report with Client filters/charts/export. |
| `/admin/audit` | Admin searches actor/action/target/result/correlation/date and inspects redacted before/after evidence. | Mobile event details/desktop table; immutable/read-only UI and accessible JSON disclosure; Server pagination plus Client filters. |
| `/admin/settings` | Admin edits facility name, timezone display, receipt prefix, operational flags, and safe defaults. | Single-column mobile/two-column desktop; startup validation, saved/error announcements; Server values plus Client form. |
| `/offline` and error boundaries | Explain connectivity/cache age, allowed read-only actions, retry, support correlation ID, and update availability. | Works from cached shell, no dead-end controls, automatic online announcement; Client connectivity/update UI with static fallback. |

Forms disable repeat submission only as UX assistance; idempotency provides real duplicate protection. Destructive/sensitive actions show consequence, require a reason where applicable, return focus to the triggering control on cancellation, and use a confirmation dialog that is fully keyboard operable.

## 19. Dashboard and Realtime Plan

### Metrics and queries

| Metric | Authoritative source |
| --- | --- |
| Capacity/available/occupied/out-of-service | Location-scoped aggregate over active spaces grouped by status; occupancy percentage is `occupied / operational capacity`. |
| Active/exception sessions | Bounded aggregate over occupying session states, with separate lost/manual-review counts. |
| Entries/exits today | Session entry/exit instants grouped by `Asia/Manila` business date. |
| Pending payment/paid awaiting exit | State counts for `PAYMENT_PENDING` and `PAID_AWAITING_EXIT`. |
| Revenue today | Sum of non-voided payment kinds for the business date, reconciled to shift totals; never sum mutable UI quotes. |
| Average duration/turnover | Completed-session UTC elapsed time within a bounded report range, computed outside the realtime hot path. |

Expose one location-scoped dashboard RPC or security-invoker view returning a snapshot timestamp and small aggregate payload. Historical reports use normal paginated queries, not Realtime.

### Realtime behavior

- Publish only required columns/events from `parking_spaces` and an operational session projection. Subscribe with the authenticated location filter; never subscribe to profiles, permissions, raw tickets, audit logs, or full payments.
- Realtime events are invalidation hints. TanStack Query updates a small known row when safe, then refetches affected aggregates. The database remains canonical.
- Entry updates the occupied space and active/session metrics. Reassignment invalidates both spaces and the session. Payment updates payment-related counts/revenue but does not free occupancy. Confirmed exit updates session, ticket-independent dashboard facts, and released space. Cancellation or authorized correction refetches affected spaces, metrics, and reports.
- Display `Live`, `Reconnecting`, `Stale since <time>`, or `Offline`. On disconnect, use exponential backoff; on reconnect, refetch the entire authorized snapshot before clearing stale state because events may have been missed.
- After 30 seconds without a healthy subscription, poll the compact snapshot every 30 seconds while the tab is visible, back off in the background, and stop on logout. Unsubscribe on route disposal or location/session change.
- A mutation response updates the initiating UI optimistically only with the server-returned final state. Conflicting events or version mismatches discard local assumptions and refetch.
- Measure subscription count, payload volume, reconnect frequency, update latency, and quota use. The pilot target is visible convergence within 5 seconds under normal connectivity.

## 20. PWA and Offline Implementation Plan

### Manifest and installability

Use `name: "E-ParkGO"`, `short_name: "ParkGO"`, `start_url: "/dashboard"`, `scope: "/"`, `display: "standalone"`, portrait-and-landscape support, an approved high-contrast theme/background palette, and maskable plus standard 192/512 px icons. Include description, screenshots when available, stable icon URLs, HTTPS, and a valid service worker. The UI offers installation only after the browser's installability event and explains iOS installation separately.

### Cache and storage policy

- Use PWA tooling verified against the selected Next.js version. Precache versioned build assets, fonts, icons, the offline page, and minimal shell only.
- Use stale-while-revalidate for public static assets and network-first with a short timeout for explicitly approved, sanitized read-only reference endpoints.
- Never cache Auth endpoints, cookies, mutation Route Handlers, RPC POST responses, QR tokens, payment/receipt payloads, permissions, admin data, or full transaction/audit history in the service worker.
- IndexedDB stores versioned `reference_data` (zones, vehicle types, non-sensitive rate display), `recent_space_snapshot`, `recent_session_summaries` with minimal fields, `cache_metadata`, and `app_version`. Each record has location, user scope, fetched time, expiry, and schema version. Logout, account/location change, and incompatible upgrade clear it.
- No mutation outbox exists in the MVP. Background sync may refresh safe public/static data but cannot replay entry, payment, exit, rate, staff, or approval requests.

| Capability | Online | Offline MVP behavior |
| --- | --- | --- |
| Open application shell | Full | Cached shell and offline page |
| View recent space/session summary | Canonical live data | Read-only cache with prominent fetch time/stale label |
| Dashboard metrics | Live/realtime | Last sanitized snapshot only; revenue may be hidden if policy classifies it as sensitive |
| Vehicle entry/ticket generation | Allowed | Disabled; explain that server time and conflict checks require connection |
| Scan/manual ticket validation | Allowed | Camera may open, but validation/lookup action is disabled without network |
| Fee preview/payment/exit | Allowed | Disabled; no cached fee is presented as payable |
| Rates/staff/settings/overrides | Authorized online use | Disabled |
| Reports/audit/export | Authorized online use | Disabled |

Connectivity is determined from both browser events and a lightweight health request; `navigator.onLine` alone is insufficient. A failed mutation keeps entered form values in memory, shows whether same-key retry is safe, and never claims success before the server responds. When a new service worker waits, show a non-blocking update prompt; activate after critical forms finish, then reload and migrate or clear versioned caches.

A future offline-entry design requires a separate threat model and architecture review: device-bound signed ticket namespaces, preallocated collision-resistant identifiers, tamper-resistant queue records, short offline windows, conflict quarantine, server reconciliation, revocation, and operator training. It is not partially implemented in the MVP.

## 21. Security Threat Model

| Threat and attack scenario | Impact / likelihood | Prevent | Detect | Recover |
| --- | --- | --- | --- | --- |
| QR tampering/forgery: attacker edits a URL or guesses a token. | High / Medium | 256-bit CSPRNG token, exact parsing, SHA-256 hash-only storage, lifecycle/location binding, generic failures. | Invalid-token burst and source/device counters. | Revoke/reissue credential, block abusive source, review scans. |
| QR replay/copy/duplicate scan: a valid image is reused. | High / High | Scan only previews; row lock, session version, terminal/revoked checks, separate idempotent payment/exit. | Audit each scan; alert repeated token/device patterns. | Deny reuse, flag session/manual review, investigate operator/customer context. |
| Unauthorized access/privilege escalation/insecure RLS. | Critical / Medium | Default-deny grants, RLS on every exposed table, protected profile/permission/location authority, no self-elevation, RPC reauthorization. | Automated role/location/verb matrix and anomalous-access alerts. | Revoke sessions/permissions, apply reviewed policy migration, assess exposure from audit evidence. |
| Exposed Supabase or third-party secret in bundle, log, or Git. | Critical / Low | Secret stores, server-only imports, env schema, secret/pre-commit/CI scans, no secret in examples. | Bundle and repository scans; anomalous broad queries. | Rotate immediately, invalidate sessions if relevant, audit access, remove from history through approved incident process. |
| Session theft, XSS token theft, or lost staff device. | High / Medium | Secure browser-compatible SSR cookies, strict CSP/no unsafe HTML, short inactivity/token policy, refresh rotation, admin/approver MFA, device revocation, logout cache clear. | CSP reports, new-device and unusual-action signals. | Revoke refresh tokens, disable device/profile, reset credentials, investigate actions. |
| Brute-force login or recovery abuse. | Medium / Medium | Supabase controls plus per-account/IP throttling, generic errors, bounded requests, exponential delay. | Alert at 10 failures/account/5 minutes or 50/location/5 minutes, then tune. | Temporary block, credential reset, source denylist when justified. |
| Manipulated client timestamps or fees. | Critical / Medium | Database clock, UTC instants, immutable rate snapshot, integer-centavo RPC calculation; ignore client totals/times. | Preview/final mismatch and override alerts. | Permissioned append-only correction/refund; fix rule and regression tests. |
| Duplicate payment, direct API abuse, and races between devices. | Critical / High | Idempotency request hash, unique constraints, row/advisory locks, state/version checks, rate limits. | Conflict/idempotency metrics and invariant monitor. | Exact replay returns original; changed replay rejects; contain affected RPC and reconcile evidence. |
| SQL injection. | Critical / Low | Zod allowlists, parameterized Supabase/RPC calls, no dynamic SQL, fixed function search path. | SAST, database logs, hostile-input tests. | Block request/source, patch, review database activity, rotate affected credentials. |
| Stored/reflected XSS. | High / Medium | React escaping, no raw HTML, strict CSP with nonce/hash, safe CSV/print encoding, bounded text. | CSP reports, browser security tests. | Remove unsafe content, deploy fix, revoke stolen sessions. |
| CSRF on cookie-authenticated mutation. | High / Medium | SameSite cookies, same-origin Route Handlers, Origin/Host validation and CSRF token where required; no permissive CORS. | Rejected-origin metrics. | Revoke affected session, audit mutation, correct through approved workflow. |
| Malicious file upload. | Medium / Low | Disable user uploads in MVP. Future private bucket requires size, extension, MIME and magic-byte allowlist; reject SVG/HTML; randomized name and scanning. | Upload rejection/quarantine alerts. | Quarantine/delete artifact, revoke links, inspect access. |
| Lost-ticket/social-engineering misuse. | High / Medium | Permission gate, facility-approved plate/identity evidence, reason, penalty snapshot, manual-review fallback. | Lost-ticket volume by actor/device and exception trends. | Suspend workflow/actor, review audit/video where lawfully available, correct with evidence. |
| Audit-log tampering or insider misuse. | High / Medium | No application update/delete, trusted insert, actor/reason/correlation and before/after, periodic external export/hash manifest. | Override/void/correction/export anomaly alerts. | Suspend actor, preserve evidence, reconstruct from immutable records, conduct incident review. |
| Network/provider outage or application DoS. | High / Medium | Bounded bodies/queries, throttles, timeouts, safe retry with same key, capacity alerts, documented manual continuity. | Health, 5xx/429, latency and provider-status alerts. | Pause online transactions, use approved paper log, restore service, reconcile under controlled audited workflow. |

### Security release checklist

- [ ] No service-role/private secret, raw QR token, cookie, JWT, or password exists in client output or logs.
- [ ] RLS and explicit grants pass the complete role/location/operation matrix.
- [ ] Every `SECURITY DEFINER` function has empty fixed `search_path`, qualified objects, caller authorization, revoked public execution, and narrow grants.
- [ ] CSP, HSTS, `nosniff`, frame protection, referrer policy, least-privilege camera Permissions Policy, CORS, Origin/CSRF checks, and secure cookies are verified.
- [ ] Login, recovery, scan, mutation, export, and Edge surfaces have adjustable rate limits and safe messages.
- [ ] Dependency, SAST, secret, bundle, and Git-history scans have no unresolved critical/high finding.
- [ ] Admin/approver MFA, device/session revocation, lost-device response, backup/restore, continuity, and incident runbooks are exercised.
- [ ] Audit records are immutable to application roles and sensitive logs are redacted.

## 22. Validation and Error-Handling Strategy

Validation occurs at the form for usability, in the Route Handler/Edge Function for the contract, and again in RPCs/constraints for authority. Schemas reject unknown fields and oversized bodies. Normalization occurs once in shared server/database logic.

| Input | Rules |
| --- | --- |
| Plate | Trim and uppercase display value; allow `A-Z`, `0-9`, space, hyphen; 2-15 display characters. Normalized key removes spaces/hyphens and must be 2-12 alphanumerics. Exceptional plates enter documented manual review. |
| Vehicle type | Valid UUID referencing an active same-location type and compatible rate/space. |
| Parking space | Valid UUID, active, same location, compatible, `AVAILABLE`, and locked/rechecked by entry RPC. |
| QR token | Decode once; exact base64url representation of 32 bytes; reject malformed/oversized input before hashing; never log token/hash. |
| Ticket number | Uppercase normalized fixed pattern and bounded length; lookup is location-scoped and throttled. |
| Money | JSON safe integer centavos, bounded and nonnegative unless the signed adjustment schema allows negative; server derives due/change. Tender must cover due. |
| Payment reference | Server-generated preferred. External value, if allowed, is trimmed printable text of 1-64 characters and unique after case normalization. |
| Rate | Effective-dated version; nonnegative minutes/centavos, positive succeeding interval, mode-consistent fields, valid cap, no published overlap; preview before publish. |
| Time correction | ISO instant parsed to UTC, plausible facility window, entry before exit, not beyond server tolerance; matching permission and 10-500 character reason; append correction. |
| Permission | Fixed enum/column allowlist; same-location admin assignment; no self-elevation; RPC rechecks protected rows. |
| Filters/exports | Allowlisted state/type, valid cursor, bounded page size (default 25, maximum 100), and bounded date range (default 31, maximum 366 days for admin). |

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "SPACE_NOT_AVAILABLE",
    "message": "That parking space is no longer available. Refresh the space list and choose another.",
    "correlation_id": "47743282-cc53-42ee-92b9-098744804266",
    "retryable": false
  },
  "meta": { "server_time": "2026-07-19T09:30:00Z" }
}
```

| Error | HTTP | Staff action |
| --- | ---: | --- |
| `VALIDATION_FAILED` | 400/422 | Correct field-level errors. |
| `AUTHENTICATION_REQUIRED` | 401 | Sign in again; preserve no sensitive form data. |
| `INSUFFICIENT_PERMISSION`, `WRONG_LOCATION` | 403 | Request an authorized operator; do not retry unchanged. |
| `RESOURCE_NOT_FOUND`, `TICKET_INVALID` | 404 | Recheck input or use the approved lost-ticket flow. |
| `ACTIVE_SESSION_EXISTS`, `SPACE_NOT_AVAILABLE`, `INVALID_STATUS_TRANSITION`, `DUPLICATE_PAYMENT_REFERENCE` | 409 | Refresh canonical state; do not force overwrite. |
| `IDEMPOTENCY_CONFLICT`, `PAYMENT_ALREADY_RECORDED` | 409 | Retrieve original result or start a new intentional operation/key. |
| `TICKET_ALREADY_COMPLETED`, `TICKET_REVOKED`, `SESSION_CANCELLED` | 409 | Stop normal workflow and review existing record. |
| `QUOTE_EXPIRED`, `PAYMENT_REQUIRED` | 422 | Recalculate/review the exact due amount. |
| `RATE_NOT_CONFIGURED`, `SHIFT_REQUIRED`, `INSUFFICIENT_CASH`, `OFFLINE_OPERATION_NOT_ALLOWED` | 422 | Complete the stated prerequisite or correct the tender/connectivity condition. |
| `RATE_LIMITED` | 429 | Wait for indicated safe interval. |
| `SERVICE_UNAVAILABLE` | 503 | Keep form values in memory and retry only with the same idempotency key. |
| `INTERNAL_ERROR` | 500 | Show correlation ID; server logs the redacted exception. |

Never return PostgreSQL text, stack traces, policy/function names, hashes, internal secrets, or existence hints that enable enumeration. Unexpected errors are structured and redacted in server logs with correlation, release, actor/location IDs, and operation; the UI says what staff can safely do next.

## 23. Testing Strategy

Every story follows RED (write a failing requirement test), GREEN (minimal implementation), and REFACTOR (improve while all tests remain green). Vitest and React Testing Library cover TypeScript/UI, pgTAP and Supabase local tests cover SQL/RLS/RPC, integration tests use a freshly reset local Supabase stack, and Playwright covers critical workflows. CI requires at least 80% statements, branches, functions, and lines; state transitions, fee vectors, permission matrix, and concurrency/idempotency invariants require complete scenario coverage.

| Level | Required scenarios |
| --- | --- |
| Unit/component | Zod boundaries/normalization, centavo money, all fee vectors, state transition lookup, permissions, envelope/redaction, QR parsing, form errors, scanner fallback, loading/empty/offline components. |
| Database | FKs/checks/partial unique/exclusion indexes; concurrent same-plate and same-space entries; duplicate ticket/hash/payment reference; exact/changing idempotency replay; cancelled payment; completed ticket; payment-required exit; atomic rollback; audit existence; server timestamps; immutable rows; function grants/search path. |
| RLS | Unauthenticated, own-location staff, other-location staff, admin, ordinary staff sensitive action, explicitly permitted staff, self-elevation, and SELECT/INSERT/UPDATE/DELETE per exposed table. |
| Integration | Auth cookie refresh/logout/disable/recovery, API-to-RPC envelope/status mapping, Realtime entry/payment/exit/reconnect, optional receipt failure/retry, report reconciliation, PWA online/offline gates. |
| E2E happy path | Login → open shift → entry → ticket/print → scan → preview → exact-once cash payment → separate exact-once exit → space release → dashboard/report/audit evidence. |
| E2E negative | Duplicate scan, invalid/revoked/completed QR, wrong/unavailable space, duplicate vehicle, lost ticket with/without permission, cancellation, unauthorized correction, network loss before/after each mutation, cross-midnight fee, camera denied/manual lookup. |
| Nonfunctional | axe, keyboard/focus/contrast, reduced motion, 360/375/768/1024/1440/1920 widths, Chromium/Firefox/WebKit, representative Android/iOS camera, security headers/CSP, secret/dependency scans, hot-RPC load/concurrency, PWA install/update. |

CI order: frozen dependency install; formatting check; lint; typecheck; unit/component coverage; Supabase reset/migrations/pgTAP; RLS/concurrency/integration; production build; Playwright smoke/full; accessibility/performance/security scans. Fail on coverage regression, skipped/focused tests, migration drift, missing RLS, secret detection, or unresolved critical/high vulnerability. Test data is synthetic and isolated; waits use observable state rather than arbitrary sleeps.

## 24. Development Environments and Configuration

| Environment | Design |
| --- | --- |
| Local | Supabase CLI services, deterministic synthetic seed, ignored `.env.local`, clean reset command, local mail capture, and no production data. |
| Preview | Vercel PR preview with an isolated Supabase branch when supported; otherwise dedicated nonproduction project with controlled per-PR data and serialized migrations. Never use production secrets/data. |
| Staging | Dedicated Vercel/Supabase projects mirroring production schema, RLS, Auth settings, headers, and synthetic fixtures; final E2E, security, migration, and restore rehearsal. |
| Production | Dedicated projects/keys, protected branch/manual promotion, least-privilege secrets, no demo users/seed data, monitored backups, and documented bootstrap admin. |

Browser-safe variables are limited to `NEXT_PUBLIC_SUPABASE_URL`, the Supabase publishable/anon key, `NEXT_PUBLIC_APP_URL`, and an optional public monitoring DSN. Server-only variables include any narrowly justified service role, receipt/monitoring secrets, and `APP_ENV`. CI-only credentials include Supabase project/token/database deployment credentials and Vercel deployment token. Edge secrets use Supabase secret management. An environment schema fails build/startup when required values are missing or malformed.

`.env.example` contains names, placeholders, and browser/server/CI/Edge ownership comments only. Migrations are timestamped, reviewed, forward-only, and promoted local → preview/staging → production. Use expand/contract changes for compatibility and a corrective forward migration rather than casual destructive rollback. Seeds are idempotent and only for local/staging. Record application release SHA and migration versions together.

```dotenv
## Browser-safe: bundled into the client. Use public/publishable values only.
NEXT_PUBLIC_SUPABASE_URL=https://your-nonproduction-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-publishable-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

## Server-only: never prefix with NEXT_PUBLIC and never import from client modules.
SUPABASE_SERVICE_ROLE_KEY=replace-with-server-only-secret
APP_ENV=development
RECEIPT_SIGNING_SECRET=replace-with-server-only-secret

## CI-only: configure in GitHub Actions, not in Vercel browser/runtime variables.
SUPABASE_ACCESS_TOKEN=replace-in-ci-secret-store
SUPABASE_PROJECT_ID=replace-in-ci-secret-store
SUPABASE_DB_PASSWORD=replace-in-ci-secret-store
VERCEL_TOKEN=replace-in-ci-secret-store

## Edge-only: configure with the Supabase secret manager, not this local file.
NOTIFICATION_PROVIDER_SECRET=replace-in-edge-secret-store
WEBHOOK_SIGNING_SECRET=replace-in-edge-secret-store
```

## 25. Deployment Plan

### Initial deployment

1. [ ] Protect the GitHub default branch and require the complete CI suite/review.
2. [ ] Scaffold the pinned Next.js/TypeScript toolchain and commit a frozen lockfile.
3. [ ] Create separate staging and production Supabase projects and Vercel environments.
4. [ ] Configure Auth site URLs/redirect allowlists, disable public signup, and set MFA policy.
5. [ ] Configure validated environment variables and secret stores; scan the client build.
6. [ ] Apply all migrations to a clean local database, then staging; run schema-drift checks.
7. [ ] Seed only approved production location, zones, spaces, vehicle types, and published rate after product sign-off.
8. [ ] Bootstrap/invite the first production admin, verify MFA/location/permissions, and remove bootstrap authority.
9. [ ] Enable/verify RLS, explicit grants, function execution restrictions, and Realtime publication allowlist.
10. [ ] Deploy/version any required Edge Function and configure its narrow secrets/rate limits.
11. [ ] Connect Vercel to GitHub and configure scoped Preview/Production variables.
12. [ ] Configure the production domain, HTTPS, CSP and other security headers, and camera Permissions Policy.
13. [ ] Verify manifest, icons, service worker scope, installation, offline restrictions, and update behavior.
14. [ ] Run staging and production smoke tests: auth, entry, duplicate rejection, ticket, payment, exit, release, Realtime, report, and no-secret bundle scan.
15. [ ] Capture a pre-go-live export and release evidence bundle; obtain product, security, QA, and operations approval.

### Routine release checklist

- [ ] PR preview and all CI gates pass; auth/payment/RLS changes receive security review.
- [ ] Named owner records release SHA, migration IDs, backup/export location, start time, and rollback decision.
- [ ] Apply backward-compatible database migration first, then Edge Functions, then web application.
- [ ] Run health/schema/smoke checks and monitor errors, conflicts, latency, and invariants for 30-60 minutes.
- [ ] Record completion time and evidence; communicate operator-visible changes.

### Emergency rollback checklist

- [ ] Stop promotion and disable/revoke the affected feature, permission, token, or endpoint.
- [ ] Roll Vercel and Edge Functions to the last schema-compatible versions.
- [ ] Preserve logs/audits and assess data impact before database action.
- [ ] Prefer a tested corrective forward migration. Restore only for corruption/data loss from a verified clean backup.
- [ ] Verify all invariants and critical smoke flows, rotate compromised credentials, notify operators, and document the incident/reconciliation.

Application rollback never assumes it can undo committed schema/data. Destructive migrations require an explicit maintenance window, verified backup/restore, compatibility plan, and approval.

## 26. Free-Tier Usage and Cost-Control Plan

Provider quotas and commercial terms change; verify current official limits during environment provisioning and track usage at 60%, 80%, and 90% thresholds rather than hard-coding quotas here.

- Select only needed columns, require bounded date ranges/cursor pagination, index and `EXPLAIN` hot queries, and monitor database/storage growth.
- Publish only filtered operational Realtime changes; unsubscribe hidden tabs and use refetch/poll fallback rather than subscribing to every table.
- Store no vehicle images in MVP. Generate receipts on demand; retain immutable receipt metadata and only required private artifacts under an approved lifecycle.
- Cache static/versioned assets at Vercel; never cache authenticated transaction responses. Bound logs, request bodies, exports, and Edge execution.
- Archive only under an approved retention policy; never purge payment/audit evidence ad hoc. Synthetic keepalive traffic is used only if provider terms explicitly permit it and is never represented as uptime protection.

| Deployment class | Suitable posture |
| --- | --- |
| Student/demo | Synthetic or low-risk data, manual export, no uptime promise. |
| Limited pilot | Real bounded operations only with measured capacity, written downtime/manual-continuity process, access control, alerts, and tested restore. |
| Commercial | Paid hosting/database/monitoring/backups/support before operations depend on availability or legal retention. |

Upgrade when commercial launch begins; downtime/project pausing is unacceptable; automated/PITR backup, longer logs, support, compliance, or SLA is required; any resource exceeds 70% for seven days or 85% once; core RPC p95 exceeds 2 seconds at expected load; Realtime/connection/storage limits impair operation; or observed growth threatens retention.

## 27. Monitoring, Logging, Backup, and Recovery

Application logs are structured JSON with timestamp, environment, severity, event, correlation/request ID, actor/location/session IDs, operation, outcome, safe error code, latency, and release SHA. External monitoring masks/omits full plates and never receives QR tokens/hashes, cookies/JWTs, passwords, secrets, or unnecessary cash details. Business audit logs remain a separate authoritative append-only store.

### Health, metrics, and alerts

- `/api/health` exposes application release and a least-privilege database health RPC without sensitive diagnostics.
- Dashboards track entry/payment/exit success, conflicts, p50/p95 latency, 5xx/429, auth failures, invalid scans, Realtime disconnects, invariant failures, backup age, and provider utilization.
- Initial alerts: any invariant violation; three failed core RPCs in five minutes; more than 2% 5xx over five minutes with at least 20 requests; core RPC p95 over 2 seconds for 10 minutes; brute-force thresholds; backup older than 26 hours; capacity at 80%/90%. Tune from pilot evidence.

### Backup and restore

- Take an encrypted daily logical export to access-controlled storage outside the live Supabase project, with a hash manifest and success alert. Recommended starting retention is 30 daily and 12 monthly versions, subject to approved policy.
- Use a dedicated least-privilege backup credential, rotate it, and never place dumps in Git or ordinary CI artifacts.
- Monthly, restore into an isolated project and verify migrations, row counts, FKs, partial-index invariants, RLS, audit/payment totals, and one complete entry-to-exit smoke flow. Record duration and evidence.
- Development/limited-pilot objective: RPO 24 hours and RTO 4 hours. Commercial targets require paid managed backups/PITR, shorter measured objectives, and staffed response.

Incident recovery order: contain affected writes; preserve evidence; classify incident; select clean recovery point; restore in isolation; verify schema/auth/invariants; cut over; rotate affected credentials; reconcile any post-RPO paper records through an authorized audited workflow; communicate and complete a blameless post-incident review.

## 28. Implementation Phases and Milestones

Testing begins in every phase; Phase 13 consolidates release evidence rather than postponing quality. Each phase is mergeable only when its gate passes.

| Phase | Objective, tasks, dependencies, deliverable/acceptance, risk, and tests |
| --- | --- |
| 1. Discovery and decisions | Approve tariff/rounding, lost-ticket evidence, discounts, shifts, retention, threat model, state machine. Dependency: none. Deliverable: signed decision register and fee vectors; gate: no coding-blocking ambiguity. Risk: stakeholder disagreement. Test: worked examples/transitions reviewed. |
| 2. Repository and environments | Pin Next.js/tooling, Supabase CLI, Vitest, Playwright, lint/typecheck, env schema, CI. Depends 1. Gate: clean clone boots and a deliberately failing sample test demonstrates RED. Risk: version drift. |
| 3. Database foundation | Enums, tables, constraints, indexes, migrations, synthetic seed, generated types. Depends 1-2. Gate: clean reset and pgTAP integrity suite. Risk: irreversible schema error. |
| 4. Authentication and authorization | SSR Auth, recovery, profiles, permissions, location helpers, grants, RLS. Depends 3. Gate: full identity/role/location/verb matrix. Risk: privilege leak. |
| 5. Facility, space, and rate admin | Protected configuration RPCs/UI, effective rates, audit. Depends 4. Gate: validated mobile flows and immutable publish behavior. Risk: configuration mistake. |
| 6. Entry and QR ticket | Entry locks/idempotency, snapshot, ticket issue/reissue/print, space occupancy. Depends 3-5. Gate: concurrent plate/space tests and entry E2E. Risk: duplicate occupancy/token exposure. |
| 7. Validation, exit preview, and fee | Scanner/manual lookup, state transition, deterministic fee RPC and breakdown. Depends 3, 6, approved rules. Gate: every fee/state vector passes. Risk: monetary defect. |
| 8. Cash payment and confirmed exit | Shift requirement, exact-once payment/receipt, separate exit, atomic release. Depends 7. Gate: network interruption and concurrency E2E. Risk: partial settlement/release. |
| 9. Dashboard and Realtime | Aggregate RPC, filtered events, cache reconciliation, stale/poll fallback. Depends 6, 8. Gate: two-client convergence/reconnect tests. Risk: stale UI/quota use. |
| 10. Reports and audit | Paginated history, revenue/shift reports, protected audit review/export. Depends 8. Gate: totals reconcile to immutable payments/snapshots. Risk: data leakage. |
| 11. PWA and offline states | Manifest, icons, service worker, versioned read cache, connectivity/update prompts, mutation gates. Depends stable routes 5-10. Gate: install/offline tests prove no mutation queue. Risk: stale/sensitive cache. |
| 12. Security hardening | CSP/headers, CSRF/origin, MFA, rate limits, secret scans, device response, threat review. Depends complete surface. Gate: checklist passes with no critical/high finding. Risk: late design change. |
| 13. Automated release suite | Coverage, RLS, races, E2E, cross-browser, camera, accessibility, performance, build. Depends 3-12. Gate: at least 80% each metric, complete critical matrices, no skipped test. Risk: flaky/nonrepresentative tests. |
| 14. Staging, deployment, and pilot | Restore rehearsal, UAT, staff training, production deploy, rollback/continuity drill. Depends 13. Gate: Section 33 and signed go-live approval. Risk: operational readiness. |
| 15. Documentation and handover | Data dictionary, ADRs, runbooks, training/support, release/decision records. Depends validated release. Gate: a new operator can deploy, complete the flow, diagnose, and restore using docs. Risk: knowledge concentration. |

## 29. Prioritized Development Backlog

Priority is P0 release-blocking core, P1 MVP operational completeness, P2 optional MVP enhancement, and P3 post-MVP research. Complexity is relative.

| ID | Type | Item | Pri. | Dependencies | Size | Acceptance |
| --- | --- | --- | ---: | --- | --- | --- |
| EP-01 | EPIC | Secure parking operations foundation | P0 | None | XL | Approved contracts, schema, Auth/RLS, and state/fee gates pass. |
| FE-01 | FEATURE | Auth, profile, session, and device controls | P0 | EP-01 | L | `ADMIN`/`STAFF` login, refresh, logout, disable, location scope, MFA policy work. |
| FE-02 | FEATURE | Zone, space, vehicle type, and rate administration | P0 | FE-01 | L | Permissioned, validated, effective-dated, and audited configuration. |
| US-01 | USER STORY | Staff creates a parking entry | P0 | FE-01, FE-02 | L | Server time, snapshot, ticket, session, and occupancy commit atomically. |
| TT-01 | TECHNICAL TASK | Constraints, locks, versions, and idempotency | P0 | EP-01 | L | Concurrency suite proves exactly one valid outcome. |
| TT-02 | TECHNICAL TASK | QR token/hash and issue/reissue lifecycle | P0 | TT-01 | M | 256-bit opaque token, hash only at rest, revocation/replay tests. |
| US-02 | USER STORY | Staff scans and previews an exit | P0 | US-01, TT-02 | M | Scan never pays/exits; invalid/revoked/completed credentials reject safely. |
| TT-03 | TECHNICAL TASK | Fee engine and immutable snapshot | P0 | FE-02 | L | Signed vectors return exact centavo breakdowns. |
| US-03 | USER STORY | Staff records exact-once cash payment | P0 | US-02, TT-03 | L | Server-derived due, shift, receipt, replay/conflict behavior verified. |
| US-04 | USER STORY | Staff confirms vehicle exit separately | P0 | US-03 | L | Paid session completes and space releases atomically once. |
| BP-01 | BUG-PREVENTION TASK | Plate/space/payment/exit race suite | P0 | TT-01, US-04 | M | Deterministic concurrent tests pass with no partial state. |
| BP-02 | BUG-PREVENTION TASK | RLS and privileged-function security matrix | P0 | FE-01 | M | Unauthenticated, cross-location, escalation, grants, and search-path cases deny. |
| FE-03 | FEATURE | Dashboard and filtered Realtime | P1 | US-04 | M | Operational metrics converge and reconnect refetches truth. |
| FE-04 | FEATURE | Transactions, reports, shifts, and audit viewer | P1 | US-04 | L | Paginated, scoped, reconciled, and export-audited. |
| FE-05 | FEATURE | Lost ticket, cancellation, and correction workflows | P1 | FE-01, US-04 | L | Permission, reason, compensation, and immutable audit evidence. |
| TT-04 | TECHNICAL TASK | Installable PWA and read-only offline shell | P1 | Stable UI | M | Install/update/cache works; transaction controls cannot operate offline. |
| BP-03 | BUG-PREVENTION TASK | Monitoring, backup, restore, and rollback drills | P1 | Full MVP | M | Alerts fire and isolated restore meets declared objectives. |
| BP-04 | BUG-PREVENTION TASK | Accessibility/responsive/browser/camera suite | P1 | UI | M | WCAG checks, keyboard, viewports, engines, and fallback pass. |
| FE-06 | FEATURE | Private versioned receipt PDF | P2 | US-03 | S | Durable metadata and controlled artifact generation/retry. |
| FE-07 | FEATURE | Controlled offline-entry research | P3 | Stable MVP | XL | Separate threat/design approval exists before any implementation. |

## 30. Dependency Graph and Critical Path

```text
[Business decisions + state machine + fee rules]
                    |
                    v
[Schema + integrity constraints + RPC contracts] ---> [CI/test harness]
                    |                                  [UI shell + a11y]
                    v                                  [monitoring/runbooks]
             [Auth + RLS]
                    |
                    v
           [Spaces + rates]
                    |
                    v
            [Entry + QR ticket]
                    |
                    v
       [Validation + fee/exit preview]
                    |
                    v
              [Cash payment]
                    |
                    v
          [Confirm exit + release]
             /          |          \
            v           v           v
 [Realtime dashboard] [Reports] [PWA read-only offline]
             \          |          /
                    v
       [E2E + security + restore gates]
                    |
                    v
            [Deploy + pilot]
```

The critical path is decision approval → schema/invariants → Auth/RLS → space/rate configuration → entry/ticket → validation/fee preview → payment → confirmed exit → release/security tests → deployment. CI, UI primitives, observability, and runbooks can begin in parallel once contracts stabilize. Dashboard, reports, and PWA do not block implementation of the transaction core, but all are required for complete MVP acceptance.

## 31. Risk Register

| Risk | Category | Probability / impact | Warning signs | Prevention | Contingency | Owner role |
| --- | --- | --- | --- | --- | --- | --- |
| Free-tier exhaustion/terms | Infrastructure | Medium / High | 60-80% trends, throttles | Capacity dashboard, efficient queries, upgrade triggers | Upgrade; disable noncritical Realtime/export | Tech Lead / Operations |
| Supabase/Vercel outage | Operational | Medium / High | Health/provider incident | Paid plan for real operations, continuity and retry design | Pause writes, paper log, controlled reconciliation | Operations Lead |
| Mobile camera/printer variance | UX/hardware | High / Medium | Permission failures, slow scans, clipped print | Real-device/lighting/print matrix, manual lookup | Reissue/manual reference/alternate printer | Frontend / Operations |
| Race or partial transaction | Integrity | Medium / Critical | Conflicts/invariant alert | Partial indexes, locks, idempotency, atomic RPC tests | Disable RPC, preserve/reconcile audit through correction | Database Lead |
| Incorrect/ambiguous fee policy | Product/financial | Medium / Critical | Disputes or preview/final mismatch | Signed rules/examples, centavos, snapshots, boundary tests | Retire rate; evidenced correction/refund | Product Owner / Backend Lead |
| Staff misuse/privilege escalation | Security | Medium / High | Override/void/export spike | Least privilege, MFA, reasons, immutable audit | Suspend actor, revoke sessions, investigate | Facility Admin / Security Lead |
| Network interruption | Operational | High / High | Timeouts/disconnects | Online-only writes, same-key retry, clear continuity | Paper continuity and controlled reconciliation | Operations Lead |
| Migration failure | Delivery/data | Medium / Critical | Drift, locks, failed health | Clean reset/staging rehearsal, expand/contract, export | Halt; compatible app rollback plus forward fix/restore | Tech Lead / Database Lead |
| Weak RLS or secret exposure | Security | Low / Critical | Matrix/secret scan failure, anomalous query | Default deny, review, automated scans | Revoke key/access, patch policy, assess exposure | Security / Database Lead |
| Backup/restore failure | Recovery | Medium / Critical | Missed backup/hash or failed drill | Off-project encrypted versions, alerts, monthly restore | Select last verified copy; rebuild/reconcile evidence | Operations / Database Lead |
| Lost-ticket abuse | Fraud/operations | High / Medium | Rising exceptions by actor/device | Permission/evidence/penalty/manual review | Suspend flow/actor and investigate | Facility Admin |
| Realtime stale state | Reliability | High / Medium | Disconnect/stale badge | Reconnect backoff and authoritative refetch | Poll/manual refresh; never trust local write state | Frontend Lead |
| Scope creep | Product | High / Medium | Hardware/payment/multi-branch work enters P0/P1 | Signed MVP/non-goals and decision owner | Move item to Section 34 and protect critical path | Product Owner |

## 32. Definition of Done

Universal gate: requirements and contracts reviewed; validation and authorization at every boundary; loading/empty/error/offline states; redacted logs/audit where sensitive; RED/GREEN/refactor evidence; global coverage at least 80% in all four metrics; critical matrices complete; documentation; WCAG keyboard/focus/contrast; mobile verification; and no open critical/high security issue.

| Artifact | Mandatory evidence |
| --- | --- |
| Database tables/migrations | Rebuild from empty DB, constraints/indexes/FKs, synthetic seed, pgTAP, drift check, compatibility/corrective plan. |
| RLS/grants | Enabled, least grants, unauthenticated/role/location/verb matrix, no client bypass or self-elevation. |
| RPCs | Caller/location/permission checks, fixed search path, narrow execute grant, locks, idempotency, atomic rollback, stable errors, concurrency tests. |
| UI pages | Correct Server/Client split, semantic responsive design, labels/keyboard/focus, all states, no client authority/secret. |
| QR tickets | Entropy, hash-only storage, immediate print and later revoke/reissue, camera denial/manual fallback, tamper/replay/duplicate tests. |
| Fee engine | Approved rules, integer centavos, immutable snapshot, server authority, exact boundary/cross-day/multi-day/discount/penalty vectors. |
| Payment/receipt | Exact-once server-derived due, open-shift rule, unique reference, cancelled-session denial, audit, retry/interruption tests. |
| Exit and space release | Separate confirmation, sufficient settlement, terminal state, ticket completion, atomic release, duplicate/rollback tests. |
| Realtime/dashboard | Filtered events, unsubscribe, stale indicator, reconnect refetch, polling fallback, quota/latency measurement. |
| PWA/offline | Valid manifest/icons/install/update, safe cache headers, sanitized cache, logout clearing, no offline transaction queue. |
| Reports/audit | Location scope, pagination, timezone/currency correctness, payment reconciliation, export permission/audit. |
| Deployment/operations | Staging promotion, secret scan, safe health/smoke, monitoring/alerts, backup and isolated restore, rollback/continuity evidence. |
| Entire MVP | Section 33 evidence bundle, UAT/sign-off, trained operators, support ownership, and handover documentation. |

## 33. Final MVP Acceptance Checklist

- [ ] `ADMIN` and `STAFF` login, refresh, recovery, logout, disable, MFA policy, and protected routes work; unauthorized and cross-location requests are denied.
- [ ] Vehicle entry records database time, normalized plate, immutable rate snapshot, session/ticket/audit, and occupied space in one transaction.
- [ ] Two-device same-plate and same-space races yield exactly one success with no partial state.
- [ ] QR uses a 256-bit opaque token and only its hash persists; tampered, revoked, completed, wrong-location, and replayed tickets reject safely and log appropriate evidence.
- [ ] Scan only validates/previews; it never records payment, completes exit, or releases a space.
- [ ] Approved grace, interval, cap, overnight, cross-midnight, multi-day, discount, complimentary, penalty, adjustment, and quote-expiry examples return exact centavo results.
- [ ] Rate changes after entry cannot change the existing session snapshot or historical receipt.
- [ ] Payment derives the due amount server-side, requires a valid state/shift/current quote, records exactly once, and does not release the space.
- [ ] Same-key payment/exit replay returns the original result; changed-payload reuse conflicts; interruption/retry cannot double-record or double-release.
- [ ] Exit without sufficient payment, illegal transition, payment against cancellation, and completed-ticket reuse are denied.
- [ ] Separate exit confirmation stores official exit time, completes session/ticket, and releases the correct space atomically.
- [ ] Lost tickets, cancellation, voids, time/fee corrections, and overrides require exact permission and reason, append evidence, and deny ordinary staff.
- [ ] Dashboard metrics reconcile to database queries; Realtime reflects entry/payment/exit and reconnect performs authoritative refresh with a stale indicator.
- [ ] Transaction, revenue, occupancy, shift, and audit reports are paginated, location-scoped, timezone-correct, and export-audited.
- [ ] Login, entry, scanner/manual fallback, payment, exit, admin, and report flows work on supported mobile/desktop sizes and browser engines with keyboard and screen-reader-compatible semantics.
- [ ] PWA installs/updates; cached shell/read-only data works offline; no auth, QR token, payment, mutation, sensitive history, or transaction outbox is cached.
- [ ] Client bundle, env files, logs, Git history, and monitoring contain no service key, QR token, JWT/cookie, password, or other secret.
- [ ] CSP/security headers, Origin/CSRF, CORS, rate limits, Auth redirect allowlist, device/session revocation, and admin/approver MFA are verified.
- [ ] Every exposed table passes RLS/grant tests; every privileged function passes search-path, execute-grant, caller, location, and permission tests.
- [ ] Statements, branches, functions, and lines are each at least 80%; critical fee/state/permission/concurrency matrices are complete; no test is skipped/focused; CI is green.
- [ ] Core RPC performance, entry/scan targets, Realtime convergence, and pilot load objectives pass with documented results.
- [ ] Health/monitoring alerts are tested; a current encrypted export and isolated restore drill meet declared RPO/RTO.
- [ ] Routine deployment, emergency rollback, downtime continuity, reconciliation, incident, and lost-device runbooks are rehearsed.
- [ ] Provider usage is measured against current dashboards, upgrade triggers are reviewed, and no free-tier uptime guarantee is claimed.
- [ ] Release evidence contains SHA, migration IDs, CI/coverage, RLS/concurrency, Playwright/accessibility, security scans, UAT, smoke tests, alert test, and backup/restore record.

## 34. Post-MVP Roadmap

| Wave | Capabilities | MVP seam that prepares without overengineering |
| --- | --- | --- |
| 1. Customer communication | Secure customer ticket-view link, SMS/email receipts and reminders | Opaque revocable ticket credentials, minimal public projection, notification/outbox event boundary; no provider SDK in core transactions. |
| 2. Digital settlement | E-wallet/card/bank payments and provider webhooks | Append-only payment events, external references, idempotency, payment status/state separation, signed Edge webhook boundary. |
| 3. Recurring parking | Memberships, monthly/subscription parking, customer accounts | Stable vehicle/customer association can be added beside immutable sessions; rate snapshots accept a new approved pricing source. |
| 4. Reservations | Customer reservations and reserved-space allocation | Space/location IDs and session constraints remain authoritative; reservation is a separate lifecycle, not another session state. |
| 5. Multi-branch | Multi-location administration, consolidated reports, regional roles | Location on every row and policy helper; future membership table replaces one-location profile without changing session ownership. |
| 6. Automation hardware | ALPR, barrier gates, space sensors | Registered device identity, signed/replay-safe webhook boundary, immutable event/audit trail; no hardware abstraction in MVP. |
| 7. Intelligence | Predictive occupancy, anomaly/fraud detection | Clean historical sessions, rate/payment events, corrections, device/actor audit, and exportable privacy-governed datasets. |
| 8. Customer application | Reservation, ticket, receipt, membership, payment, notifications | Separate customer Auth/RLS surface and minimal projections; staff operational APIs remain isolated. |

Each wave requires its own product rules, privacy/security review, load/cost model, data migration, and acceptance tests. Stable identifiers, append-only financial/audit evidence, provider-neutral payment events, and narrow integration boundaries are sufficient preparation; the MVP does not add unused multi-tenant UI, hardware SDKs, queues, or machine-learning infrastructure.

## 35. Final Technical Recommendations

### Most important architectural decisions

1. Make PostgreSQL RPCs—not the browser, Route Handlers, or Edge Functions—the authority for time, fees, transitions, locks, idempotency, audit, payment, and occupancy.
2. Combine explicit grants, location-scoped RLS, protected profiles/permissions, and in-function authorization; never rely on editable or stale client claims.
3. Model payment and exit as separate exact-once transactions, with space release occurring only on confirmed exit or a permissioned corrective operation.
4. Use integer centavos, UTC instants, `Asia/Manila` business dates, immutable rate snapshots, and append-only financial/correction evidence.
5. Keep offline behavior read-only and integration boundaries narrow until separate risk reviews justify more authority.

### Five largest technical risks

1. Incorrect or ambiguous tariff rules causing customer disputes and historical inconsistency.
2. Concurrency defects allowing duplicate vehicles, double space assignment, payment replay, or partial release.
3. Authorization/RLS/function-grant defects exposing cross-location or privileged data/actions.
4. Network/provider limitations interrupting online-only payment and exit at operational peaks.
5. Inadequate backup, monitoring, device testing, and staff procedures turning recoverable failures into operational incidents.

### First ten implementation tasks

1. Obtain written approval for tariff, rounding, overnight, lost-ticket, discount, shift, retention, and recovery rules.
2. Freeze the state machine, invariants, API envelope, error codes, and transaction boundaries as reviewed contracts.
3. Scaffold the pinned Next.js/Supabase/Vitest/Playwright toolchain and CI with strict TypeScript and environment validation.
4. Write failing pgTAP tests for schema constraints, active-session uniqueness, idempotency, and immutable evidence.
5. Implement migrations for location, profiles/permissions, spaces, vehicles, rates/snapshots, sessions, tickets, payments, shifts, corrections, audit, and idempotency.
6. Write and pass the full Auth/RLS/grant/privileged-function security matrix.
7. Write failing fee/state tests, then implement the deterministic database fee and transition functions.
8. Implement exact-once entry plus QR issue/reissue and prove same-plate/same-space concurrency safety.
9. Implement ticket validation, exit preview, cash payment, and separate exit confirmation with interruption/replay tests.
10. Build the accessible mobile-first operational UI and complete the critical Playwright entry-to-exit flow before dashboard/report polish.

### Recommended MVP build order

Decisions and threat model → repository/CI → schema/invariants → Auth/RLS → facility/spaces/rates → entry/QR → validation/fee preview → cash payment → confirmed exit/release → exception workflows → dashboard/Realtime → reports/audit/shifts → PWA/offline states → hardening/release suite → staging/pilot/handover.

### Do not build yet

Do not build digital payments, public customer verification unless approved, offline authoritative transactions, reservations, memberships/subscriptions, multi-branch administration, ALPR, barriers, sensors, customer apps, predictive models, fraud scoring, or provider/hardware abstractions without an accepted capability plan.

### Decisions that must be finalized before coding

- Production tariff values and effective dates; grace, interval rounding, daily cap, overnight, tax, discount, complimentary, and paid-exit rules.
- Lost-ticket evidence/penalty, cancellation/void/correction approval, and detailed cash reconciliation/shift-closing policy beyond the default open-shift requirement.
- Facility zones/spaces, vehicle types, expected peak volume/devices, supported printers, receipt/ticket format, and public ticket-verification need.
- Data retention/privacy notices, export authority, backup retention, commercial RPO/RTO, manual continuity, support ownership, and infrastructure tier.

### Realism assessment

E-ParkGO is realistic for a development project and limited operational pilot because its core workflow maps cleanly to a serverless PWA plus transactional PostgreSQL. The plan avoids an always-running custom server and reserves complexity for proven needs. It is ready for architecture/security review and TDD implementation once the listed business policies are signed. A commercial launch is credible only after concurrency/RLS/fee evidence, real-device testing, trained operators, monitored paid infrastructure where required, and a successful restore and continuity rehearsal satisfy the release gates above.
