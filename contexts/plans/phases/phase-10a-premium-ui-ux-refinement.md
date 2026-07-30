# Phase 10A — Premium UI/UX Refinement

<!-- ============================================================
PHASE 10A START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 10A and Phase 10 is COMPLETE.
============================================================ -->

## 10A.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: NOT_STARTED`.
- `AUTHORIZED_ENVIRONMENT: LOCAL_ONLY`;
  `EXECUTION_MODE: LOCAL_VERIFICATION_AND_REPAIR_ONLY`.
- Load project skills in order: `redesign-existing-projects`, `frontend-design`,
  `ui-ux-pro-max`, `shadcn`, `enterprise`, `premium-frontend-ui`,
  `design-system`, `frontend-patterns`, `accessibility`, `browser-qa`,
  `tdd-workflow`, `verification-loop`, `security-review`, `coding-standards`.
- Load plugin skills: `v-react-best-practices`, `v-shadcn`,
  `pl-browser-automation`, `sp-executing`, `sp-requesting-review`,
  `c-review-bugbot`, `c-security-review`.
- Load `gsap-core` / `gsap-react` / `gsap-scrolltrigger` only when Phase 10A
  motion work requires GSAP.
- Load `context7-mcp` before uncertain Next.js, React, Playwright, axe, Tailwind,
  Base UI, or shadcn APIs.
- Required dependency: a linked Phase 10 PASS attempt and `PLAN.md §0.2`
  explicitly selecting this playbook.
- Design authority: `DESIGN.md`. Product/data authority remains `PLAN.md`,
  PostgreSQL RPCs, schemas, authorization, and existing tests.
- Authoritative requirements: `PLAN.md §§2, 5, 18, 21–23, 28, 32–33` and
  `DESIGN.md §§1–12`.
- Execution unit: one fresh Composer 2.5 session per numbered step. At 70%
  context utilization, stop at a completed step boundary, append a receipt, and
  resume in a fresh session.

Do not treat the reference PNGs as product contracts. Classify each reference
element `SUPPORTED`, `ADAPTED`, `DEFERRED`, or `EXCLUDED` before reproducing it.

## 10A.1 Outcomes and non-goals

Deliver the Precision Operations UI across every implemented public, auth,
protected, admin, print, and system page. Refine tokens, geometry, typography,
shell, shared compositions, real-data presentation, responsive behavior, page
states, accessibility, and interaction polish without changing domain behavior.

Remove production placeholder metrics/data, dead controls, generic promotion,
fake notifications/search/date/facility affordances, excessive rounding,
decorative gradients, equal KPI-card walls, and unsupported reference features.

Non-goals:

- no migration, schema, RPC, RLS, grant, generated Supabase type, API envelope,
  money, timestamp, QR, state-machine, idempotency, payment, or release change;
- no PWA/service-worker/cache implementation;
- no Phase 12 security capability or route;
- no new runtime UI framework, font, icon set, animation library, analytics,
  tracking, or external asset sink;
- no manual edits to generated shadcn source under `src/components/ui/**`.

## 10A.2 Authorized file surface

| Action        | Exact path set                                                                                                      | Purpose                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| READ          | Current files under `src/app`, `src/components`, `src/features/*/components`, and `tests`                           | Step 10A.0 inventory only; reading does not authorize edits. |
| READ          | `contexts/plans/phases/phase-10a-allowed-files.txt`                                                                 | Machine-readable final allowlist.                            |
| MODIFY/CREATE | Only its paths and the narrower owning step list                                                                    | Fail-closed presentation and test scope.                     |
| MODIFY        | `package.json`, `package-lock.json`                                                                                 | Exact dev-only axe version in Step 10A.0.                    |
| GENERATE      | `tests/e2e/ui-visual-regression.spec.ts-snapshots/**`                                                               | Reviewed Chromium/mobile-Chrome baselines only.              |
| DO NOT COMMIT | `test-results/**`, `playwright-report/**`                                                                           | Local diff/report evidence after sensitive-artifact review.  |
| APPEND        | `contexts/plans/evidence/phase-10a.md`                                                                              | Immutable execution receipts.                                |
| FORBIDDEN     | `supabase/**`, `src/components/ui/**`, feature services/actions/schemas/queries, API contracts, every unlisted file | Stop and amend this playbook before any out-of-list edit.    |

Existing component APIs should remain stable where practical. If `shell.tsx` or
another file exceeds the project size target, split it into focused files inside
the exact Step 10A.1 paths before adding more logic.

