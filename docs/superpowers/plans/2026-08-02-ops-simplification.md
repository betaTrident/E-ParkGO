# E-ParkGO Ops Simplification v1 — Strategic Implementation Plans

> **For agentic workers:** REQUIRED SUB-SKILL: `sp-executing` (`executing-plans`) or `sp-subagent-driven` (`subagent-driven-development`). Execute **one phase at a time**. Use checkbox tracking. **Do not scan the full codebase** — trust this plan’s file manifests and only open listed paths (plus Context7 when an API signature is uncertain).

**Goal:** Simplify day-to-day parking ops to capacity-by-vehicle-type entry, cash-only exit settlement (pay + release in one happy path), staff-attributed cash (no shift gate), and cleaner exception UX — without weakening QR hash storage, server-side fees, idempotency, or audit.

**Architecture:** PostgreSQL RPCs remain authoritative for session lifecycle, fees (integer centavos), timestamps (`clock_timestamp()`), and audits. Occupancy becomes **capacity pools** (cars / motorcycles) counted from active sessions vs admin-configured limits — not per-bay assignment. Payments attribute to the authenticated `actor_id` (staff login). Exit happy path is a single operator surface: identify ticket → fee → cash → release.

**Tech Stack:** Next.js App Router, Supabase Postgres + RLS + SECURITY DEFINER RPCs, Zod at Route Handler / Server Action boundaries, Vitest + Playwright + pgTAP, shadcn/ui.

**Product decisions locked (2026-08-02):**

| # | Decision |
|---|----------|
| D1 | **No payment at entry.** All cash collection happens at exit. |
| D2 | **Remove shift gate.** Cash tracked by logged-in staff (`actor_id`). Admin creates N staff accounts. |
| D3 | **Single exit happy path** (scan/type → fee → pay & exit). **Cash only.** Lost-ticket penalty remains **admin-configurable** (rate version field; surface clearly in Rates UI). |
| D4 | **Entry fields:** plate + vehicle type only (drop color; drop space picker). |
| D5 | **Exceptions** (lost / cancel / correct) behind **More actions**, not the primary sessions list. |
| D6 | **Keep:** QR + hash-only credential, server fee engine, idempotent payment/exit, append-only audit. |
| D7 | **Capacity model:** track free slots by vehicle type pools (cars / motorcycles), not individual bay codes. |

**Relationship to `PLAN.md`:** This plan is a **product pivot** layered on Phases 3–9 (already gated complete). It does **not** authorize Phase 10A+ work. Before coding Phase S1, update `PLAN.md §0.2` so `CURRENT_PHASE` points at this playbook (or an ADR that freezes Phase 10 while this runs). Record an ADR under `docs/adr/`.

---

## Global constraints (every phase)

1. **Money:** `bigint` centavos only — never float.
2. **Time:** UTC `timestamptz`; official times from Postgres `clock_timestamp()`.
3. **QR:** raw token shown once; persist SHA-256 hash only; never log raw tokens.
4. **Immutability:** no in-place mutation of payment/receipt/audit rows; return new objects in TS.
5. **Validation:** Zod at action/route boundary; never trust client `actor_id`, amounts, or timestamps.
6. **RPC ownership:** fee, payment, exit, entry, lost-ticket — call Postgres RPCs; do not reimplement in TypeScript.
7. **SECURITY DEFINER:** fixed empty `search_path`; follow `supabase-postgres-best-practices`.
8. **File size:** target 200–400 lines; hard cap 800.
9. **TDD:** failing test first for each RPC/UI contract change; ≥80% on touched units where measurable.
10. **Cash only:** no card/e-wallet UI or schemas in this plan.
11. **Token discipline:** open **only** files listed in the active phase manifest (+ new migration/test paths created by that phase). If a dependency is missing from the list, **add it to the phase manifest in a plan amend commit** before scanning elsewhere.

---

## Recommended approach for D2 (staff cash attribution)

