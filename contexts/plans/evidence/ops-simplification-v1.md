# Ops Simplification v1 — Gate Evidence

> Playbook: `contexts/plans/ops-simplification-v1.md`  
> ADR: [0003 — Ops Simplification: Capacity Pools and Cash Attribution](../../docs/adr/0003-ops-simplification-capacity-and-cash-attribution.md)

## Phase status

| Phase | Name | Status | Date | Notes |
| --- | --- | --- | --- | --- |
| S0 | Decision lock & execution control | **PASS** | 2026-08-02 | ADR accepted; `PLAN.md §0.2` updated; evidence skeleton created |
| S1 | Capacity pools + trimmed entry | **PASS** | 2026-08-02 | App/tests green; pgTAP pre-verified |
| S2 | Remove shift gate; staff-attributed cash | **PASS** | 2026-08-02 | pgTAP suite green; shift gate removed; E2E chromium pass |
| S3 | Unified exit happy path + cash only | **PASS** | 2026-08-02 | pgTAP **522**; settle_cash_and_exit; E2E chromium pass |
| S4 | Sessions UX: exceptions under More actions | PENDING | — | — |
| S5 | Nav cleanup, spaces retirement, copy pass | PENDING | — | — |
| S6 | Hardening, regression, security review | PENDING | — | Resume Phase 10 on PASS |

---

<a id="ops-s0-attempt-2026-08-02"></a>
## Attempt 2026-08-02 — Phase S0

- Phase: S0 — Decision lock & execution control
- Result: **PASS**
- Environment: local documentation only (no application/SQL changes)
- Artifacts:
  - `docs/adr/0003-ops-simplification-capacity-and-cash-attribution.md` — D1–D7 locked; S1 schema approach documented
  - `PLAN.md §0.2` — `CURRENT_PHASE: OPS-S1`; Phase 10 paused
  - `contexts/plans/evidence/ops-simplification-v1.md` — this file
- Gate checklist:
  - [x] ADR captures D1–D7 and rejected alternatives
  - [x] `PLAN.md §0.2` playbook path = `contexts/plans/ops-simplification-v1.md`
  - [x] Evidence skeleton exists with S0 PASS
- Next action: Begin Phase S1 — capacity pools + trimmed entry (per playbook manifest)

---

<a id="ops-s1-attempt-2026-08-02"></a>
## Attempt 2026-08-02 — Phase S1 (app/tests)

- Phase: S1 — Capacity pools + trimmed entry (TypeScript/app/tests slice)
- Result: **PASS**
- Environment: local Supabase + Next.js dev (E2E webServer)
- App changes:
  - Entry: plate + vehicle type only; RPC without `p_space_id`; `CAPACITY_FULL` mapped
  - Facility admin: car/motorcycle capacity fields via `admin_update_location_capacities`
  - Dashboard/entry KPIs: real pool metrics (`car_*`, `motorcycle_*`); space map hidden
  - Shell: Parking Spaces nav `available: false`
  - Ticket print: nullable `parking_space_id` (pool entries no longer 404)
- Verification:
  - `npx tsc --noEmit` — pass
  - `npm run test -- tests/unit/entry-schema.test.ts` — 6 passed
  - `npm run test -- tests/integration/entry.test.ts` — 1 passed
  - `npx playwright test tests/e2e/entry-ticket.spec.ts --workers=1` — 10 passed
- Gate checklist:
  - [x] Entry has no color field, no space select
  - [x] Full pool rejects entry with stable error code (pgTAP + service mapping)
  - [x] Evidence section S1 marked PASS
- Next action: Begin Phase S2 — remove shift gate; staff-attributed cash

---

<a id="ops-s2-attempt-2026-08-02"></a>
## Attempt 2026-08-02 — Phase S2

- Phase: S2 — Remove shift gate; staff-attributed cash
- Result: **PASS**
- Environment: local Supabase (ports 553xx) + Next.js dev (E2E webServer)
- DB changes:
  - `supabase/migrations/20260802020000_ops_s2_drop_shift_gate.sql` — `record_parking_payment` without `require_open_staff_shift`; `staff_shift_id` NULL; `list_staff_cash_totals`
  - `supabase/tests/00021_ops_s2_payment_without_shift.sql` — 11 assertions
- App changes:
  - Payments page: removed shift blocker alert
  - Payment form: cash-only copy; staff attribution note
  - Shifts page: redirect to `/dashboard`; shift modules deprecated
  - `staff-cash-summary.ts` helper for new RPC
  - `exit/service.ts`: nullable space for pool entries (E2E unblock, S1 carryover)
- Verification:
  - `npx supabase db reset` — migrations applied including S2
  - `npx supabase test db` — **506** tests, PASS (18 files)
  - `npx playwright test tests/e2e/payment-exit.spec.ts --workers=1 --project=chromium` — 1 passed
- Gate checklist:
  - [x] No UI path requires “Start shift” before cash
  - [x] Payment audit rows still include actor (`PAYMENT_RECORDED` + `actor_id`)
  - [x] Evidence S2 PASS
- Next action: Begin Phase S3 — unified exit happy path + cash-only

---

<a id="ops-s3-attempt-2026-08-02"></a>
## Attempt 2026-08-02 — Phase S3

- Phase: S3 — Unified exit happy path + cash-only
- Result: **PASS**
- Environment: local Supabase (ports 553xx) + Next.js dev (E2E webServer)
- DB changes:
  - `supabase/migrations/20260802030000_ops_s3_settle_and_exit.sql` — atomic `settle_cash_and_exit` RPC
  - `supabase/tests/00022_ops_s3_settle_and_exit.sql` — 14 assertions
- App changes:
  - `ExitCheckout` single-screen cash + exit on `/exit/[sessionId]`
  - `/api/exit/settle` route; payments page redirects to exit checkout
  - Rates UI: lost ticket penalty help text and list summary
  - Shell: Payments nav hidden
- Verification:
  - `npx supabase test db` — **522** tests, PASS (19 files)
  - `npx playwright test tests/e2e/exit-checkout.spec.ts tests/e2e/payment-exit.spec.ts tests/e2e/scanner-exit-preview.spec.ts --workers=1 --project=chromium` — 4 passed
- Gate checklist:
  - [x] Staff can finish a normal exit on one primary screen
  - [x] No non-cash tender controls
  - [x] Evidence S3 PASS
- Next action: Begin Phase S4 — sessions UX exceptions under More actions
