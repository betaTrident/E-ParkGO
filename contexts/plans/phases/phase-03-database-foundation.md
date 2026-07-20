# Phase 3 — Database Foundation Verification and Repair

<!-- ============================================================
PHASE 3 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 3.
This is a local verification-and-repair phase, not a schema redesign.
============================================================ -->

## 3.0 Execution guard

- `PHASE_ID: 3`
- `EXECUTION_STATUS: BLOCKED`
- `IMPLEMENTATION_STATE: IMPLEMENTED`
- `CURRENT_STEP: 3.1 Docker and local Supabase preflight`
- `WORKING_DIRECTORY: K:\E-ParkGO`
- `BLOCKER: Docker Desktop Linux engine is not running as of 2026-07-21`
- `REMOTE_ACTIONS_ALLOWED: false`
- `DESTRUCTIVE_REMOTE_ACTIONS_ALLOWED: false`
- Entry condition: Phases 1 and 2 are recorded complete in `PLAN.md §0.2`.
- Unlock condition: Docker is running and `docker info` succeeds.
- Stop immediately if a command resolves to a linked remote Supabase project.

Load, in order, before any repair: project `supabase`, project
`supabase-postgres-best-practices`, project `backend-patterns`, then plugin
`plug-supabase`, plugin `plug-supabase-pg`, and `context7-mcp` only for an API or
CLI behavior that remains uncertain after `npx supabase <command> --help`.

## 3.1 Outcomes and non-goals

This phase proves that the existing database foundation can be rebuilt from an
empty local database and that all schema, tenant-integrity, RLS, immutability,
seed, and type-generation checks pass.

Existing implementation inventory:

- Seven forward migrations in `supabase/migrations/`.
- Nineteen public tables, eight lifecycle enums, private authorization helpers,
  RLS/grants, tenant FKs/checks, indexes, and immutability triggers.
- `supabase/seed.sql` with synthetic local data.
- Four pgTAP files declaring 230 assertions under `supabase/tests/`.
- Generated types at `src/lib/supabase/database.types.ts`.
- Guarded local/remote scripts in `scripts/` and matching `package.json` scripts.

Non-goals:

- Do not add Phase 5–8 business RPCs.
- Do not edit already-applied migration files merely to make a failing assertion
  pass. Create a forward repair migration with `npm run db:migrate -- <name>`.
- Do not link, push, reset, seed, or query a remote project.
- Do not hand-edit `src/lib/supabase/database.types.ts`.

Authoritative contracts: `PLAN.md §§8, 10, 12, 23, 24, 32`.

## 3.2 File change manifest

| Action | Path | Rule |
| --- | --- | --- |
| VERIFY | `supabase/migrations/*.sql` | Existing migrations are historical source of truth. |
| VERIFY | `supabase/tests/00001_schema_integrity.sql` | Schema, grants, and baseline assertions. |
| VERIFY | `supabase/tests/00002_rls_matrix.sql` | Identity/role/location/verb isolation. |
| VERIFY | `supabase/tests/00003_operational_invariants.sql` | Occupancy, immutability, and integrity invariants. |
| VERIFY | `supabase/tests/00004_tenant_actor_integrity.sql` | Tenant/actor composite integrity. |
| VERIFY | `supabase/seed.sql` | Idempotent synthetic local seed only. |
| VERIFY | `supabase/config.toml` | Local-only configuration; public signup policy is completed in Phase 4. |
| GENERATE | `src/lib/supabase/database.types.ts` | Run `npm run db:types`; never hand-edit. |
| CREATE IF REQUIRED | `supabase/migrations/<CLI-generated>_phase3_gate_repair.sql` | Only for a validated forward repair. Record the actual CLI-generated path. |
| MODIFY IF REQUIRED | `supabase/tests/*.sql`, `supabase/seed.sql`, `scripts/*.mjs` | Only when the gate exposes a real defect; never weaken a correct assertion. |
| FORBIDDEN | `.env`, `.env.local`, remote project state, Phase 5+ files | Do not print secrets or broaden scope. |

## 3.3 Ordered execution

### Step 3.1 — Local engine preflight

Run:

```powershell
docker info
npx supabase --version
npx supabase status
```

Expected: Docker reports a server; the repository-pinned Supabase CLI reports a
version; status is either stopped locally or lists only local services. If Docker
is unavailable, keep Phase 3 `BLOCKED` and stop. If a remote link is detected,
stop and unlink only after explicit human approval.

<!-- STEP 3.1 END — verify the stated result before continuing. -->

### Step 3.2 — Start and rebuild the local database

Run exactly:

```powershell
npm run db:start
npm run db:reset
```

Expected: all migrations apply in order, the synthetic seed completes, and the
command exits 0. On failure, record the first failing migration and exact error.
Do not skip forward.

<!-- STEP 3.2 END — verify the stated result before continuing. -->

### Step 3.3 — Run database and RLS tests

Run:

```powershell
npm run db:test
```

Expected: all four pgTAP files pass all 230 declared assertions with no plan
mismatch, skipped assertion, or unexpected database error.

If a test exposes a real defect, first add or tighten the failing assertion, then
create a repair migration through:

```powershell
npm run db:migrate -- phase3_gate_repair
```

Record the generated filename. Apply the smallest forward fix, rerun Steps 3.2
and 3.3, and retain the regression assertion.

<!-- STEP 3.3 END — verify the stated result before continuing. -->

### Step 3.4 — Regenerate and compare database types

Run:

```powershell
npm run db:types
git diff -- src/lib/supabase/database.types.ts
```

Expected: generated types reflect the rebuilt local schema. Any diff is reviewed
and committed only if it corresponds to an intentional migration; unexplained
drift blocks completion.

<!-- STEP 3.4 END — verify the stated result before continuing. -->

### Step 3.5 — Application compatibility

Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

Expected: every command exits 0; the build uses only documented non-secret local
configuration; no whitespace error is reported.

<!-- STEP 3.5 END — verify the stated result before continuing. -->

## 3.4 Phase gate and completion record

All conditions are mandatory:

- [ ] Docker and local Supabase preflight passed.
- [ ] Clean reset and synthetic seed passed from an empty local database.
- [ ] All 230 pgTAP assertions passed.
- [ ] Generated type drift is explained or absent.
- [ ] Typecheck, lint, unit tests, production build, and `git diff --check` passed.
- [ ] No remote database operation occurred.
- [ ] Any privileged helper retains fixed empty `search_path`, qualified objects,
      revoked public execution, and tested narrow grants.

Append date, SHA, versions, migrations, commands/exit codes, pgTAP count, and
artifacts to `contexts/plans/evidence/phase-03.md` using the evidence contract.
Then link the successful attempt from `PLAN.md §0.2`, set Phase 3 `COMPLETE`, set
Phase 4 `ACTIVE`, point `ACTIVE_PLAYBOOK` to Phase 4, and stop.

> **END OF PHASE 3 — STOP.**
> Phase 3 is not complete until every gate result is recorded. Do not begin Phase
> 4 implementation or verification automatically.

<!-- ============================================================
PHASE 3 END — HARD STOP
Return a gate evidence summary and wait for the next execution run.
============================================================ -->