**Chosen model: Actor-attributed daily cash (no shift gate)**

- Every payment already stores the acting staff (`actor_id`) and location.
- Remove `private.require_open_staff_shift(...)` from `record_parking_payment` (and any UI that blocks payment without a shift).
- Admin creates as many STAFF/ADMIN accounts as needed (`/admin/staff`).
- Reconciliation = sum of non-voided payments **by `actor_id` + business date** (Asia/Manila) — Phase S2 adds/extends a thin query; full report polish can wait for Phase 10 reports gate.
- **Do not delete** `staff_shifts` tables in v1 (avoid destructive history loss). Mark shift UI routes as retired/hidden; leave table for future optional “end-of-day count” if desired later.

**Rejected alternatives**

| Alternative | Why rejected for v1 |
|-------------|---------------------|
| Keep shifts but auto-open on first payment | Still teaches a shift concept operators asked to remove |
| Shared anonymous drawer | Loses accountability; conflicts with audit goals (D6) |
| Hard-delete shift schema now | Unnecessary risk; migrations/tests still reference it |

---

## Target operator journey (after all phases)

```text
Admin: set Car capacity + Motorcycle capacity + rates (incl. lost-ticket penalty) + staff accounts
Staff: log in (identity = cash attribution)

ENTRY
  plate + vehicle type
  → if pool has free capacity → ticket + QR print
  → else block with clear “lot full for this type”

DURING PARK
  Dashboard / Entry KPIs: Cars free/total · Motorcycles free/total · active sessions

EXIT (happy path — one flow)
  scan QR or type ticket number
  → server fee quote (cash only)
  → tender cash → record payment + confirm exit (atomic or sequential RPC pair in one action)
  → space/capacity freed; receipt print

EXCEPTIONS (More actions / permissioned)
  lost ticket (applies configured penalty) · cancel · correct
```

**Session happy path (logical):**

```text
ACTIVE → (validate) EXIT_PENDING → (quote) PAYMENT_PENDING
  → (cash + release action) COMPLETED
```

Zero-fee quotes may skip tender UI but still complete exit under the same action.

---

## Agent boot checklist (every phase)

1. Read `AGENTS.md` (workspace rules may already inject it).
2. Read **this file** — active phase section only.
3. `Read` every skill path listed for that phase (absolute paths below).
4. Open **only** the phase file manifest.
5. Run the phase verification commands; do not start the next phase until gates pass.
6. Record evidence briefly in `contexts/plans/evidence/ops-simplification-v1.md` (create if missing).

### Skill absolute paths (copy into each phase)

| Alias | Absolute path |
|-------|---------------|
| `supabase` | `k:\E-ParkGO\.agents\skills\supabase\SKILL.md` |
| `supabase-postgres-best-practices` | `k:\E-ParkGO\.agents\skills\supabase-postgres-best-practices\SKILL.md` |
| `backend-patterns` | `k:\E-ParkGO\.agents\skills\backend-patterns\SKILL.md` |
| `api-design` | `k:\E-ParkGO\.agents\skills\api-design\SKILL.md` |
| `security-review` | `k:\E-ParkGO\.agents\skills\security-review\SKILL.md` |
| `tdd-workflow` | `k:\E-ParkGO\.agents\skills\tdd-workflow\SKILL.md` |
| `coding-standards` | `k:\E-ParkGO\.agents\skills\coding-standards\SKILL.md` |
| `frontend-patterns` | `k:\E-ParkGO\.agents\skills\frontend-patterns\SKILL.md` |
| `design-system` | `k:\E-ParkGO\.agents\skills\design-system\SKILL.md` |
| `accessibility` | `k:\E-ParkGO\.agents\skills\accessibility\SKILL.md` |
| `verification-loop` | `k:\E-ParkGO\.agents\skills\verification-loop\SKILL.md` |
| `git-workflow` | `k:\E-ParkGO\.agents\skills\git-workflow\SKILL.md` |
| `repository-conventions` | `k:\E-ParkGO\.claude\skills\repository-conventions\SKILL.md` |
| `sp-executing` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\d884ae04edebef577e82ff7c4e143debd0bbec99\skills\executing-plans\SKILL.md` |
| `sp-subagent-driven` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\superpowers\d884ae04edebef577e82ff7c4e143debd0bbec99\skills\subagent-driven-development\SKILL.md` |
| `plug-supabase` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\supabase\release_v0.1.4\skills\supabase\SKILL.md` |
| `plug-supabase-pg` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\supabase\release_v0.1.4\skills\supabase-postgres-best-practices\SKILL.md` |
| `context7-mcp` | `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\context7-plugin\58a36cea87ea887e7bb4850409f1f9ea58dae5e5\skills\context7-mcp\SKILL.md` |
| `c-security-review` | `C:\Users\Dennis\.cursor\skills-cursor\review-security\SKILL.md` |
| `c-review-bugbot` | `C:\Users\Dennis\.cursor\skills-cursor\review-bugbot\SKILL.md` |

