# Phase 6 Gate Evidence

<a id="phase-06-attempt-2026-07-21t0450000800"></a>
## Attempt 2026-07-21T04:50:00+08:00

- Phase: 06 — Entry & QR Ticket
- Result: PASS
- Environment: local Windows, Docker Desktop, Supabase `http://127.0.0.1:55321`, E2E app `http://localhost:3001` via `scripts/dev-e2e.mjs` (webpack dev, isolated local Supabase env)
- Migration: `supabase/migrations/20260720193348_phase6_entry_ticket_rpcs.sql` (`create_parking_entry`, `reissue_parking_ticket`, plate/ticket/QR helpers, idempotency sanitization)
- QR dependency: `react-qr-code` (client render only; token generation and SHA-256 hash remain in PostgreSQL)
- Credential lifecycle: in-memory `TicketCredentialProvider` (no `localStorage`/IndexedDB); cleared on route leave; reissue guidance on revisit without `issued=1`
- Seed update: added spaces `A-03`…`A-12` for multi-browser E2E capacity; RLS matrix expectation updated to 13 spaces
- Commands:
  - `npm run db:reset && npm run db:test && npm run db:types` — exit 0 (**330** pgTAP incl. 32 entry + 8 concurrency tests)
  - `npm run typecheck && npm run lint && npm test && npm run test:coverage && npm run build` — exit 0
  - `npx playwright test tests/e2e/entry-ticket.spec.ts --workers=1` — exit 0; **10 passed** (chromium, firefox, webkit, mobile-chrome, mobile-safari)
  - `git diff --check` — exit 0
- Coverage: statements `93.10%`; branches `82.14%`; functions `94.80%`; lines `92.93%`
- Security checks: raw QR token only in first issuance/reissue response and immediate in-memory print surface; idempotency replay returns `REISSUE_REQUIRED` without `qr_payload`; E2E asserts no ticket keys in `localStorage`
- Concurrency: `00008_entry_concurrency.sql` covers same-plate/same-space races and idempotency replay
- Next action: begin Phase 7 — Validation, Fee, Exit Preview
