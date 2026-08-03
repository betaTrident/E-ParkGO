# Phase 7 — Ticket Validation, Fee, and Exit Preview

<!-- ============================================================
PHASE 7 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 7 and Phase 6 is COMPLETE.
============================================================ -->

## 7.0 Execution guard

- `STATUS: COMPLETE`; `IMPLEMENTATION_STATE: COMPLETE`.
- Load project `backend-patterns`, `supabase-postgres-best-practices`; plugins
  `plug-supabase-pg`, `sp-executing`; use `context7-mcp` for camera/Next APIs.
- Required human input before Step 7.1: an operator-approved development tariff
  rules/vector record exists in `contexts/plans/evidence/phase-07.md`. `PLAN.md
  §17` is provisional until that record names the approver/date and exact vector
  version. Production tariff is not implied.
- Exclude payment, confirmed exit, space release, public unauthenticated ticket
  verification, and offline validation.

## 7.1 Delivered features and exact state rule

Deliver authenticated `/verify#v1.<token>` fragment handling, scanner and manual
ticket lookup, throttled validation, safe ticket/session facts, `ACTIVE` to
`EXIT_PENDING` review transition, deterministic PostgreSQL fee calculation,
itemized quote persistence, quote expiry, and `/exit/[sessionId]` preview.

Resolved rule: a valid authenticated exit-review scan may atomically move
`ACTIVE` to `EXIT_PENDING`. It must never calculate or record payment, confirm
exit, complete the ticket, or release the space. Fee preview separately moves an
unpaid session to `PAYMENT_PENDING` or the audited zero-fee settlement path.

PostgreSQL bigint centavos and database time are authoritative. API wire
centavos are canonical decimal strings and become `bigint` after strict parsing;
the UI converts only for display. No floating-point money arithmetic.

Authoritative contracts: `TICKET-003`, `EXIT-001..002`, `PLAN.md §§9, 13, 15,
16, 17, 18, 21, 22, 23, 32`.

## 7.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `supabase/tests/00009_ticket_validation.sql` | Lifecycle/location/rate-limit/replay tests. |
| CREATE | `supabase/tests/00010_fee_engine.sql` | Every §17 vector and bigint breakdown. |
| CREATE | `supabase/tests/00011_exit_preview.sql` | State/quote/expiry/rollback tests. |
| CREATE | `supabase/migrations/<CLI-generated>_phase7_validation_fee_preview.sql` | Validation, fee, and preview RPCs/functions. |
| CREATE | `src/features/scanner/schemas.ts` | Token/ticket/manual request schemas. |
| CREATE | `src/features/scanner/service.ts` | Server validation adapter. |
| CREATE | `src/features/scanner/components/scanner-view.tsx` | Camera/manual accessible UX. |
| CREATE | `src/features/scanner/components/verify-fragment.tsx` | Extract, remove, and submit URL fragment. |
| CREATE | `src/lib/security/qr-parser.ts` | Exact version/base64url/32-byte parser. |
| CREATE | `src/lib/money/centavos.ts` | Branded decimal-string/bigint parse and display. |
| CREATE | `src/lib/time/business-time.ts` | UTC/Asia-Manila display helpers only. |
| CREATE | `src/features/exit/schemas.ts` | Validation/preview schemas. |
| CREATE | `src/features/exit/service.ts` | RPC adapter and error mapping. |
| CREATE | `src/features/exit/actions.ts` | Idempotent preview action. |
| CREATE | `src/features/exit/components/fee-breakdown.tsx` | Itemized bigint display and expiry. |
| CREATE | `src/app/(protected)/verify/page.tsx` | Authenticated fragment landing route. |
| CREATE | `src/app/(protected)/scanner/page.tsx` | Protected camera/manual page. |
| CREATE | `src/app/(protected)/exit/[sessionId]/page.tsx` | Server facts and preview UI. |
| CREATE | `src/app/api/tickets/validate/route.ts` | Strict non-payment validation boundary. |
| CREATE | `src/app/api/exit/preview/route.ts` | Strict preview boundary. |
| CREATE | `tests/unit/qr-parser.test.ts` | Malformed/version/length/history cases. |
| CREATE | `tests/unit/centavos.test.ts` | Precision/bounds/format tests. |
| CREATE | `tests/unit/fee-breakdown.test.tsx` | A11y/expiry/render tests. |
| CREATE | `tests/integration/validation-preview.test.ts` | API/RPC mapping. |
| CREATE | `tests/e2e/scanner-exit-preview.spec.ts` | Camera denied/manual/scan/preview flows. |
| GENERATE | `src/lib/supabase/database.types.ts` | Never hand-edit. |
| FORBIDDEN | Payment/exit-confirm RPCs, space release, raw token logs/cache | Phase 8 only. |