---

# Phase S0 — Decision lock & execution controls

**Objective:** Freeze product contract; point execution control at this playbook; write ADR.

### Skills (load before any write)

- `sp-executing`
- `git-workflow`
- `repository-conventions`
- `coding-standards`

### File manifest

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `docs/adr/0001-ops-simplification-capacity-and-cash-attribution.md` | ADR: capacity pools, no-shift cash, pay-at-exit-only, combined exit action |
| MODIFY | `PLAN.md` (§0.2 only) | Set `CURRENT_PHASE` / `ACTIVE_PLAYBOOK` to this file; note Phase 10 paused or sequenced after |
| CREATE | `contexts/plans/evidence/ops-simplification-v1.md` | Evidence log skeleton |
| READ-ONLY | `contexts/plans/ops-simplification-v1.md` | This plan |

### Steps

- [ ] Draft ADR capturing D1–D7 and rejected alternatives.
- [ ] Update `PLAN.md §0.2` to authorize Phase S0→S1 (do not start S1 until §0.2 points here).
- [ ] Create evidence file with status table (S0…S6 = PENDING).

### Gate

- [ ] ADR merged/committed; §0.2 playbook path equals this file; evidence skeleton exists.

---

# Phase S1 — Capacity pools + trimmed entry (D4 + D7)

**Objective:** Replace per-bay assignment with car/motorcycle capacity. Entry = plate + vehicle type only. Occupancy = active sessions per vehicle type vs capacity.

### Skills

- `supabase`, `supabase-postgres-best-practices`, `plug-supabase`, `plug-supabase-pg`
- `backend-patterns`, `api-design`, `tdd-workflow`, `security-review`
- `frontend-patterns`, `coding-standards`, `sp-executing`
- `context7-mcp` (only if Next.js / Server Action APIs uncertain)

