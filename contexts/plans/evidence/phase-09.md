# Phase 9 Gate Evidence

## Attempt 2026-07-22T01:40:00+08:00

- Phase: 09 — Dashboard & Realtime
- Result: **PASS**
- Environment: local Windows, Docker Desktop, Supabase `http://127.0.0.1:55321`, E2E app `http://localhost:3001` via `scripts/dev-e2e.mjs`
- Migration: `supabase/migrations/20260721210000_phase9_dashboard_realtime.sql` (`get_dashboard_snapshot`, private `realtime.send` invalidation on `parking_spaces` / `parking_sessions` / `payments`, `realtime.messages` topic policy)
- pgTAP suite: `00015_dashboard_snapshot.sql`
- Web surface: `/dashboard`, `GET/HEAD /api/dashboard`, TanStack Query + private Broadcast channel `location:<id>:dashboard`
- Commands:
  - `SUPABASE_PROJECT_ID=replace-in-ci-secret-store npm run db:reset && npm run db:test && npm run db:types` — exit 0 (**449** pgTAP across 15 files)
  - `npm run typecheck && npm run lint && npm test && npm run test:coverage && npm run build` — exit 0 (build with local Supabase env vars + restored `.env`)
  - `npx playwright test tests/e2e/dashboard-realtime.spec.ts --workers=1` — exit 0; **10 passed** (chromium, firefox, webkit, mobile-chrome, mobile-safari)
  - `git diff --check` — exit 0
- Coverage: statements `96.09%`; branches `83.53%`; functions `94.48%`; lines `96.2%`
- Realtime evidence:
  - Broadcast payload keys only `domain` + `aggregate_version` (pgTAP + `private.broadcast_dashboard_invalidation` source inspection)
  - Topic pattern `location:<parking_location_id>:dashboard` with cross-location `realtime.messages` denial (pgTAP)
  - Client telemetry (`dashboard-telemetry.ts`): invalidation payload under 80 bytes in unit test; subscription count 0 after unsubscribe; canonical refetch timing recorded
  - E2E: two-browser convergence after entry (5s poll with refresh fallback); operational metrics + live status controls on mobile and desktop
- Accessibility: metric grid `aria-label`, zone occupancy text + non-color legend, realtime status labels, keyboard refresh control (component tests)
- Next action: begin Phase 10 — Reports & Audit
