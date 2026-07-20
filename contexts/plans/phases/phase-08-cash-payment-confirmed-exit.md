# Phase 8 — Cash Payment, Exceptions, and Confirmed Exit

<!-- ============================================================
PHASE 8 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 8 and Phase 7 is COMPLETE.
============================================================ -->

## 8.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: NOT_STARTED`.
- Load project `backend-patterns`, `security-review`, `supabase`; plugins
  `plug-supabase`, `sp-executing`; load `context7-mcp` for uncertain APIs.
- Dependencies: Phase 7 complete; development shift/payment/lost-ticket/correction
  rules and state vectors recorded with approver/date in
  `contexts/plans/evidence/phase-08.md` before Step 8.1.
- Exclude digital payment providers, asynchronous PDF receipt, dashboard,
  reporting presentation, and remote deployment.

## 8.1 Delivered features and phase ownership

Deliver minimum start/close cash shift, exact-once server-derived cash payment,
receipt metadata and print, quote refresh/top-up, separate exact-once confirmed
exit, ticket completion and atomic space release, plus transaction-critical
exception workflows: lost ticket, eligible cancellation, manual review,
permissioned correction/discount/complimentary/adjustment, and append-only payment
void/reversal. Phase 10 owns shift/report/audit history presentation.

Payment never releases a space. Exit requires sufficient non-voided settlement
and releases exactly once. No original payment, receipt, ticket, audit, or
correction evidence is updated or deleted.

Authoritative contracts: `PAY-001..002`, `EXIT-003..004`, `LOST-001`,
`OVR-001..002`, `SHIFT-001`, `PLAN.md §§8, 9, 13, 15, 17, 18, 21, 22, 23, 32`.

## 8.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `supabase/tests/00012_shift_payment_exit.sql` | Shift/payment/exit/state tests. |
| CREATE | `supabase/tests/00013_payment_exit_concurrency.sql` | Replay/interruption/race tests. |
| CREATE | `supabase/tests/00014_exception_workflows.sql` | Lost/cancel/correct/void/manual-review permissions. |
| CREATE | `supabase/migrations/<CLI-generated>_phase8_payment_exit_exceptions.sql` | Named §13 RPCs and receipt allocation. |
| CREATE | `src/features/shifts/schemas.ts`, `service.ts`, `actions.ts` | Minimum open/close workflow. |
| CREATE | `src/features/shifts/components/shift-panel.tsx` | Start/close/variance UI. |
| CREATE | `src/features/payments/schemas.ts`, `service.ts`, `actions.ts` | Strict cash boundary. |
| CREATE | `src/features/payments/components/payment-form.tsx` | Bigint tender/change and confirm UI. |
| CREATE | `src/features/payments/components/receipt-print.tsx` | Browser-print MVP receipt. |
| CREATE | `src/features/exit/components/exit-confirmation.tsx` | Separate final exit UI. |
| CREATE | `src/features/sessions/schemas.ts`, `service.ts`, `actions.ts` | Exception request boundaries. |
| CREATE | `src/features/sessions/components/exception-actions.tsx` | Permissioned reason/evidence dialogs. |
| CREATE | `src/app/(protected)/payments/[sessionId]/page.tsx` | Payment page. |
| CREATE | `src/app/(protected)/exit/[sessionId]/confirm/page.tsx` | Paid-exit page. |
| CREATE | `src/app/(protected)/shifts/page.tsx` | Own shift workflow. |
| CREATE | `src/app/(protected)/sessions/page.tsx` | Active/exception search and actions. |
| CREATE | `src/app/api/payments/route.ts` | Exact-once payment POST. |
| CREATE | `src/app/api/exit/confirm/route.ts` | Exact-once exit POST. |
| CREATE | `src/app/api/shifts/start/route.ts`, `close/route.ts` | Shift boundaries if Server Actions are insufficient. |
| CREATE | `src/app/api/sessions/[sessionId]/lost-ticket/route.ts` | Permissioned exception boundary. |
| CREATE | `src/app/api/sessions/[sessionId]/cancel/route.ts` | Eligible cancellation boundary. |
| CREATE | `src/app/api/sessions/[sessionId]/correct/route.ts` | Allowlisted correction boundary. |
| CREATE | `tests/unit/payment-schema.test.ts`, `shift-schema.test.ts`, `exception-schema.test.ts` | Strict boundary tests. |
| CREATE | `tests/integration/payment-exit.test.ts`, `exception-workflows.test.ts` | API/RPC mapping and rollback. |
| CREATE | `tests/e2e/payment-exit.spec.ts`, `exception-workflows.spec.ts` | Happy/negative/interruption flows. |
| GENERATE | `src/lib/supabase/database.types.ts` | Never hand-edit. |
| FORBIDDEN | Provider SDKs/webhooks; space release outside exit/cancel RPC; mutable financial evidence | Stop on scope drift. |

