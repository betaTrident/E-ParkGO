# Phase 6 — Parking Entry and QR Ticket

<!-- ============================================================
PHASE 6 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 6 and Phase 5 is COMPLETE.
============================================================ -->

## 6.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: NOT_STARTED`.
- Load project `backend-patterns`, `security-review`, `api-design`; plugins
  `v-vercel-functions`, `sp-executing`; use `context7-mcp` before selecting or
  calling a QR rendering library.
- Dependencies: published development rate, available spaces, active local staff,
  Phase 5 gate, and a recorded generic ticket/receipt layout decision. Phase 6
  verifies browser print CSS/emulation only; Phase 14 owns approval on actual
  printer models and representative devices.
- No scan/fee/payment/exit behavior, public verification, or remote database work.

## 6.1 Delivered features and immutable contracts

Deliver exact-once entry, plate normalization, vehicle reuse, compatible-space
locking, effective rate snapshot, session/ticket/audit/occupied-space atomicity,
256-bit one-time QR credentials, hash-only persistence, immediate ticket display,
58/80 mm and A4 print styling, and controlled revoke/reissue.

The raw token exists only in the first issuance/reissue response and immediate
in-memory print surface. It must never enter a URL path/query, log, analytics,
idempotency record, browser storage, cache, or later read response. Exact replay
returns durable identifiers with `REISSUE_REQUIRED`, never the token.

Authoritative contracts: `ENTRY-001..002`, `TICKET-001..002`, `PLAN.md §§8, 10,
13, 15, 16, 18, 21, 22, 23, 32`. PostgreSQL owns time, locks, snapshot, state,
idempotency, audit, and occupancy.

## 6.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `supabase/tests/00007_entry_ticket_rpcs.sql` | Entry/reissue/integrity/credential assertions. |
| CREATE | `supabase/tests/00008_entry_concurrency.sql` | Same-plate/same-space/idempotency races. |
| CREATE | `supabase/migrations/<CLI-generated>_phase6_entry_ticket_rpcs.sql` | Entry and ticket reissue RPCs/helpers. |
| CREATE | `src/features/entry/schemas.ts` | Strict plate/type/color/space request schema. |
| CREATE | `src/features/entry/service.ts` | Server RPC adapter and safe response mapping. |
| CREATE | `src/features/entry/actions.ts` | Idempotent authenticated boundary. |
| CREATE | `src/features/entry/components/entry-form.tsx` | Responsive entry workflow. |
| CREATE | `src/features/tickets/service.ts` | Safe ticket reads/reissue adapter. |
| CREATE | `src/features/tickets/actions.ts` | Reissue action with reason. |
| CREATE | `src/components/tickets/ticket-view.tsx` | Immediate printable facts/QR. |
| CREATE | `src/components/tickets/ticket-print.css` | 58/80 mm and A4 print rules. |
| CREATE | `src/lib/security/qr-token.ts` | Server-only token/encoding/hash helpers. |
| CREATE | `src/app/(protected)/entry/page.tsx` | Protected Server page. |
| CREATE | `src/app/(protected)/tickets/[ticketNumber]/page.tsx` | Same-location ticket display. |
| CREATE | `src/app/api/entries/route.ts` | Strict POST boundary to entry RPC. |
| CREATE | `src/app/api/tickets/[ticketNumber]/reissue/route.ts` | Strict reissue POST boundary. |
| CREATE | `tests/unit/entry-schema.test.ts` | Normalization/boundary tests. |
| CREATE | `tests/unit/qr-token.test.ts` | Entropy shape, exact parsing, and redaction. |
| CREATE | `tests/unit/ticket-view.test.tsx` | Print/accessibility/token lifecycle. |
| CREATE | `tests/integration/entry.test.ts` | API/RPC envelope and rollback. |
| CREATE | `tests/e2e/entry-ticket.spec.ts` | Entry, ticket, print, replay, reissue. |
| MODIFY IF VERIFIED | `package.json`, `package-lock.json` | Add one documented QR renderer; pin through npm. |
| GENERATE | `src/lib/supabase/database.types.ts` | Never hand-edit. |
| FORBIDDEN | `localStorage`, IndexedDB, service worker, monitoring payloads | No raw credential persistence. |

Phase 7 owns `/verify`, scanner/manual validation, and state transition to exit
review. Phase 6 may generate `/verify#v1.<token>` only because Phase 7 has explicit
ownership of that route.

## 6.3 TDD execution steps

### Step 6.1 — RED entry, credential, and concurrency tests

Write both pgTAP files first. Cover two-device same plate, same space, exact retry,
changed payload, unavailable/incompatible/wrong-location space, inactive rate,
snapshot copy, server time, rollback after each insert, token decoded length,
unique hash/number, token-free idempotency/audit, reissue revocation, and grants.

```powershell
npm run db:reset
npm run db:test
```

Expected RED: only new entry/ticket functions are missing; prior phases pass.

### Step 6.2 — GREEN atomic database workflows

```powershell
npm run db:migrate -- phase6_entry_ticket_rpcs
```

Record the filename. Implement canonical request hashing, advisory plate lock,
space/session row locks, server time, rate copy, CSPRNG token and SHA-256 hash,
single transaction, sanitized stable response, and narrow grants.

```powershell
npm run db:reset
npm run db:test
npm run db:types
```

Expected: all sequential and concurrent database cases pass without partial rows.

### Step 6.3 — RED/GREEN server boundary

Write unit/integration tests first. Reject client actor/location/time/total/status,
unknown fields, invalid plates/UUIDs, missing idempotency/correlation IDs, oversized
bodies, and raw database errors. Implement minimal service/action/Route Handler.

```powershell
npx vitest run tests/unit/entry-schema.test.ts tests/unit/qr-token.test.ts tests/integration/entry.test.ts
```

Expected: targeted tests pass after implementation.

### Step 6.4 — QR dependency and UI

Use `context7-mcp` or official package documentation to verify current React/Next
16 server/client compatibility before installing one QR renderer. Record the
package/version and API source. Do not implement QR encoding manually.

Implement accessible form, availability refresh, conflict recovery, one-time
ticket memory lifecycle, reissue warning, print views, and clear browser memory on
navigation/logout.

```powershell
npx vitest run tests/unit/ticket-view.test.tsx
npm run test:e2e -- tests/e2e/entry-ticket.spec.ts
```

Expected: component and all configured browser tests pass; no raw token appears in
trace URLs, browser storage, or retained application state after leaving the view.

## 6.4 Gate and handoff

```powershell
npm run db:reset
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/entry-ticket.spec.ts
git diff --check
```

Gate also requires explicit two-connection race evidence, no partial state, exact
replay/conflict behavior, hash-only storage, token redaction/cache inspection,
accessible generic browser print/print-preview verification, at least 80% all
coverage metrics, and no critical/high security finding. It must not claim a real
printer/device certification; that evidence belongs to Phase 14.

Append the required attempt to `contexts/plans/evidence/phase-06.md`, link its
successful anchor from §0.2, set Phase 6 complete and Phase 7 active, update the
active playbook, then stop.

> **END OF PHASE 6 — STOP.** Do not begin scanning or fee work.

<!-- ============================================================
PHASE 6 END — HARD STOP
============================================================ -->