### File manifest

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `supabase/migrations/<timestamp>_ops_s1_capacity_pools.sql` | Capacity columns / pool table; alter entry RPC; nullable/remove required space FK path |
| CREATE | `supabase/tests/00020_ops_s1_capacity_entry.sql` | pgTAP: capacity enforce, no space required, plate+type only, concurrency |
| MODIFY | `supabase/migrations/20260720193348_phase6_entry_ticket_rpcs.sql` | **Do not edit historical migration.** Logic changes live only in new S1 migration via `CREATE OR REPLACE`. |
| MODIFY | `supabase/seed.sql` | Seed car/motorcycle capacities for dev facility |
| MODIFY | `src/features/entry/schemas.ts` | Drop `color`, drop `parkingSpaceId`; keep plate + vehicleTypeId + idempotency |
| MODIFY | `src/features/entry/actions.ts` | Pass new RPC args; map capacity errors |
| MODIFY | `src/features/entry/service.ts` | Call updated `create_parking_entry` without space |
| MODIFY | `src/features/entry/components/entry-form.tsx` | Plate + vehicle type only; show pool remaining |
| MODIFY | `src/features/entry/components/entry-page-view.tsx` | KPI copy for capacity pools |
| MODIFY | `src/features/entry/components/entry-kpi-strip.tsx` | Cars/motorcycles free vs total |
| MODIFY | `src/features/entry/components/entry-context-panel.tsx` | Remove bay-centric zone space lists; show pool summary |
| MODIFY | `src/app/(protected)/entry/page.tsx` | Stop fetching available spaces list (or fetch capacities only) |
| CREATE | `src/features/facility/schemas.ts` | Zod for capacity upsert (if not existing facility feature file — prefer extend existing) |
| MODIFY | `src/features/facility/**` **or** `src/app/(protected)/admin/settings/page.tsx` + related actions | Admin UI: set car capacity, motorcycle capacity |
| MODIFY | `src/features/dashboard/types.ts` | Metrics: `car_capacity`, `car_occupied`, `motorcycle_capacity`, `motorcycle_occupied` (names exact in migration) |
| MODIFY | `src/features/dashboard/service.ts` | Snapshot shape passthrough |
| CREATE | `supabase/migrations/<timestamp>_ops_s1_dashboard_capacity.sql` | Update `get_dashboard_snapshot` occupancy basis to pools *(may be same migration as entry)* |
| MODIFY | `src/components/dashboard/kpi-stat-cards.tsx` | Real pool metrics; **no fake trends** |
| MODIFY | `src/components/dashboard/metric-grid.tsx` | Pool-based labels/hints |
| MODIFY | `src/components/dashboard/space-map-grid.tsx` | Replace bay grid with capacity summary card **or** hide from `dashboard-view.tsx` |
| MODIFY | `src/components/dashboard/dashboard-view.tsx` | Drop space-map row if retired |
| MODIFY | `src/components/dashboard/occupancy-overview.tsx` | Drive from pool metrics |
| MODIFY | `src/components/dashboard/zone-occupancy.tsx` | Retire or repurpose; prefer hide if unused |
| MODIFY | `src/app/(protected)/shell.tsx` | Hide or relabel **Parking Spaces** nav (`available: false`) until S5 cleanup |
| MODIFY | `tests/unit/entry-schema.test.ts` | Assert no color/space; plate+type required |
| MODIFY | `tests/integration/entry.test.ts` | Capacity RPC contracts |
| MODIFY | `tests/e2e/entry-ticket.spec.ts` | Remove space select steps; keep heading/labels/button contracts |
| MODIFY | `tests/e2e/dashboard-realtime.spec.ts` | Entry helper without space |
| MODIFY | `tests/e2e/scanner-exit-preview.spec.ts` | Entry helper without space |
| GENERATE | `src/lib/database.types.ts` (via Supabase gen) | After migration |

### DB design notes (implement in S1 migration only)

- Prefer `parking_locations.settings` **or** columns `car_capacity int`, `motorcycle_capacity int` (non-negative). Document choice in ADR.
- Map vehicle types to pool key (`CAR` / `MOTORCYCLE`) via `vehicle_types.code` or explicit `capacity_pool` column on `vehicle_types`.
- `create_parking_entry`: remove required `p_space_id`; enforce `COUNT(*)` active sessions for pool `< capacity` under location advisory lock.
- `parking_sessions.parking_space_id`: make nullable for new sessions **or** bind to a synthetic “POOL” space per type (prefer **nullable FK** + check constraint). Historical rows keep old space ids.
- Exit/cancel RPCs that release spaces: release only when `parking_space_id IS NOT NULL`; always decrement logical pool via session completion.

### Steps

- [ ] Write failing pgTAP for capacity full / entry without space.
- [ ] Migration: capacities + replace `create_parking_entry` + snapshot metrics.
- [ ] GREEN pgTAP; regenerate types.
- [ ] RED/GREEN unit + update entry UI; update E2E helpers.
- [ ] Admin settings: edit capacities.
- [ ] Dashboard KPIs show pool free counts (real data only).

