# Phase 4 — Authentication and Authorization Completion

<!-- ============================================================
PHASE 4 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 4 and Phase 3 is COMPLETE.
============================================================ -->

## 4.0 Execution guard

- `PHASE_ID: 4`
- `EXECUTION_STATUS: PENDING`
- `IMPLEMENTATION_STATE: PARTIAL`
- `CURRENT_STEP: none until Phase 3 completes`
- `WORKING_DIRECTORY: K:\E-ParkGO`
- Dependencies: Phase 3 gate complete; local Auth/database services running.
- Remote Auth Admin actions, production URL changes, and real invitations are
  forbidden. Tests use synthetic local users only.

Load, in order: project `supabase`, project `security-review`, project
`backend-patterns`, plugin `plug-supabase`, `v-auth`, and
`v-routing-middleware`. Load `context7-mcp` before using any uncertain Next.js or
Supabase Auth API.

## 4.1 Outcomes, ownership, and non-goals

Already implemented and to be preserved:

- SSR browser/server/admin clients and session refresh in `src/lib/supabase/`.
- Login, forgot-password, callback, update-password, sign-out, safe redirects,
  active-profile guards, protected layout, and permission helpers.
- Nonce CSP/protected routing in `src/proxy.ts`.
- Auth unit/component coverage and responsive Auth visual E2E.

This phase still owns:

- Admin invite/create compensation, profile/location assignment, activation,
  disable/reactivate, named permissions, last-admin protection, and session
  revocation.
- Local public-signup disablement and redirect allowlist verification.
- Recovery security audit evidence and full live local Auth/RLS/grant matrices.
- `/admin/staff` responsive, accessible management UI.

Phase 12 owns production MFA enforcement, device security, global Origin/CSRF
hardening, and abuse-rate monitoring. Phase 4 must keep seams for those controls
without claiming they are complete.

Authoritative contracts: `PLAN.md AUTH-001..003`, `STAFF-001..002`, `§§11, 12,
15, 18, 21, 23, 33`.

## 4.2 File change manifest

| Action | Path | Responsibility |
| --- | --- | --- |
| CREATE | `supabase/tests/00005_auth_admin_workflows.sql` | RED permission, self-elevation, last-admin, disable, and audit assertions. |
| CREATE | `supabase/migrations/<CLI-generated>_phase4_auth_admin_workflows.sql` | Protected profile/permission/audit RPCs; forward-only. |
| MODIFY | `supabase/config.toml` | Disable public signup locally and document Auth redirect behavior. |
| CREATE | `src/features/staff/schemas.ts` | Strict invite/profile/permission boundary schemas. |
| CREATE | `src/features/staff/service.ts` | Trusted server orchestration and compensation; no client service key. |
| CREATE | `src/features/staff/actions.ts` | Authenticated admin Server Actions with safe envelopes. |
| CREATE | `src/features/staff/components/staff-management.tsx` | Accessible staff list and dialogs. |
| CREATE | `src/app/(protected)/admin/staff/page.tsx` | Admin-guarded Server Component. |
| CREATE | `tests/unit/staff-schemas.test.ts` | Schema and forbidden-field coverage. |
| CREATE | `tests/integration/auth-admin.test.ts` | Local Auth/profile compensation and disable flow. |
| CREATE | `tests/e2e/auth-live.spec.ts` | Live local login/recovery/logout/disable/admin flow. |
| MODIFY | `vitest.config.ts` | Include both `tests/unit/**` and `tests/integration/**`; preserve global coverage thresholds and fix any nonzero coverage-artifact exit. |
| MODIFY | `src/features/auth/actions.ts`, `src/lib/auth/*`, `src/proxy.ts` | Only bounded fixes required by tests. |
| MODIFY | `tests/unit/auth-*.test.*`, `tests/e2e/auth-visual.spec.ts` | Extend without weakening current assertions. |
| GENERATE | `src/lib/supabase/database.types.ts` | `npm run db:types`; never hand-edit. |
| FORBIDDEN | Existing Phase 3 migrations, remote Auth users/settings, Phase 5 files | Stop on required cross-phase changes. |

