# ADR 0001 — Ops Simplification: Capacity Pools and Cash Attribution

- Status: Accepted
- Date: 2026-08-02
- Scope: Product contract and S1 schema direction for E-ParkGO ops simplification v1
- Playbook: `contexts/plans/ops-simplification-v1.md`

## Context

Phases 3–9 delivered a full parking operations stack: per-bay space assignment,
shift-gated cash collection, separate payment and exit surfaces, and entry fields
for plate, color, and parking space. Operator feedback and product review (2026-08-02)
identified unnecessary friction in day-to-day workflows without weakening security
requirements (QR hash storage, server-side fees, idempotency, append-only audit).

Phase 10 (Reports & Audit) was active but is paused until ops simplification
phases S0–S6 complete. This ADR locks the product decisions D1–D7 and the chosen
S1 database approach before any migration or application work begins.

## Decisions

### D1 — Pay only at exit

**Decision:** No payment at entry. All cash collection happens at exit.

**Rationale:** Entry should be fast (plate + vehicle type only). Collecting payment
at entry adds steps, teaches the wrong mental model, and duplicates exit settlement.

**Rejected:** Entry prepayment, partial deposit at entry, dual payment surfaces.

---

### D2 — No shift gate; actor-attributed cash

**Decision:** Remove the open-shift requirement from payment flows. Cash is tracked
by the authenticated staff member (`actor_id`) and location. Admin creates N staff
accounts via `/admin/staff`.

**Rationale:** Operators asked to drop the shift concept from daily workflows.
Every payment already stores `actor_id`; reconciliation = sum of non-voided payments
by `actor_id` + business date (Asia/Manila).

**Rejected alternatives:**

| Alternative | Why rejected |
|-------------|--------------|
| Keep shifts but auto-open on first payment | Still teaches a shift concept operators asked to remove |
| Shared anonymous drawer | Loses accountability; conflicts with audit goals (D6) |
| Hard-delete `staff_shifts` schema now | Unnecessary risk; migrations/tests still reference it |

**v1 constraint:** Retire shift UI routes; do **not** delete `staff_shifts` tables.

---

### D3 — Unified exit + cash only + configurable lost-ticket penalty

**Decision:** Single exit happy path: identify ticket → server fee quote → collect
cash → release vehicle (one operator surface). Cash only — no card/e-wallet UI.
Lost-ticket penalty remains admin-configurable via published rate version field
(`lost_ticket_penalty_centavos`); surface clearly in Rates admin UI.

**Rationale:** Reduces operator navigation between payment, confirm, and exit pages.
Penalty must remain server-sourced from rate snapshot, not client-supplied.

**Rejected:** Separate payment page as primary exit path; non-cash tender controls;
hard-coded lost-ticket penalty.

---

### D4 — Entry = plate + vehicle type only

**Decision:** Entry form collects plate number and vehicle type only. Drop color
field and parking space picker.

**Rationale:** Faster entry; aligns with capacity-pool occupancy model (D7).

**Rejected:** Optional color; required space/bay selection at entry.

---

### D5 — Exceptions under More actions

**Decision:** Active Sessions primary action = Checkout (→ unified exit). Lost
ticket, cancel, and correct session controls live behind a **More actions** menu,
not inline on the primary sessions list.

**Rationale:** Hesitant operators should see a clear happy path; exceptions remain
permission-gated and discoverable without cluttering the default row.

**Rejected:** Inline exception buttons on every session row; hidden exceptions
with no menu affordance.

---

### D6 — Keep QR hash, server fees, idempotency, audit

**Decision:** No weakening of existing security and integrity contracts:

- Raw QR token shown once at issuance/print; persist SHA-256 hash only; never log
  raw tokens.
- Fee calculation authoritative in PostgreSQL RPCs; `bigint` centavos only.
- Idempotent payment and exit operations with safe replay errors.
- Append-only audit trail for payments, exits, and exceptions.

**Rationale:** Simplification targets operator UX, not security posture.

**Rejected:** Client-side fee calculation; storing raw QR tokens; skipping idempotency
keys; mutable audit rows.

---

### D7 — Capacity pools (cars / motorcycles), not bay assignment

**Decision:** Occupancy = active sessions per vehicle-type pool vs admin-configured
capacity limits. Operators see "Cars free/total" and "Motorcycles free/total" —
not individual bay codes.

**Rationale:** Most facilities manage capacity by vehicle category, not per-slot
assignment at entry time.

**Rejected alternatives:**

| Alternative | Why rejected |
|-------------|--------------|
| Soft optional bay (space picker optional) | Still teaches bay model; does not simplify entry |
| Synthetic "POOL" parking spaces per type | Adds indirection; conflates legacy space table with pool semantics |
| Hard-delete `parking_spaces` / shift tables | Destructive; historical rows and tests depend on existing schema |

## S1 schema approach (chosen)

Implement in Phase S1 migration only (not in this ADR):

1. **`parking_locations`:** Add `car_capacity int NOT NULL DEFAULT 0` and
   `motorcycle_capacity int NOT NULL DEFAULT 0`, each with `CHECK (>= 0)`.
2. **`vehicle_types`:** Add `capacity_pool text` with `CHECK (capacity_pool IN ('CAR','MOTORCYCLE'))`
   to map each vehicle type to a pool key.
3. **`parking_sessions`:** Make `parking_space_id` nullable for new pool-based
   entries. Historical sessions retain existing space FK values.
4. **`create_parking_entry` RPC:** Remove required `p_space_id`; enforce
   `COUNT(*)` active sessions for pool `< capacity` under location advisory lock.
5. **Exit/cancel RPCs:** Release physical space only when `parking_space_id IS NOT NULL`;
   always free logical pool capacity via session completion.

**Rejected for S1:**

- `parking_locations.settings` JSON blob for capacities (prefer explicit columns for
  query clarity and CHECK constraints).
- Synthetic POOL rows in `parking_spaces`.
- Hard-delete of `staff_shifts` or `parking_spaces` tables.

## Consequences

- `PLAN.md §0.2` points at `contexts/plans/ops-simplification-v1.md`; Phase 10
  execution is **PAUSED** until S6 completes.
- Phase S1 may begin only after S0 gate (this ADR + execution control + evidence
  skeleton) is recorded.
- Reports and shift reconciliation in Phase 10 must align with actor-attributed
  cash when Phase 10 resumes.
- Phase 10A+ remains unauthorized until Phase 10 gate passes.

## References

- Product plan: `contexts/plans/ops-simplification-v1.md`
- Evidence: `contexts/plans/evidence/ops-simplification-v1.md`
- Prior phases: `contexts/plans/evidence/phase-03.md` through `phase-09.md`