### Gate

```powershell
npx supabase test db
npm run test -- tests/unit/entry-schema.test.ts tests/integration/entry.test.ts
npx playwright test tests/e2e/entry-ticket.spec.ts --workers=1
```

- [ ] Entry has no color field, no space select.
- [ ] Full pool rejects entry with stable error code.
- [ ] Evidence section S1 marked PASS.

---

# Phase S2 — Remove shift gate; staff-attributed cash (D2)

**Objective:** Payments succeed when staff is authenticated at the location; no open shift required. Attribution = `actor_id`. Hide shift UX.

### Skills

- `supabase`, `supabase-postgres-best-practices`, `plug-supabase-pg`
- `backend-patterns`, `security-review`, `tdd-workflow`
- `frontend-patterns`, `coding-standards`, `sp-executing`, `c-security-review`

### File manifest

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `supabase/migrations/<timestamp>_ops_s2_drop_shift_gate.sql` | `record_parking_payment` without `require_open_staff_shift`; keep actor audit |
| CREATE | `supabase/tests/00021_ops_s2_payment_without_shift.sql` | Payment OK with no open shift; still requires auth + quote + idempotency |
| MODIFY | `src/features/payments/service.ts` | Remove shift pre-checks; clearer errors |
| MODIFY | `src/features/payments/actions.ts` | No shift dependency |
| MODIFY | `src/features/payments/components/payment-form.tsx` | Remove “start shift” blockers; cash-only copy |
| MODIFY | `src/features/shifts/**` | Leave modules but unused; or add deprecation comment at top of `actions.ts` / `service.ts` |
| MODIFY | `src/app/(protected)/shifts/page.tsx` | Redirect to `/dashboard` or show retired notice |
| MODIFY | `src/app/(protected)/shell.tsx` | Ensure Shifts not in primary nav (already absent); remove PAGE_TITLES reliance if needed |
| MODIFY | `tests/e2e/payment-exit.spec.ts` | **Remove** `/shifts` + Start shift setup |
| MODIFY | `tests/integration/**` payment/shift tests | Align with no-shift rule |
| CREATE | `src/features/payments/staff-cash-summary.ts` | Optional thin helper: totals by actor for business date (RPC or query) |
| CREATE | `supabase/migrations/<timestamp>_ops_s2_staff_cash_summary.sql` | Optional `list_staff_cash_totals(p_business_date)` SECURITY DEFINER |

### Steps

- [ ] RED pgTAP: payment without shift succeeds; unauthenticated fails.
- [ ] Replace `record_parking_payment` body; keep idempotency + exact amount + quote expiry checks.
- [ ] Update payment UI + E2E (no shift).
- [ ] Optional: staff cash totals RPC for admin later.
- [ ] Security pass: ensure staff can only pay at own location (existing RLS/RPC guards).

### Gate

```powershell
npx supabase test db
npx playwright test tests/e2e/payment-exit.spec.ts --workers=1
```

- [ ] No UI path requires “Start shift” before cash.
- [ ] Payment audit rows still include actor.
- [ ] Evidence S2 PASS.

---

# Phase S3 — Unified exit happy path + cash-only (D1, D3)

**Objective:** One operator flow: identify ticket → show fee → collect cash → release vehicle. Entry never collects payment (verify no entry payment UI). Lost-ticket penalty remains from published rate (`lost_ticket_penalty_centavos`) and is obvious in Rates admin.

### Skills

- `backend-patterns`, `api-design`, `supabase`, `supabase-postgres-best-practices`
- `security-review`, `tdd-workflow`, `frontend-patterns`, `accessibility`
- `design-system`, `sp-executing`, `context7-mcp`, `c-review-bugbot`