## 10A.3 TDD execution

### Step 10A.0 — Guard, inventory, and baseline

Authorized writes: `package.json`, `package-lock.json`,
`tests/e2e/ui-visual-regression.spec.ts`, and
`tests/e2e/ui-visual-regression.spec.ts-snapshots/**`, local uncommitted
`test-results/**`/`playwright-report/**`, and
`contexts/plans/evidence/phase-10a.md` only.

1. Confirm Phase 10 PASS evidence and the exact active pointer.
2. Inventory live routes, page states, shell, feature components, primitives,
   reference images, tests, hardcoded presentation data, arbitrary colors/radii,
   dead affordances, and client/server boundaries.
3. Record the reference classification and baseline findings in the Phase 10A
   evidence receipt using synthetic data only.
4. Capture light/dark baselines at 375px, 768px, and 1440px. Record overflow,
   console, hydration, failed-request, keyboard, focus, and accessibility issues.
5. Reverify official package compatibility. The planning check verified
   `@axe-core/playwright@4.12.1` with `playwright-core >=1.0.0`; if that exact
   version is no longer acceptable, stop and amend the playbook rather than
   choosing another package or version.
6. Install only the exact dev dependency below, then write the visual/a11y test
   before production UI changes. The test resets to deterministic seed data,
   covers light/dark at 375/768/1440, asserts exactly one live
   `.ticket-print-qr` before masking it, and disables trace/video for
   credential-bearing cases.

```powershell
npm run db:start
npm run db:reset
npm install --save-dev --save-exact @axe-core/playwright@4.12.1
npm run typecheck
npm run lint
npm test
npm run test:e2e -- tests/e2e/ui-visual-regression.spec.ts --project=chromium --project=mobile-chrome --update-snapshots
npm run test:e2e -- tests/e2e/ui-visual-regression.spec.ts --project=chromium --project=mobile-chrome
git diff --check
```

Expected: the existing application gate passes; current-state diagnostic
snapshots are generated under
`tests/e2e/ui-visual-regression.spec.ts-snapshots/`, then pass unchanged. Record
this first receipt as expected `FAIL` because the Phase 10A design requirements
are not yet implemented. Snapshot generation never approves a design.

### Step 10A.1 — Foundations, compositions, and protected shell

Authorized paths:

- Modify `src/app/globals.css`, `src/app/(protected)/shell.tsx`, and
  `src/components/shared/theme-toggle.tsx`.
- Create `src/components/shared/page-header.tsx`, `work-surface.tsx`,
  `status-label.tsx`, `page-state.tsx`, and `metric-strip.tsx`.
- If splitting is required, create only
  `src/app/(protected)/_components/protected-sidebar.tsx`,
  `protected-topbar.tsx`, `protected-mobile-nav.tsx`, and `account-menu.tsx`.
- Create `tests/unit/design-system.test.tsx` and
  `tests/unit/protected-shell.test.tsx`; modify
  `tests/e2e/ui-visual-regression.spec.ts`.

Refine semantic OKLCH tokens, theme parity, geometry, typography, spacing,
elevation, focus, density, and reduced motion. Implement the justified
`PageHeader`, `WorkSurface`, `StatusLabel`, `PageState`, and `MetricStrip`
compositions from existing primitives. Refine/split the protected shell; remove
false affordances and sub-44px targets; add the functional account menu and
authorized navigation without changing auth behavior.

