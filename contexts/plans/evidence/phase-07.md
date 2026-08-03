# Phase 7 Gate Evidence

## Product decision approval (Step 7.0)

- Decision status: APPROVED
- Approver name: Dennis (project operator)
- Approver role: Product owner / development lead
- Approval date: 2026-07-21
- Scope: PHASE_07_FEE_VECTORS
- Fixture or vector version: plan-section-17-tiered-fixture-v1
- Decisions covered: grace period, tiered interval blocks, daily cap, overnight boundary, percentage discount, lost-ticket penalty, complimentary waiver, signed adjustment ordering, and quote expiry window
- Production approval implied: NO
- Source artifact: PLAN.md

### Approved development fee vectors (§17 provisional fixture)

| Parameter | Value |
| --- | --- |
| Grace | 15 minutes |
| Initial block | 3 hours @ ₱50.00 (5000 centavos) |
| Succeeding interval | 1 hour @ ₱20.00 (2000 centavos) |
| Rolling 24h base cap | ₱300.00 (30000 centavos) |
| Overnight boundary | ₱50.00 (5000 centavos) per local midnight crossed |
| Lost-ticket penalty | ₱200.00 (20000 centavos) |
| Quote expiry | 15 minutes from calculation |

| Vector case | Expected subtotal (centavos) |
| --- | ---: |
| 0, 15, 16 minutes | 0, 0, 5000 |
| 180, 181, 240, 241 minutes | 5000, 7000, 7000, 9000 |
| 10:00 PM–2:00 AM (4h) + 1 overnight | 12000 total before discount |
| 26 hours cross-day | 40000 total before discount |
| 5h + lost ticket + 10% discount | 28100 total |

---

## Attempt 2026-07-21T22:15:00+08:00 (superseded)

- Phase: 07 — Validation, Fee, Exit Preview
- Result: **PARTIAL** — implementation landed; full gate blocked on Docker Desktop unavailable
- Migration: `supabase/migrations/20260721100600_phase7_validation_fee_preview.sql`
- pgTAP suites added: `00009_ticket_validation.sql`, `00010_fee_engine.sql`, `00011_exit_preview.sql`
- Web surface: `/verify`, `/scanner`, `/exit/[sessionId]`, `/api/tickets/validate`, `/api/exit/preview`
- Commands completed:
  - Step 7.0 approval guard — PASS
  - `npm run typecheck && npm run lint && npm test && npm run test:coverage && npm run build` — PASS (coverage branches **81.48%**)
- Commands pending Docker:
  - `npm run db:reset && npm run db:test && npm run db:types`
  - `npm run test:e2e -- tests/e2e/scanner-exit-preview.spec.ts`
- Next action: start Docker Desktop, rerun pending commands, append PASS anchor, set Phase 7 COMPLETE

---

## Attempt 2026-07-21T23:05:00+08:00

- Phase: 07 — Validation, Fee, Exit Preview
- Result: **PASS**
- Environment: local Windows, Docker Desktop, Supabase `http://127.0.0.1:55321`, E2E app `http://localhost:3001` via `scripts/dev-e2e.mjs`
- Migration: `supabase/migrations/20260721100600_phase7_validation_fee_preview.sql` (`validate_parking_ticket`, `calculate_parking_exit`, tiered fee engine, rate limits, quote expiry)
- pgTAP suites: `00009_ticket_validation.sql`, `00010_fee_engine.sql`, `00011_exit_preview.sql`
- Web surface: `/verify`, `/scanner`, `/exit/[sessionId]`, `/api/tickets/validate`, `/api/exit/preview`
- Commands:
  - Step 7.0 approval guard — PASS
  - `npm run db:reset && npm run db:test && npm run db:types` — exit 0 (**383** pgTAP incl. 19 validation + 18 fee + 16 exit preview tests)
  - `npm run typecheck && npm run lint && npm test && npm run test:coverage && npm run build` — exit 0
  - `npx playwright test tests/e2e/scanner-exit-preview.spec.ts --workers=1` — exit 0; **10 passed** (chromium, firefox, webkit, mobile-chrome, mobile-safari)
  - `git diff --check` — exit 0
- Coverage: statements `93.61%`; branches `81.48%`; functions `95.45%`; lines `93.47%`
- Security checks: QR fragment stripped via `history.replaceState`; validation idempotency stores no token material; exit preview never records payment or releases spaces; E2E asserts no token keys in `localStorage`
- Fee vectors: all approved §17 provisional fixture vectors pass in `00010_fee_engine.sql`, including overnight-outside-cap rule
- Next action: begin Phase 8 — Cash Payment & Confirmed Exit