### File manifest

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `supabase/migrations/<timestamp>_ops_s3_settle_and_exit.sql` | New RPC `settle_cash_and_exit` **or** documented action that calls `record_parking_payment` then `confirm_vehicle_exit` in one DB transaction |
| CREATE | `supabase/tests/00022_ops_s3_settle_and_exit.sql` | Atomic settle+exit; idempotency; quote expiry; top-up still blocked correctly |
| CREATE | `src/features/exit/components/exit-checkout.tsx` | Single-screen: fee breakdown + cash tender + primary CTA “Collect cash & exit” |
| CREATE | `src/features/exit/settle-actions.ts` | Server action wrapping settle RPC; Zod cash amount |
| MODIFY | `src/features/exit/components/fee-breakdown.tsx` | Embeddable in checkout; cash-only label |
| MODIFY | `src/features/exit/components/exit-page-client.tsx` | Route happy path into `ExitCheckout` |
| MODIFY | `src/features/exit/components/exit-confirmation.tsx` | Keep for exception/manual confirm only; not default |
| MODIFY | `src/features/payments/components/payment-form.tsx` | Reuse tender field internals or thin-wrap into checkout |
| MODIFY | `src/features/scanner/components/scanner-view.tsx` | After validate → navigate to unified checkout route |
| MODIFY | `src/app/(protected)/scanner/page.tsx` | Copy: cash exit flow |
| MODIFY | `src/app/(protected)/exit/[sessionId]/page.tsx` | Render checkout |
| MODIFY | `src/app/(protected)/exit/[sessionId]/confirm/page.tsx` | Keep for deep links; redirect happy path if already payable |
| MODIFY | `src/app/(protected)/payments/[sessionId]/page.tsx` | Redirect to `/exit/[sessionId]` checkout (avoid dual UIs) |
| MODIFY | `src/app/(protected)/shell.tsx` | Optional: merge “Payments” nav into Scan & Exit or mark Payments as secondary |
| MODIFY | `src/features/rates/components/rate-editor.tsx` | Emphasize **Lost ticket penalty** field (label/help text) |
| MODIFY | `src/features/rates/components/rate-version-list.tsx` | Show penalty in list summary |
| MODIFY | `src/features/rates/schemas.ts` | Ensure penalty required ≥ 0 centavos (already present — verify UX only) |
| MODIFY | `tests/e2e/payment-exit.spec.ts` | One-flow checkout |
| MODIFY | `tests/e2e/scanner-exit-preview.spec.ts` | Land on checkout; cash-only |
| CREATE | `tests/e2e/exit-checkout.spec.ts` | Happy path settle+exit |

### RPC design notes

- Prefer **one SECURITY DEFINER** function `settle_cash_and_exit(...)` that performs payment + exit under one transaction (stronger atomicity) reusing private helpers from Phase 8 SQL.
- Preserve idempotency keys (single key or payment-key + derived exit).
- Zero-fee: skip payment insert path; still confirm exit.
- D1 check: grep entry feature for payment calls — must remain none.

### Steps

- [ ] RED pgTAP for settle+exit atomicity and replay.
- [ ] Migration + GREEN.
- [ ] Build `ExitCheckout` UI; wire scanner → checkout.
- [ ] Redirect old payment/confirm pages.
- [ ] Rates UI: lost-ticket penalty help text (“Applied when processing a lost ticket”).
- [ ] E2E happy path without visiting `/shifts` or separate confirm.

### Gate

```powershell
npx supabase test db
npx playwright test tests/e2e/exit-checkout.spec.ts tests/e2e/payment-exit.spec.ts tests/e2e/scanner-exit-preview.spec.ts --workers=1
```

- [ ] Staff can finish a normal exit on one primary screen.
- [ ] No non-cash tender controls.
- [ ] Evidence S3 PASS.

---

# Phase S4 — Sessions UX: exceptions under More actions (D5)

