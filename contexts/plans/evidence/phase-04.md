# Phase 4 Gate Evidence

<a id="phase-04-attempt-2026-07-21t0245000800"></a>
## Attempt 2026-07-21T02:45:00+08:00

- Phase: 04 — Auth & Authorization
- Result: PASS
- Environment: local Windows, Docker Desktop, Supabase `http://127.0.0.1:55321`, E2E app `http://localhost:3001` via `scripts/dev-e2e.mjs`
- Commands:
  - `npm run db:reset && npm run db:test && npm run db:types` — exit 0 (257 pgTAP incl. 27 auth-admin workflow tests)
  - `npm run typecheck && npm run lint && npm test && npm run test:coverage && npm run build` — exit 0
  - `npm run test:e2e -- tests/e2e/auth-live.spec.ts tests/e2e/auth-visual.spec.ts` — exit 0; **35 passed** (chromium, firefox, webkit, mobile-chrome, mobile-safari)
  - `git diff --check` — exit 0 (line-ending warnings only)
- Coverage: statements `96.15%`; branches `85.85%`; functions `95.45%`; lines `96.1%`
- Key fixes:
  - `supabase/seed.sql`: GoTrue-compatible auth user seed (empty token strings; email `provider_id`)
  - `src/lib/auth/profile.ts` + `src/features/staff/service.ts`: disambiguate `staff_permissions!staff_permissions_profile_id_fkey` embed (PGRST201)
  - `src/lib/supabase/server-action.ts`: dedicated cookie-mutable Supabase client for auth Server Actions
  - `scripts/dev-e2e.mjs`: isolate remote `.env` during E2E; restore on process exit
- Security notes: `[auth] enable_signup = false` with `[auth.email] enable_signup = true` keeps email login while blocking public signup
- Next action: begin Phase 5 — Facility, Spaces, Rates
