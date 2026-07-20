# Phase 10 — Transactions, Reports, Shifts, and Audit

<!-- ============================================================
PHASE 10 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 10 and Phase 9 is COMPLETE.
============================================================ -->

## 10.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: NOT_STARTED`.
- Load project `backend-patterns`, `frontend-patterns`; plugins
  `v-react-best-practices`, `c-canvas`; load `context7-mcp` for uncertain APIs.
- Dependencies: immutable Phase 8 financial/exception evidence and Phase 9 gate.
- MVP decision: implement bounded synchronous CSV through a Route Handler. The
  optional `export-report` Edge Function remains out of scope unless measured
  platform limits and explicit approval reopen it.

## 10.1 Delivered features

Deliver cursor-paginated transaction history, daily revenue/movement/occupancy/
shift reconciliation, own/admin shift history, immutable audit search and detail,
bounded `Asia/Manila` business-date filters, permissioned CSV export, CSV formula
injection protection, redaction, and export audit evidence.

Totals reconcile to append-only collections/top-ups/reversals and immutable rate
snapshots; mutable UI quotes are never a report source.

Authoritative contracts: `AUDIT-001`, `REPORT-001`, `SHIFT-001`, `PLAN.md §§8,
10, 12, 15, 18, 22, 23, 27, 32`.

## 10.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `supabase/tests/00016_reports_audit.sql` | Reconciliation/scope/timezone/pagination/export tests. |
| CREATE | `supabase/migrations/<CLI-generated>_phase10_reports_audit.sql` | Read RPCs/security-invoker projections/export audit RPC. |
| CREATE | `src/features/reports/schemas.ts` | Bounded filter/export schemas. |
| CREATE | `src/features/reports/service.ts` | Report/transaction/audit server adapters. |
| CREATE | `src/features/reports/queries.ts` | Cursor query contracts. |
| CREATE | `src/lib/security/csv.ts` | Streaming-safe encoding and formula neutralization. |
| CREATE | `src/components/reports/report-summary.tsx` | Reconciled metric presentation. |
| CREATE | `src/components/reports/report-table.tsx` | Accessible responsive pagination. |
| CREATE | `src/components/reports/audit-event-detail.tsx` | Redacted read-only evidence disclosure. |
| CREATE | `src/app/(protected)/transactions/page.tsx` | Transaction search. |
| CREATE | `src/app/(protected)/reports/page.tsx` | Report preview/export. |
| CREATE | `src/app/(protected)/admin/audit/page.tsx` | Admin audit viewer. |
| MODIFY | `src/app/(protected)/shifts/page.tsx` | Add authorized history/reconciliation. |
| CREATE | `src/app/api/transactions/route.ts` | Bounded GET with cursor. |
| CREATE | `src/app/api/reports/preview/route.ts` | Scoped report preview. |
| CREATE | `src/app/api/reports/export/route.ts` | Permissioned synchronous CSV and audit. |
| CREATE | `tests/unit/report-schemas.test.ts`, `csv.test.ts` | Filter/bounds/injection/redaction tests. |
| CREATE | `tests/integration/reports.test.ts` | Reconciliation/pagination/API mapping. |
| CREATE | `tests/e2e/reports-audit.spec.ts` | Responsive/report/export/denial flows. |
| GENERATE | `src/lib/supabase/database.types.ts` | Never hand-edit. |
| FORBIDDEN | Unbounded selects/subscriptions; raw QR/hash/auth data; unaudited export | Stop on scope drift. |

## 10.3 TDD execution steps

### Step 10.1 — RED report truth and access tests

Cover collection/top-up/reversal net totals, zero-fee settlements, snapshot
history, business-day boundaries, DST-independent UTC facts, cursor stability,
default/max page/range, same-location staff/admin, cross-location denial, audit
immutability/redaction, export permission, and export audit.

```powershell
npm run db:reset
npm run db:test
```

Expected RED: only Phase 10 read/export objects are missing.

### Step 10.2 — GREEN bounded database contracts

```powershell
npm run db:migrate -- phase10_reports_audit
npm run db:reset
npm run db:test
npm run db:types
```

Expected: all report/audit and previous tests pass; explain/index-check hot queries.

### Step 10.3 — RED/GREEN boundary and CSV safety

Write tests before modules. Reject unknown filters, invalid cursor/type/date, more
than 100 rows/page, more than 366 days for admin, unauthorized exports, and cells
starting with formula control characters. Stream bounded data; log row count and
safe dimensions, not full result content.

```powershell
npx vitest run tests/unit/report-schemas.test.ts tests/unit/csv.test.ts tests/integration/reports.test.ts
```

Expected: targeted tests pass after implementation.

### Step 10.4 — Responsive presentation and E2E

Implement mobile cards/desktop tables, semantic chart summaries, keyboard cursor
pagination, no-data/large-range/export-processing/error states, redacted JSON
disclosure, and download filename/content checks.

```powershell
npm run test:e2e -- tests/e2e/reports-audit.spec.ts
```

Expected: authorized flows and ordinary-staff/cross-location denials pass in all
configured browsers without leaking sensitive evidence.

## 10.4 Gate and handoff

```powershell
npm run db:reset
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/reports-audit.spec.ts
git diff --check
```

Require exact reconciliation, pagination/timezone/location/export-audit tests,
CSV injection/redaction pass, ≥80% all coverage metrics, accessibility/mobile
pass, bounded query evidence, and no critical/high finding.

Append the required attempt to `contexts/plans/evidence/phase-10.md`, link its
successful anchor from §0.2, set Phase 10 complete and Phase 11 active, update the
playbook, and stop.

> **END OF PHASE 10 — STOP.** Do not add PWA caching here.

<!-- ============================================================
PHASE 10 END — HARD STOP
============================================================ -->