## 7.3 TDD execution steps

### Step 7.0 — Fail-closed fee/vector approval

```powershell
$decisionPath = 'contexts/plans/evidence/phase-07.md'
if (-not (Test-Path -LiteralPath $decisionPath)) { throw 'Missing Phase 7 decision approval' }
$decision = Get-Content -LiteralPath $decisionPath -Raw
$patterns = @(
  '(?m)^- Decision status: APPROVED\s*$',
  '(?m)^- Approver name: \S.+$',
  '(?m)^- Approver role: \S.+$',
  '(?m)^- Approval date: \d{4}-\d{2}-\d{2}\s*$',
  '(?m)^- Scope: PHASE_07_FEE_VECTORS\s*$',
  '(?m)^- Fixture or vector version: \S.+$',
  '(?im)^- Decisions covered: .*grace.*interval.*cap.*overnight.*discount.*penalty.*complimentary.*quote expiry.*$',
  '(?m)^- Production approval implied: NO\s*$'
)
$missing = $patterns | Where-Object { $decision -notmatch $_ }
if ($missing -or $decision -match '(?im)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw 'Invalid or incomplete Phase 7 approval' }
$source = [regex]::Match($decision, '(?m)^- Source artifact: (?<value>\S.+)$').Groups['value'].Value.Trim()
if (-not $source -or (($source -notmatch '^https://') -and -not (Test-Path -LiteralPath $source))) { throw 'Missing Phase 7 vector source artifact' }
```

Expected: the command exits 0 only when a named approver/date and immutable
vector version cover every required fee decision. Any failure blocks RED/GREEN.

### Step 7.1 — RED database validation and fee corpus

Write all three pgTAP files first. Cover token/ticket exclusive input, malformed
token before hash, invalid/revoked/completed/wrong-location tickets, bounded scan
evidence, rate buckets, concurrent scan, legal/illegal state transitions, every
§17 vector, seconds/minute/hour/day boundaries, UTC/local overnight, immutable
snapshot, discount/penalty/complimentary/adjustment ordering, quote expiry, exact
breakdown, and rollback.

```powershell
npm run db:reset
npm run db:test
```

Expected RED: only Phase 7 functions are missing.

### Step 7.2 — GREEN authoritative functions

```powershell
npm run db:migrate -- phase7_validation_fee_preview
```

Record path. Implement pure versioned fee function plus transactional validation
and preview RPCs. Use integer arithmetic, database time, immutable snapshots,
locks/version checks, stable errors, safe idempotency, fixed search paths, narrow
grants, and audit without token/hash.

```powershell
npm run db:reset
npm run db:test
npm run db:types
```

Expected: all database vectors and earlier suites pass.

### Step 7.3 — RED/GREEN parsing and web contracts

Write unit/integration tests before modules. The fragment is read locally,
removed immediately using history replacement, and submitted in a body. Reject
unknown/client-authoritative fields, decimal or unsafe money, oversized requests,
and SQL details.

```powershell
npx vitest run tests/unit/qr-parser.test.ts tests/unit/centavos.test.ts tests/integration/validation-preview.test.ts
```

Expected: targeted tests pass after minimal implementation.

### Step 7.4 — Scanner, fallback, and preview UI

Request the rear camera only after a user gesture; stop tracks on route change,
logout, error, or successful scan. Provide selector/torch when supported and a
manual ticket fallback for denial/unsupported/low light. Announce invalid,
expired, stale, and rate-limited states without exposing existence details.

```powershell
npx vitest run tests/unit/fee-breakdown.test.tsx
npm run test:e2e -- tests/e2e/scanner-exit-preview.spec.ts
```

Expected: camera-denied and manual flows pass on configured desktop/mobile
projects; scan never pays/exits/releases.

## 7.4 Gate and handoff

```powershell
npm run db:reset
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/scanner-exit-preview.spec.ts
git diff --check
```

Gate: every fee/state/token case passes; global coverage ≥80% on all metrics;
manual/camera/browser/accessibility cases pass; token is absent from URL after
load, logs, traces, storage, and cache; no payment/exit/release side effect; no
critical/high finding.

Append the required attempt to `contexts/plans/evidence/phase-07.md`, link its
successful anchor from §0.2, set Phase 7 complete and Phase 8 active, update the
playbook, and stop.

> **END OF PHASE 7 — STOP.** Do not implement payment or release here.

<!-- ============================================================
PHASE 7 END — HARD STOP
============================================================ -->