## 8.3 TDD execution steps

### Step 8.0 — Fail-closed cash/exception approval

```powershell
$decisionPath = 'contexts/plans/evidence/phase-08.md'
if (-not (Test-Path -LiteralPath $decisionPath)) { throw 'Missing Phase 8 decision approval' }
$decision = Get-Content -LiteralPath $decisionPath -Raw
$patterns = @(
  '(?m)^- Decision status: APPROVED\s*$',
  '(?m)^- Approver name: \S.+$',
  '(?m)^- Approver role: \S.+$',
  '(?m)^- Approval date: \d{4}-\d{2}-\d{2}\s*$',
  '(?m)^- Scope: PHASE_08_CASH_EXCEPTIONS\s*$',
  '(?m)^- Fixture or vector version: \S.+$',
  '(?im)^- Decisions covered: .*shift.*cash.*lost ticket.*cancellation.*correction.*void.*manual review.*$',
  '(?m)^- Production approval implied: NO\s*$'
)
$missing = $patterns | Where-Object { $decision -notmatch $_ }
if ($missing -or $decision -match '(?im)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw 'Invalid or incomplete Phase 8 approval' }
$source = [regex]::Match($decision, '(?m)^- Source artifact: (?<value>\S.+)$').Groups['value'].Value.Trim()
if (-not $source -or (($source -notmatch '^https://') -and -not (Test-Path -LiteralPath $source))) { throw 'Missing Phase 8 rules source artifact' }
```

Expected: the command exits 0 only for the named, dated, versioned cash and
exception approval. Any failure keeps Phase 8 blocked.

### Step 8.1 — RED payment, exit, and exception database tests

Write all three pgTAP files first. Cover one open shift, device/location, current
quote/version, server-derived due, decimal-string/bigint tender, insufficient
cash, unique reference, exact replay, changed payload, simultaneous payment,
cancelled session, append-only receipt, quote expiry/top-up, payment without
release, exit without settlement, two-device exit, atomic completion/release,
rollback at every failure point, lost-ticket evidence/penalty, permission denial,
eligible cancellation, corrections, void reversal, manual review, and audit.

```powershell
npm run db:reset
npm run db:test
```

Expected RED: new RPCs are missing; prior suites pass.

### Step 8.2 — GREEN authoritative transactions

```powershell
npm run db:migrate -- phase8_payment_exit_exceptions
```

Implement §13 named RPCs with row/advisory locks, idempotency request hashes,
database time, bigint centavos, current settlement checks, stable errors, fixed
search paths, narrow grants, and atomic audit/evidence. Never trust actor,
location, due, official times, or state from the client.

```powershell
npm run db:reset
npm run db:test
npm run db:types
```

Expected: all database and concurrency suites pass.

### Step 8.3 — RED/GREEN server boundaries

Write unit/integration tests first. Reject unknown fields, unsafe/decimal tender,
client due/state/actor/location, stale fee version, invalid reason/evidence,
ordinary-staff override/void, oversized bodies, and database detail leakage.

```powershell
npx vitest run tests/unit/payment-schema.test.ts tests/unit/shift-schema.test.ts tests/unit/exception-schema.test.ts tests/integration/payment-exit.test.ts tests/integration/exception-workflows.test.ts
```

Expected: targeted tests pass after minimal services/actions/routes.

### Step 8.4 — Operational UI and interruption E2E

Implement numeric-keypad-friendly tender, read-only due, bigint change, shift
context, explicit confirmations, receipt print, separate exit warning, permissioned
exception dialogs, preserved safe form values, and same-key retry messaging.

```powershell
npm run test:e2e -- tests/e2e/payment-exit.spec.ts tests/e2e/exception-workflows.spec.ts
```

Test network loss before request, after commit/before response, and during retry.
Expected: no double payment, receipt, exit, release, or compensation.

## 8.4 Gate and handoff

```powershell
npm run db:reset
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/payment-exit.spec.ts tests/e2e/exception-workflows.spec.ts
git diff --check
```

Gate: all sequential/concurrent/interruption cases pass; payment never releases;
exit releases once; financial/audit evidence is append-only; role/location/reason
controls pass; coverage ≥80% all metrics; mobile/accessibility/print checks pass;
no critical/high finding.

Append the required attempt to `contexts/plans/evidence/phase-08.md`, link its
successful anchor from §0.2, set Phase 8 complete and Phase 9 active, update the
playbook, and stop.

> **END OF PHASE 8 — STOP.** Do not implement dashboards or reports.

<!-- ============================================================
PHASE 8 END — HARD STOP
============================================================ -->
