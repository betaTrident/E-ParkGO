# Phase 9 — Dashboard and Realtime

<!-- ============================================================
PHASE 9 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 9 and Phase 8 is COMPLETE.
============================================================ -->

## 9.0 Execution guard

- `STATUS: COMPLETE`; `IMPLEMENTATION_STATE: COMPLETE` (gate evidence: `contexts/plans/evidence/phase-09.md`).
- Load project `frontend-patterns`, `supabase`, `accessibility`; plugins
  `v-react-best-practices`, `v-next-cache-components`, `plug-supabase`, `c-canvas`.
- Dependencies: stable entry/payment/exit RPCs and all Phase 8 gates.
- Exclude historical reports, full-table subscriptions, optimistic financial
  authority, and background subscriptions after logout.

## 9.1 Delivered features

Deliver a bounded location-scoped dashboard snapshot, operational metric cards,
zone/space status, recent movements, filtered Realtime invalidation, TanStack
Query reconciliation, live/reconnecting/stale/offline states, reconnect canonical
refetch, visible-tab polling fallback, unsubscribe/clear on logout, and quota/
convergence instrumentation.

The database snapshot is canonical. Realtime is an invalidation hint; payment may
change revenue/state but never occupancy, and confirmed exit changes occupancy.

Use authenticated **private Supabase Realtime Broadcast**, not table-wide Postgres
Changes payloads. Database triggers on `parking_spaces`, `parking_sessions`, and
`payments` publish only `{ domain, aggregate_version }` to
`location:<parking_location_id>:dashboard`. The client subscribes to exactly its
active-profile topic and refetches the canonical snapshot. The migration owns
`realtime.messages` authorization so a caller can receive only the topic matching
`private.current_location_id()`. Before implementation, verify the current
Broadcast trigger/topic/policy API through the loaded official Supabase skill/docs;
if the API differs, stop and amend this playbook rather than switching mechanisms.

Authoritative contracts: `DASH-001`, `REALTIME-001`, `SPACE-001`, `PLAN.md §§12,
18, 19, 20, 21, 23, 32`.

## 9.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `supabase/tests/00015_dashboard_snapshot.sql` | Aggregate/location/timezone/reconciliation tests. |
| CREATE | `supabase/migrations/<CLI-generated>_phase9_dashboard_realtime.sql` | Snapshot RPC, private Broadcast triggers/topic payload, and `realtime.messages` topic policy. |
| CREATE | `src/lib/query/client.ts` | One scoped QueryClient configuration. |
| CREATE | `src/lib/query/keys.ts` | Immutable location/domain query keys. |
| CREATE | `src/lib/realtime/dashboard-channel.ts` | Filtered subscribe/unsubscribe/reconnect manager. |
| CREATE | `src/lib/realtime/types.ts` | Safe event/projection types. |
| CREATE | `src/hooks/use-dashboard-realtime.ts` | Channel lifecycle and reconciliation hook. |
| CREATE | `src/hooks/use-connectivity.ts` | Browser plus health-based status. |
| CREATE | `src/features/dashboard/service.ts` | Server snapshot adapter. |
| CREATE | `src/features/dashboard/queries.ts` | Bounded Query options. |
| CREATE | `src/components/dashboard/metric-grid.tsx` | Accessible metrics. |
| CREATE | `src/components/dashboard/zone-occupancy.tsx` | Status visualization without color-only meaning. |
| CREATE | `src/components/dashboard/realtime-status.tsx` | Live/reconnecting/stale/offline state. |
| CREATE | `src/app/api/dashboard/route.ts` | Safe bounded snapshot GET. |
| MODIFY | `src/components/providers.tsx` | Add one QueryClient provider/devtools policy. |
| MODIFY | `src/components/dashboard/dashboard-view.tsx` | Replace Auth placeholder with operational composition. |
| MODIFY | `src/app/(protected)/dashboard/page.tsx` | Server initial snapshot. |
| MODIFY | `src/app/(protected)/spaces/page.tsx` | Reuse safe invalidation/status where applicable. |
| CREATE | `tests/unit/dashboard-components.test.tsx` | Metrics/status/a11y tests. |
| CREATE | `tests/unit/dashboard-channel.test.ts` | Filters, cleanup, backoff, no mutation. |
| CREATE | `tests/integration/dashboard.test.ts` | Snapshot/reconciliation/location tests. |
| CREATE | `tests/e2e/dashboard-realtime.spec.ts` | Two-client/reconnect/poll tests. |
| GENERATE | `src/lib/supabase/database.types.ts` | Never hand-edit. |
| FORBIDDEN | Postgres Changes/full-row subscriptions; profiles, permissions, token hashes, audit/payment facts in payload | Broadcast invalidation hints only. |

## 9.3 TDD execution steps

### Step 9.1 — RED authoritative snapshot and private Broadcast

Test capacity/status totals, occupying/exception states, entries/exits by
`Asia/Manila` date, payment/exit separation, net non-voided revenue, zero capacity,
cross-location denial, bounded output, invoker security, exact Broadcast topic,
payload keys, and `realtime.messages` cross-location topic denial.

```powershell
npm run db:reset
npm run db:test
```

Expected RED: Phase 9 snapshot/Broadcast trigger/topic-policy objects are missing only.

### Step 9.2 — GREEN database and types

```powershell
npm run db:migrate -- phase9_dashboard_realtime
npm run db:reset
npm run db:test
npm run db:types
```

Expected: all database suites pass; Broadcast payload contains only `domain` and
`aggregate_version`, and cross-location topic receipt is denied.

### Step 9.3 — RED/GREEN query and channel lifecycle

Write tests for location filter, safe row invalidation, full aggregate refetch,
30-second stale/poll switch, visibility backoff, reconnect-before-live, channel
cleanup, logout cleanup, duplicate event tolerance, and version conflict refetch.

```powershell
npx vitest run tests/unit/dashboard-channel.test.ts tests/integration/dashboard.test.ts
```

Expected: targeted tests pass after minimal implementation.

### Step 9.4 — UI and two-client E2E

Implement Server initial snapshot plus Client live widgets with skeleton, empty,
error/correlation, stale timestamp, offline read-only, refresh, keyboard, reduced
motion, and mobile layouts.

```powershell
npx vitest run tests/unit/dashboard-components.test.tsx
npm run test:e2e -- tests/e2e/dashboard-realtime.spec.ts
```

Expected: two authenticated local clients converge after entry/payment/exit,
reconnect refetches missed changes before `Live`, and normal pilot convergence is
within five seconds.

## 9.4 Gate and handoff

```powershell
npm run db:reset
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/dashboard-realtime.spec.ts
git diff --check
```

Require ≥80% all coverage metrics, two-client/reconnect/poll/location tests,
Broadcast payload/topic-policy inspection, no subscription leak, measured payload/subscription/
convergence evidence, accessibility/mobile pass, and no critical/high finding.

Append the required attempt to `contexts/plans/evidence/phase-09.md`, link its
successful anchor from §0.2, set Phase 9 complete and Phase 10 active, update the
playbook, and stop.

> **END OF PHASE 9 — STOP.** Do not implement reports or PWA caching.

<!-- ============================================================
PHASE 9 END — HARD STOP
============================================================ -->