```powershell
npx vitest run tests/unit/design-system.test.tsx tests/unit/protected-shell.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Expected: token/composition roles, focus, theme, navigation visibility, account
behavior, and shell tests pass with no generated-primitive edits.

### Step 10A.2 — Public, auth, navigation, and system surfaces

Authorized paths:

- Modify `src/app/page.tsx`, `src/app/(auth)/login/page.tsx`,
  `src/app/(auth)/forgot-password/page.tsx`,
  `src/app/(auth)/update-password/page.tsx`,
  `src/components/landing/landing-page.tsx`;
  `src/components/landing/landing-footer.tsx`;
  `src/features/auth/components/auth-shell.tsx`, `login-form.tsx`,
  `forgot-password-form.tsx`, and `update-password-form.tsx`.
- Create `src/app/not-found.tsx`, `src/app/error.tsx`,
  `src/app/(auth)/error.tsx`, `src/app/(auth)/loading.tsx`,
  `src/app/(protected)/error.tsx`, and `src/app/(protected)/loading.tsx`.
- Modify `tests/unit/landing-page.test.tsx`, `login-form.test.tsx`,
  `auth-actions.test.ts`, `auth-callback.test.ts`,
  `tests/e2e/landing-visual.spec.ts`, `auth-visual.spec.ts`,
  `auth-live.spec.ts`, and `ui-visual-regression.spec.ts`.

Refine `/`, `/login`, `/forgot-password`, `/update-password`, protected desktop
and mobile navigation, not-found, loading, and route error surfaces. Preserve
anti-enumeration and redirect behavior. Use real product claims and supported
actions only. Write/extend tests before each behavior change.

```powershell
npx vitest run tests/unit/landing-page.test.tsx tests/unit/login-form.test.tsx tests/unit/auth-actions.test.ts tests/unit/auth-callback.test.ts
npm run test:e2e -- tests/e2e/landing-visual.spec.ts tests/e2e/auth-visual.spec.ts tests/e2e/auth-live.spec.ts
npm run typecheck
npm run lint
git diff --check
```

Expected: public/auth functionality remains intact and responsive light/dark,
keyboard, focus, validation, recovery, and system-state evidence passes.

### Step 10A.3 — Critical entry-to-exit journey

Authorized paths:

- Modify `src/app/(protected)/entry/page.tsx`,
  `src/app/(protected)/tickets/[ticketNumber]/page.tsx`,
  `src/app/(protected)/scanner/page.tsx`,
  `src/app/(protected)/verify/page.tsx`,
  `src/app/(protected)/exit/[sessionId]/page.tsx`,
  `src/app/(protected)/payments/page.tsx`,
  `src/app/(protected)/payments/[sessionId]/page.tsx`,
  `src/app/(protected)/exit/[sessionId]/confirm/page.tsx`, and
  `src/app/(protected)/shifts/page.tsx`.
- Modify `src/features/entry/components/entry-form.tsx`;
  `src/components/tickets/ticket-view.tsx` and `ticket-print.css`;
  `src/features/tickets/components/ticket-page-client.tsx`;
  `src/features/scanner/components/scanner-page-client.tsx`,
  `scanner-view.tsx`, `verify-fragment.tsx`, and `verify-page-client.tsx`;
  `src/features/exit/components/exit-page-client.tsx`, `fee-breakdown.tsx`, and
  `exit-confirmation.tsx`; `src/features/payments/components/payment-form.tsx`
  and `receipt-print.tsx`; and
  `src/features/shifts/components/shift-panel.tsx`.
- Modify `tests/unit/ticket-view.test.tsx`, `fee-breakdown.test.tsx`,
  `tests/e2e/entry-ticket.spec.ts`, `scanner-exit-preview.spec.ts`,
  `payment-exit.spec.ts`, `exception-workflows.spec.ts`, and
  `ui-visual-regression.spec.ts`.
- Create `tests/unit/entry-form.test.tsx`, `scanner-view.test.tsx`,
  `payment-form.test.tsx`, and `shift-panel.test.tsx`.

Refine in this order:

1. `/entry` and `/tickets/[ticketNumber]`;
2. `/scanner` and `/verify`;
3. `/exit/[sessionId]`;
4. `/payments` and `/payments/[sessionId]`;
5. `/exit/[sessionId]/confirm` and `/shifts`.

Run the owning targeted suite after every route pair. Do not change schemas,
RPCs, token handling, centavo contracts, official time, state transitions,
idempotency, settlement, or space release. `/payments` may change only from its
current no-query not-found state to the static scanner/sessions navigation
surface specified in `DESIGN.md`; it adds no lookup or payment capability.

```powershell
npm run test:e2e -- tests/e2e/entry-ticket.spec.ts tests/e2e/scanner-exit-preview.spec.ts tests/e2e/payment-exit.spec.ts tests/e2e/exception-workflows.spec.ts
npm run typecheck
npm run lint
npm test
git diff --check
```

Expected: entry through final release remains behaviorally identical while all
defined page states, responsive layouts, print, camera fallback, keyboard, focus,
and safe retry behavior pass.

### Step 10A.4 — Monitoring, configuration, and historical surfaces

Authorized paths:

- Modify `src/app/(protected)/dashboard/page.tsx`,
  `src/app/(protected)/sessions/page.tsx`,
  `src/app/(protected)/spaces/page.tsx`,
  `src/app/(protected)/admin/rates/page.tsx`,
  `src/app/(protected)/admin/staff/page.tsx`,
  `src/app/(protected)/admin/settings/page.tsx`,
  `src/app/(protected)/transactions/page.tsx`,
  `src/app/(protected)/reports/page.tsx`, and
  `src/app/(protected)/admin/audit/page.tsx`.
- Modify `src/components/dashboard/dashboard-view.tsx`, `kpi-stat-cards.tsx`,
  `metric-grid.tsx`, `occupancy-overview.tsx`, `realtime-status.tsx`,
  `recent-entries-table.tsx`, `revenue-trend.tsx`, `space-map-grid.tsx`, and
  `zone-occupancy.tsx`; `src/components/spaces/space-board.tsx`,
  `space-editor.tsx`, and `spaces-view.tsx`;
  `src/features/sessions/components/exception-actions.tsx`;
  `src/features/rates/components/rate-editor.tsx` and `rate-version-list.tsx`;
  `src/features/staff/components/staff-management.tsx`;
  `src/features/facility/components/facility-settings-form.tsx`; and Phase 10
  files `src/components/reports/report-summary.tsx`, `report-table.tsx`, and
  `audit-event-detail.tsx`.
- Modify `tests/unit/dashboard-components.test.tsx`,
  `dashboard-view.test.tsx`, `zone-occupancy.test.tsx`,
  `tests/e2e/dashboard-realtime.spec.ts`, `configuration.spec.ts`,
  `reports-audit.spec.ts`, and `ui-visual-regression.spec.ts`.
- Create `tests/unit/sessions-view.test.tsx`, `spaces-view.test.tsx`,
  `rate-editor.test.tsx`, `staff-management.test.tsx`,
  `facility-settings-form.test.tsx`, `reports-view.test.tsx`, and
  `audit-view.test.tsx`.

Refine `/dashboard`, `/sessions`, `/spaces`, `/admin/rates`, `/admin/staff`,
`/admin/settings`, `/transactions`, `/reports`, `/admin/audit`, and expanded
shift history. Replace placeholder presentation values with authorized data or
remove them. Preserve role/location scoping, Realtime invalidation, pagination,
reconciliation, export audit, and redaction. Do not add session filters,
pagination, or queries beyond the current bounded service contract.

```powershell
npm run test:e2e -- tests/e2e/dashboard-realtime.spec.ts tests/e2e/configuration.spec.ts tests/e2e/reports-audit.spec.ts
npm run typecheck
npm run lint
npm test
git diff --check
```

Expected: real-data presentation, responsive tables/records, filters, reports,
export, audit detail, Realtime state, permissions, and empty/error states pass.

### Step 10A.5 — Cross-page release gate

Verify every applicable loading, empty, error, success, conflict, stale,
reconnecting, offline-disabled, permission, confirmation, light/dark, reduced
motion, 400% reflow, print, 375/768/1440 layout, and five-project browser state.
Stable screenshot assertions run in Chromium desktop and mobile Chrome; other
projects run functional, overflow, and interaction checks. Require zero serious
or critical axe violations and no sensitive artifact leakage.

Before accepting new snapshots:

1. Run the suite without update flags and retain the expected diff artifacts.
2. Review every changed page/theme/viewport; a bulk snapshot rewrite is never
   approval. QR areas must use an exact-one `.ticket-print-qr` assertion before
   masking, and credential cases must show trace/video disabled in the test.
3. Run `sp-requesting-review`, `c-review-bugbot`, `c-security-review`, and the
   `silent-failure-hunter` agent. Fix/reverify every critical/high finding;
   record an owner and rationale for every accepted medium/low finding.
4. Only after review approval, run the exact update command and a clean repeat:

```powershell
npm run test:e2e -- tests/e2e/ui-visual-regression.spec.ts --project=chromium --project=mobile-chrome --update-snapshots
npm run test:e2e -- tests/e2e/ui-visual-regression.spec.ts --project=chromium --project=mobile-chrome
```

Then run the full gate:

```powershell
$baseMatch = Select-String -LiteralPath "contexts/plans/evidence/phase-10a.md" -Pattern "^- Base SHA: ([0-9a-f]{40})$" | Select-Object -First 1
if (-not $baseMatch) { throw "Phase 10A Base SHA is missing from evidence." }
$phase10aBaseSha = $baseMatch.Matches[0].Groups[1].Value
$changedPaths = @((git diff --no-renames --name-only $phase10aBaseSha --); (git ls-files --others --exclude-standard)) | Sort-Object -Unique
$deletedPaths = git diff --no-renames --name-only --diff-filter=D $phase10aBaseSha --
if ($deletedPaths) { $deletedPaths; throw "Phase 10A may not delete files." }
$allowRules = Get-Content -LiteralPath "contexts/plans/phases/phase-10a-allowed-files.txt" | Where-Object { $_ -and -not $_.StartsWith("#") }
$unexpectedPaths = $changedPaths | Where-Object {
  $candidate = $_
  -not ($allowRules | Where-Object {
    $rule = $_
    if ($rule.EndsWith("/*")) {
      $candidate.StartsWith($rule.Substring(0, $rule.Length - 1), [System.StringComparison]::Ordinal)
    } else {
      $candidate -ceq $rule
    }
  })
}
if ($unexpectedPaths) { $unexpectedPaths; throw "Phase 10A changed an unlisted file." }
$credentialPattern = "sk-(?:proj-)?[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|#v1\.[A-Za-z0-9_-]{43}"
$credentialHits = $changedPaths | Where-Object { $_ -match "\.(ts|tsx|css|md|json|txt)$" } | ForEach-Object { Select-String -LiteralPath $_ -Pattern $credentialPattern }
if ($credentialHits) { $credentialHits; throw "Credential-like content found in Phase 10A files." }
$unsafeArtifacts = Get-ChildItem -Path "test-results","playwright-report" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in ".zip",".webm" -or $_.Name -match "trace" }
if ($unsafeArtifacts) { $unsafeArtifacts; throw "Trace/video artifacts require removal and security review." }
npm run db:reset
npm run db:test
npm run db:types
git diff --exit-code -- src/lib/supabase/database.types.ts
npm run format:check
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/auth-live.spec.ts tests/e2e/auth-visual.spec.ts tests/e2e/landing-visual.spec.ts tests/e2e/configuration.spec.ts tests/e2e/entry-ticket.spec.ts tests/e2e/scanner-exit-preview.spec.ts tests/e2e/payment-exit.spec.ts tests/e2e/exception-workflows.spec.ts tests/e2e/dashboard-realtime.spec.ts tests/e2e/reports-audit.spec.ts tests/e2e/ui-visual-regression.spec.ts
git diff --check
```

Require all database assertions, generated-type drift, format, typecheck, lint,
unit/integration tests, build, and E2E to pass; at least 80% statements, branches,
functions, and lines; no horizontal overflow, clipped/sticky obstruction,
hydration/console/unexpected request failure, or unresolved critical/high
accessibility, security, review, or silent-failure finding.

Because `src/components/ui/**` is excluded from Vitest coverage, coverage alone
cannot satisfy browser interaction, accessibility, or visual evidence.

## 10A.4 Failure matrix

| Failure                                                            | Required disposition                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Domain/API/query/schema/RPC drift                                  | Stop; revert the attempted scope and amend the owning phase.                                                       |
| Raw credential or sensitive screenshot/trace                       | Delete unsafe artifacts, fix masking/trace policy, rotate if real, rerun security review.                          |
| Unexpected console, hydration, or 4xx/5xx                          | Diagnose and fix; never baseline or suppress it.                                                                   |
| Serious/critical axe, keyboard, focus, contrast, or reflow failure | Fix and rerun the affected page family and full visual suite.                                                      |
| Unapproved visual mismatch                                         | Keep RED artifacts; do not update snapshots until reviewer approval.                                               |
| Generated-type or unlisted-file drift                              | Stop, restore the generated/unlisted file through a reviewed patch, and amend the allowlist if genuinely required. |

## 10A.5 Evidence and handoff

Append a complete PASS/FAIL/BLOCKED attempt to
`contexts/plans/evidence/phase-10a.md` using the evidence contract. Include route
inventory, reference classification, screenshot paths, axe summary, browser
projects, viewport/theme matrix, commands and exit codes, coverage, review
findings, dependency changes, sensitive-artifact scan, and known gaps.

Only after a PASS attempt exists: link it from `PLAN.md §0.2`, mark Phase 10A
complete, activate Phase 11, set its active playbook, and stop.

> **END OF PHASE 10A — STOP.** Do not start PWA/offline work in this run.

<!-- ============================================================
PHASE 10A END — HARD STOP
============================================================ -->