**Objective:** Active Sessions primary actions = Pay/Exit (or open checkout). Lost ticket / cancel / correct behind **More actions** disclosure. Visualize clearly for hesitant operators.

### Skills

- `frontend-patterns`, `design-system`, `accessibility`, `tdd-workflow`
- `coding-standards`, `sp-executing`

### File manifest

| Action | Path | Purpose |
|--------|------|---------|
| MODIFY | `src/app/(protected)/sessions/page.tsx` | Dashboard-like shell; list layout |
| MODIFY | `src/features/sessions/components/exception-actions.tsx` | Render inside collapsible **More actions** menu only |
| CREATE | `src/features/sessions/components/session-row-actions.tsx` | Primary: “Checkout” / “Continue exit”; secondary menu trigger |
| CREATE | `src/features/sessions/components/sessions-page-view.tsx` | Presentational list matching dashboard card tokens (`rounded-md`, etc.) |
| MODIFY | `src/features/sessions/service.ts` | List fields needed for primary CTA routing only |
| MODIFY | `src/features/sessions/actions.ts` | Unchanged contracts; ensure permissions still enforced server-side |
| MODIFY | `tests/e2e/**` touching sessions exceptions | Open More actions before lost/cancel |

### UX specification (implement exactly)

```text
[Plate]  [Ticket]  [Status pill]
Primary button: "Checkout" → /exit/[sessionId]
Secondary: button "More actions" → menu
  - Process lost ticket (if permission)
  - Cancel session (if permission)
  - Correct session (if permission)
```

Empty state: “No sessions need attention.”

### Steps

- [ ] Build `session-row-actions` with accessible menu (`DropdownMenu` via shadcn — `npx shadcn@latest add dropdown-menu` if missing).
- [ ] Move exception controls into menu; keep server permission checks.
- [ ] Restyle page to dashboard padding/card pattern.
- [ ] Update E2E selectors for More actions.

### Gate

```powershell
npx playwright test tests/e2e/payment-exit.spec.ts --workers=1
npm run lint
```

- [ ] Primary row has no lost/cancel/correct buttons visible until More actions opened.
- [ ] Evidence S4 PASS.

---

# Phase S5 — Nav cleanup, spaces retirement, copy pass

**Objective:** Remove operator confusion: hide retired Spaces/Shifts/dual Payments paths; align copy to capacity + cash-at-exit.

### Skills

- `frontend-patterns`, `design-system`, `accessibility`, `coding-standards`
- `sp-executing`, `verification-loop`

### File manifest

| Action | Path | Purpose |
|--------|------|---------|
| MODIFY | `src/app/(protected)/shell.tsx` | Nav: Dashboard, Entries, Scan & Exit, Active Sessions; Admin: Rates, Staff, Settings; Spaces/Shifts/Payments hidden or admin-only legacy |
| MODIFY | `src/app/(protected)/spaces/page.tsx` | Admin-only capacity note **or** redirect to settings capacities |
| MODIFY | `src/components/spaces/space-board.tsx` | Mark deprecated; no staff dependency |
| MODIFY | `src/features/entry/components/entry-page-view.tsx` | Final copy: pay at exit only |
| MODIFY | `src/components/dashboard/recent-entries-table.tsx` | Remove bay/gate columns if still present; show type/pool |
| MODIFY | `src/app/(protected)/payments/page.tsx` | Redirect → `/scanner` or `/sessions` |
| MODIFY | `README.md` | Short ops flow section pointing at this plan |

### Gate

- [ ] Staff nav shows ≤ 5 primary ops items.
- [ ] No dead-end “must select space” or “must start shift” copy remains in primary flows.
- [ ] Evidence S5 PASS.

---

# Phase S6 — Hardening, regression, security review

**Objective:** Prove the simplified path is secure and reliable before returning to Phase 10 reports work.

### Skills

- `security-review`, `c-security-review`, `c-review-bugbot`
- `tdd-workflow`, `verification-loop`, `ai-regression-testing` (`k:\E-ParkGO\.agents\skills\ai-regression-testing\SKILL.md`)
- `supabase-postgres-best-practices`, `sp-executing`

