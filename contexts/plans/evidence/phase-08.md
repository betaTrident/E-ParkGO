# Phase 8 Gate Evidence

## Product decision approval (Step 8.0)

- Decision status: APPROVED
- Approver name: Dennis (project operator)
- Approver role: Product owner / development lead
- Approval date: 2026-07-21
- Scope: PHASE_08_CASH_EXCEPTIONS
- Fixture or vector version: plan-section-17-tiered-fixture-v1
- Decisions covered: shift open/close cash reconciliation, exact-once server-derived cash payment, 15-minute paid-exit window with top-up, lost ticket evidence and penalty, eligible cancellation, permissioned correction/discount/complimentary/adjustment, append-only payment void/reversal, and manual review routing
- Production approval implied: NO
- Source artifact: PLAN.md

### Approved development rules (Phase 8 provisional fixture)

| Parameter | Value |
| --- | --- |
| Shift | One open shift per staff per location; nonnegative opening float; close records declared cash and variance |
| Cash payment | Server derives amount due; bigint centavos tender; requires open same-location shift; unique external reference |
| Paid-exit window | 15 minutes after payment; expired window recalculates fee and may require TOP_UP before release |
| Lost-ticket penalty | ₱200.00 (20000 centavos) per §17 fixture |
| Cancellation | Unpaid sessions only (`ACTIVE`, `EXIT_PENDING`); `can_cancel_sessions`; releases space |
| Void | Append-only `REVERSAL`; original payment immutable; session → `MANUAL_REVIEW` |
| Corrections | `DISCOUNT_PERCENT`, `COMPLIMENTARY`, `ADJUSTMENT_CENTAVOS`, `ENTRY_TIME` with matching permissions |

---

## Attempt 2026-07-22T00:45:00+08:00

- Phase: 08 — Cash Payment, Exceptions, and Confirmed Exit
- Result: **PASS**
- Environment: local Windows, Supabase `http://127.0.0.1:55321`, E2E app `http://localhost:3001` via `scripts/dev-e2e.mjs`
- Migration: `supabase/migrations/20260721155900_phase8_payment_exit_exceptions.sql` (`start_staff_shift`, `close_staff_shift`, `record_parking_payment`, `confirm_vehicle_exit`, `cancel_parking_session`, `process_lost_ticket`, `void_parking_payment`, `correct_parking_session`)
- pgTAP suites: `00012_shift_payment_exit.sql`, `00013_payment_exit_concurrency.sql`, `00014_exception_workflows.sql`
- Web surface: `/shifts`, `/payments/[sessionId]`, `/exit/[sessionId]/confirm`, `/sessions`, `/api/payments`, `/api/exit/confirm`, `/api/shifts/*`, `/api/sessions/[sessionId]/*`
- Commands:
  - Step 8.0 approval guard — PASS
  - `npm run db:reset && npm run db:test && npm run db:types` — exit 0 (**449** pgTAP across 15 files)
  - `npm run typecheck && npm run lint && npm test && npm run test:coverage && npm run build` — exit 0
  - `npx playwright test tests/e2e/payment-exit.spec.ts tests/e2e/exception-workflows.spec.ts --workers=1` — exit 0; **10 passed** (chromium, firefox, webkit, mobile-chrome, mobile-safari)
  - `git diff --check` — exit 0
- Coverage: statements `95.97%`; branches `83.53%`; functions `94.16%`; lines `96.09%`
- Business rules verified: payment does not release spaces; confirmed exit releases once; append-only payments/receipts; shift required for cash; exception permissions enforced in pgTAP
- Next action: begin Phase 9 — Dashboard & Realtime (playbook gate; Phase 8 hard stop observed)

---

## Attempt (pending — superseded)

- Phase: 08 — Cash Payment, Exceptions, and Confirmed Exit
- Result: **SUPERSEDED** by attempt 2026-07-22T00:45:00+08:00
- Next action: none