## 4.3 TDD execution steps

### Step 4.1 — RED database authorization workflows

Create `00005_auth_admin_workflows.sql` first. Cover unauthenticated, inactive,
ordinary staff, same-location admin, cross-location actor, self-elevation,
last-active-admin removal, permission assignment, disable/reactivate, immutable
audit, and direct table-write denial.

```powershell
npm run db:reset
npm run db:test
```

Expected RED: only new workflow assertions fail because the named RPCs do not yet
exist. Any older assertion failure must be repaired before proceeding.

### Step 4.2 — GREEN protected database workflows

Create the migration using:

```powershell
npm run db:migrate -- phase4_auth_admin_workflows
```

Record the generated path. Implement narrow functions with caller-derived actor
and location, fixed empty `search_path`, qualified objects, revoked public
execution, bounded inputs, and audit events. Then run:

```powershell
npm run db:reset
npm run db:test
npm run db:types
```

Expected: all database assertions pass and types regenerate successfully.

### Step 4.3 — RED trusted server boundary

First update `vitest.config.ts` so its `include` matches both unit and integration
test trees. Use the existing jsdom default and a per-file documented Vitest
environment directive only when an integration test requires Node; verify the
current directive against official Vitest documentation before using it.

Write schema and integration tests before staff service/actions. Prove unknown
fields, client-supplied actor/location/role escalation, invalid emails, unsafe
redirects, last-admin removal, orphan Auth identity reconciliation, and raw Auth
errors are rejected or safely compensated.

```powershell
npx vitest run tests/unit/staff-schemas.test.ts tests/integration/auth-admin.test.ts
```

Expected RED: Vitest discovers both explicitly named files; failures correspond
only to missing staff modules/workflows. `No test files found` is a configuration
failure and must be fixed before implementation.

### Step 4.4 — GREEN admin staff UI and Auth lifecycle

Implement the trusted server orchestration and `/admin/staff`. Never import the
admin client from a Client Component. Account creation and profile creation are
not one transaction: default-deny until the profile succeeds, then retry or
disable/delete the synthetic local identity through an explicit compensation
path and record reconciliation evidence.

```powershell
npx vitest run tests/unit/staff-schemas.test.ts tests/integration/auth-admin.test.ts
npm run typecheck
npm run lint
```

Expected: targeted tests, typecheck, and lint exit 0.

### Step 4.5 — Live local Auth, responsive, and security verification

Extend Playwright to test real local authentication, refresh, recovery intent,
password update once, logout/cache clearing, inactive denial, admin staff access,
ordinary-staff denial, and five configured desktop/mobile projects. Do not use
production accounts.

```powershell
npm run test:e2e -- tests/e2e/auth-live.spec.ts tests/e2e/auth-visual.spec.ts
```

Expected: all selected projects pass; no test is skipped or focused.

## 4.4 Phase gate and completion record

Run in order:

```powershell
npm run db:reset
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/auth-live.spec.ts tests/e2e/auth-visual.spec.ts
git diff --check
```

Required results:

- All Phase 3 plus Phase 4 pgTAP assertions pass.
- Generated types have no unexplained drift.
- All unit/integration tests pass and coverage exits 0 with at least 80% for
  statements, branches, functions, and lines. A nonzero coverage command is not a
  gate pass even when its printed metrics exceed the thresholds.
- Production build and all selected Playwright projects pass.
- Admin workflows are local-only, location-scoped, audited, and deny escalation.
- Public signup is disabled; live protected/inactive/recovery/logout cases pass.
- No critical/high code or security review finding remains.

Append date, SHA, migration, command exits, pgTAP/test/browser counts, coverage,
review findings, and warnings to `contexts/plans/evidence/phase-04.md`. Link the
successful attempt from `PLAN.md §0.2`, set Phase 4 `COMPLETE`, Phase 5 `ACTIVE`,
update `ACTIVE_PLAYBOOK`, and stop.

> **END OF PHASE 4 — STOP.**
> Do not begin Phase 5 in this execution run.

<!-- ============================================================
PHASE 4 END — HARD STOP
Return the gate evidence summary and wait.
============================================================ -->
