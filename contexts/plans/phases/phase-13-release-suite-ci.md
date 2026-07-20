# Phase 13 — Automated Release Suite and CI

<!-- ============================================================
PHASE 13 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 13 and Phase 12 is COMPLETE.
============================================================ -->

## 13.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: PARTIAL` because Vitest, coverage
  thresholds, Playwright projects, Auth tests, and pgTAP exist, but CI and the
  complete workflow suite do not.
- Load project `tdd-workflow`, `ai-regression-testing`, `verification-loop`;
  plugins `pl-browser-automation`, `c-review-bugbot`, `sp-finish-branch`,
  `v-verification`.
- Dependencies: every functional/security Phase 3–12 gate complete.
- Phase 13 consolidates evidence; it does not defer feature tests from prior phases.
- No production deploy, branch-protection mutation, or external secret creation.

## 13.1 Delivered release controls

Deliver deterministic CI, global ≥80% statements/branches/functions/lines, no
focused/skipped tests, clean migration/type drift checks, complete RLS/state/fee/
concurrency/idempotency matrices, full entry-to-exit E2E, cross-browser/mobile,
accessibility, camera fallback, PWA, security, build, and representative hot-RPC
performance evidence.

Manual real-device camera/printer and recovery drills remain named evidence items;
CI must not fake them or claim them from emulation.

Authoritative contracts: `PLAN.md §§5, 21, 23, 24, 27, 32, 33`.

## 13.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `.github/workflows/ci.yml` | Frozen install → quality → DB → build → E2E/security jobs. |
| MODIFY | `package.json`, `package-lock.json` | Exact release/guard/a11y scripts and pinned test dependencies. |
| MODIFY | `vitest.config.ts` | Stable unit/integration discovery, global coverage output, and justified exclusions. |
| MODIFY | `playwright.config.ts` | CI projects/reporters/artifacts without weakening local matrix. |
| CREATE | `scripts/check-focused-tests.mjs` | Fail on `.only`, focused, or unauthorized skip markers. |
| CREATE | `scripts/check-generated-types.mjs` | Regenerate local types and fail on drift. |
| CREATE | `scripts/verify-release.mjs` | Orchestrate only documented local checks; no secrets. |
| CREATE | `tests/fixtures/release/*` | Deterministic synthetic users/rates/sessions. |
| CREATE | `tests/helpers/local-auth.ts`, `local-db.ts` | Isolated local setup/cleanup. |
| CREATE | `tests/e2e/critical-path.spec.ts` | Login → shift → entry → ticket → scan → preview → pay → exit. |
| CREATE | `tests/e2e/critical-negative.spec.ts` | Races, replay, revoked/wrong QR, interruptions, exceptions. |
| CREATE | `tests/e2e/accessibility.spec.ts` | axe/keyboard/focus/reduced-motion evidence. |
| CREATE | `tests/performance/core-rpcs.sql` | Representative bounded local concurrency/latency workload. |
| CREATE | `scripts/run-core-rpc-performance.ps1` | Fail-closed local-only wrapper and redacted performance evidence. |
| CREATE | `docs/security/release-security-review.md` | Phase 13 review and Bugbot disposition. |
| CREATE | `docs/operations/release-evidence-template.md` | SHA, versions, counts, links, manual gaps. |
| FORBIDDEN | Production credentials/data; skipped critical tests; coverage exclusion of authored domain code | Gate failure. |

## 13.3 Ordered execution

### Step 13.1 — Inventory and RED guard tests

Map every `§33` acceptance item to an automated test or named manual Phase 14/15
evidence item. Add a temporary focused/skip fixture to prove the guard fails, then
remove it and retain unit tests for the guard. Run coverage in isolation and
require a zero exit; printed passing metrics never override a nonzero command.

```powershell
node scripts/check-focused-tests.mjs
npm run test:coverage
```

Expected: clean tree exits 0; all four global metrics are at least 80%; coverage
artifact generation completes without unhandled error.

### Step 13.2 — Complete local integration and critical E2E

Write missing integration/E2E cases before helpers. Use observable conditions,
not arbitrary sleeps. Tests create isolated synthetic local data and clean it
without depending on execution order.

```powershell
npm run db:reset
npm run db:test
npm run test:e2e -- tests/e2e/critical-path.spec.ts tests/e2e/critical-negative.spec.ts
```

Expected: all database and configured browser projects pass with no skip/focus.

### Step 13.3 — Accessibility, PWA, camera, and performance

Use the browser automation skill for axe/keyboard/focus and camera-denial/manual
fallback. Run representative local concurrent RPC workload; record p50/p95,
errors, workload and machine context without claiming production capacity.

```powershell
npm run test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/pwa-offline.spec.ts tests/e2e/scanner-exit-preview.spec.ts
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-core-rpc-performance.ps1
```

Expected: zero serious/critical automated accessibility violations, critical
keyboard paths pass, PWA policy passes, camera fallback passes, and the performance
wrapper exits 0 after invoking the repository-pinned
`npx supabase db query --local --file tests/performance/core-rpcs.sql`. The wrapper
must first prove local target selection, reject linked/remote targets, bound the
workload, fail on SQL/integrity errors, and write redacted machine, workload, p50,
p95, maximum, and error-count JSON under the ignored test-results directory.

### Step 13.4 — CI workflow

Implement CI with pinned Node/npm install and these ordered gates: `npm ci`,
format check, focused-test guard, lint, typecheck, unit coverage, local Supabase
start/reset/pgTAP, generated-type drift, production build, Playwright smoke/full,
accessibility, and documented security checks. Use CI-only secrets described in
`.env.example`; never echo them or connect to production.

Validate workflow syntax locally with an available documented tool; if no runner
is installed, push/remote execution requires explicit user authorization and the
phase remains pending remote-CI evidence.

```powershell
git diff --check -- .github/workflows/ci.yml package.json package-lock.json scripts tests
```

Expected: local workflow/config changes have no whitespace error; the completion
record names the official syntax validator or authorized CI run used for semantic
validation. A diff check alone is not recorded as proof that CI ran.

### Step 13.5 — Independent reviews

Run code, TypeScript, security, and silent-failure review using the prescribed
agents/skills. Fix all critical/high issues and rerun affected gates. Record
medium/low decisions with owner and rationale.

```powershell
npm run typecheck
npm run lint
npm run test:coverage
git diff --check
```

Expected: affected local gates exit 0 after review fixes; the review record lists
each finding and disposition.

## 13.4 Gate and handoff

Local gate, in order:

```powershell
npm ci
npm run format:check
node scripts/check-focused-tests.mjs
npm run lint
npm run typecheck
npm run test:coverage
npm run db:start
npm run db:reset
npm run db:test
npm run db:types
node scripts/check-generated-types.mjs
npm run build
npm run test:e2e
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-core-rpc-performance.ps1
git diff --check
```

Completion additionally requires the CI workflow green on an authorized branch,
global ≥80% on every coverage metric, no skips/focus, complete critical matrices,
documented manual real-device gaps for Phase 14, performance output with machine/
workload context and zero integrity errors, and no unresolved critical/high review
or security finding.

Append SHA, run URL, versions, commands/exits, counts, coverage, browsers,
performance, findings, and artifacts to `contexts/plans/evidence/phase-13.md`.
Link its successful anchor from §0.2, set Phase 13 complete and Phase 14 active,
update the playbook, and stop.

> **END OF PHASE 13 — STOP.** Do not provision or deploy environments.

<!-- ============================================================
PHASE 13 END — HARD STOP
============================================================ -->
