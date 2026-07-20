# Phase 5 Gate Evidence

## Product decision approval (Step 5.0)

- Decision status: APPROVED
- Approver name: Dennis (project operator)
- Approver role: Product owner / development lead
- Approval date: 2026-07-21
- Scope: PHASE_05_CONFIGURATION
- Fixture or vector version: seed-v1 + PLAN.md §17 provisional tiered fixture
- Decisions covered: development location (MAIN / E-ParkGO Pilot Facility), zones A/B, spaces A-01/A-02/B-01, vehicle types CAR/MOTO, and provisional tariff fixtures for configuration tests (seed FLAT CAR rate; PLAN §17 tiered example for draft/publish tests)
- Production approval implied: NO
- Source artifact: supabase/seed.sql

### Approved development fixtures

| Entity | Code / ID | Notes |
| --- | --- | --- |
| Location | MAIN (`11111111-1111-4111-8111-111111111111`) | Asia/Manila, PHP, receipt prefix EPG |
| Zone A | A | Sort order 1 |
| Zone B | B | Sort order 2 |
| Vehicle CAR | CAR | Flat seed rate ₱50.00 effective 2026-01-01 |
| Vehicle MOTO | MOTO | No published rate in seed |
| Spaces | A-01, A-02, B-01 | Uniquely coded per location |
| Tiered test vector | PLAN §17 | Grace 15m; initial 3h ₱50; succeeding ₱20/h; daily max ₱300; overnight ₱50; lost ticket ₱200 |

---

<a id="phase-05-attempt-2026-07-21t0309000800"></a>
## Attempt 2026-07-21T03:09:00+08:00

- Phase: 05 — Facility, Spaces, and Rates
- Result: PASS
- Environment: local Windows, Docker Desktop, Supabase `http://127.0.0.1:55321`, E2E app `http://localhost:3001` via `scripts/dev-e2e.mjs`
- Migration: `supabase/migrations/20260720185524_phase5_configuration_rpcs.sql` (16 admin configuration RPCs, published-rate immutability trigger, audit helper)
- API surface decision: Server Actions only for configuration mutations; duplicate Route Handlers were not created (`GET /api/spaces`, `GET /api/rates`, publish route deferred to Server Actions boundary).
- Commands:
  - `npm run db:reset && npm run db:test && npm run db:types` — exit 0 (290 pgTAP incl. 33 configuration RPC tests)
  - `npm run typecheck && npm run lint && npm test && npm run test:coverage && npm run build` — exit 0
  - `npm run test:e2e -- tests/e2e/configuration.spec.ts` — exit 0; **15 passed** (chromium, firefox, webkit, mobile-chrome, mobile-safari)
  - `git diff --check` — exit 0
- Coverage: statements `95.75%`; branches `84.61%`; functions `96.29%`; lines `95.69%`
- Fixture decisions: seed-v1 MAIN facility with zones A/B, spaces A-01/A-02/B-01, vehicle types CAR/MOTO, seed FLAT CAR rate; PLAN §17 tiered vector used for draft/publish overlap tests
- Next action: begin Phase 6 — Entry & QR Ticket