### File manifest

| Action | Path | Purpose |
|--------|------|---------|
| MODIFY | `contexts/plans/evidence/ops-simplification-v1.md` | Final gate evidence |
| CREATE | `supabase/tests/00023_ops_s6_regression_matrix.sql` | Entry capacity + pay/exit + lost penalty + cancel matrix |
| MODIFY | `tests/e2e/entry-ticket.spec.ts` | Final |
| MODIFY | `tests/e2e/exit-checkout.spec.ts` | Final |
| MODIFY | `tests/e2e/payment-exit.spec.ts` | Final |
| MODIFY | `tests/e2e/dashboard-realtime.spec.ts` | Final |
| READ-ONLY | listed production RPC migrations touched in S1–S3 | Review search_path, grants, audit |

### Verification commands

```powershell
npx supabase test db
npm run test
npx playwright test tests/e2e/entry-ticket.spec.ts tests/e2e/exit-checkout.spec.ts tests/e2e/payment-exit.spec.ts tests/e2e/scanner-exit-preview.spec.ts tests/e2e/dashboard-realtime.spec.ts --workers=1
npm run lint
```

### Security checklist

- [ ] No raw QR in logs, paths, or IndexedDB.
- [ ] Payment/exit RPCs still location-scoped; actor cannot spoof `actor_id`.
- [ ] Lost ticket still permission-gated; penalty from rate snapshot, not client.
- [ ] Idempotency conflicts return safe errors.
- [ ] No float money; no client-supplied entry/exit timestamps.

### Gate

- [ ] All commands green; Bugbot + security review recorded; evidence S6 PASS.
- [ ] Update `PLAN.md §0.2` to resume Phase 10 (or next authorized phase).

---

## Out of scope (explicit)

- Online / card / e-wallet payments
- Customer mobile apps, LPR, barrier gates
- Multi-branch admin
- Deleting `staff_shifts` / `parking_spaces` tables (retire usage only)
- Phase 10A premium redesign (may follow; not required to ship S1–S6)
- Fully offline authoritative writes

---

## Phase dependency graph

```text
S0 Decision lock
 └─ S1 Capacity + trimmed entry
      └─ S2 No shift gate
           └─ S3 Unified cash exit
                └─ S4 Sessions More actions
                     └─ S5 Nav/copy cleanup
                          └─ S6 Hardening → resume PLAN Phase 10
```

Do not parallelize S1–S3 (shared RPC surface). S4 may start UI scaffolding after S3 RPC lands. S5 after S4.

---

## How an agent should start a phase (template)

```text
1. Read contexts/plans/ops-simplification-v1.md → Phase Sx only
2. Read every skill file listed for Sx (absolute paths in this doc)
3. Open ONLY the File manifest paths for Sx
4. Implement checkboxes in order (TDD)
5. Run Gate commands
6. Append evidence to contexts/plans/evidence/ops-simplification-v1.md
7. STOP — do not begin S(x+1) in the same session unless §0.2 and user authorize it
```

---

## Success criteria (product)

| Criterion | Measure |
|-----------|---------|
| Faster entry | Plate + type only; < 45s p95 remains; no space picker |
| Clear occupancy | Entry + dashboard show car/motorcycle free counts |
| Faster exit | One checkout screen for cash settle + release |
| Simpler staffing | No shift open/close; cash by staff login |
| Safe exceptions | Lost/cancel/correct behind More actions; penalty configurable in Rates |
| Security intact | Hash QR, server fees, idempotency, audit still enforced |

---

## Amend protocol

If implementation discovers a required file not listed:

1. Stop coding.
2. Append the path to that phase’s manifest in this document.
3. Commit `docs: amend ops-simplification-v1 phase Sx manifest`.
4. Resume.

Do **not** silently widen scope into unrelated features.
