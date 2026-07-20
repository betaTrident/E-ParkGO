# Phase 5 — Facility, Spaces, and Rates

<!-- ============================================================
PHASE 5 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 5 and Phase 4 is COMPLETE.
============================================================ -->

## 5.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: NOT_STARTED`
- Working directory: `K:\E-ParkGO`.
- Dependencies: Phase 4 complete; local Supabase running; approved development
  location, zone/space, vehicle-type, and tariff fixtures recorded with
  approver/date in `contexts/plans/evidence/phase-05.md` before Step 5.1.
- Load project `backend-patterns`, `api-design`, `supabase`; plugins
  `v-vercel-functions`, `plug-supabase`, `sp-executing`; load `context7-mcp` for
  uncertain Next.js/Supabase APIs.
- Local-only database work. No remote push, destructive migration, production
  tariff, or real facility data is authorized.

## 5.1 Delivered features and exclusions

Deliver:

- Admin facility settings, zones, vehicle types, and space configuration.
- Staff/admin same-location space availability; admin out-of-service/deactivate
  flows; no deletion of historical references.
- Versioned rate drafts, preview, publish, retire, effective-date and overlap
  validation, immutable published versions, and audit evidence.
- Responsive `/spaces`, `/admin/rates`, and `/admin/settings` pages with loading,
  empty, error, conflict, and success states.

Exclude entry, ticket issuance, fee calculation, payment, Realtime, multi-branch
administration, and production tariff approval.

Authoritative contracts: `PLAN.md LOC-001`, `SPACE-001`, `RATE-001..002`,
`ADMIN-001`, `§§8, 10, 12, 15, 18, 22, 23, 32`.

PostgreSQL owns configuration mutations and publish immutability. Do not create a
generic CRUD repository that permits direct table writes.

## 5.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `supabase/tests/00006_configuration_rpcs.sql` | RED RPC, grant, audit, overlap, and immutability tests. |
| CREATE | `supabase/migrations/<CLI-generated>_phase5_configuration_rpcs.sql` | Facility/zone/type/space/rate RPCs. |
| CREATE | `src/features/facility/schemas.ts` | Strict settings/zone/type/space schemas. |
| CREATE | `src/features/facility/service.ts` | Server read/RPC adapter. |
| CREATE | `src/features/facility/actions.ts` | Admin Server Actions and safe error mapping. |
| CREATE | `src/features/facility/components/facility-settings-form.tsx` | Settings UI. |
| CREATE | `src/features/spaces/schemas.ts` | Space filters and admin mutation schemas. |
| CREATE | `src/features/spaces/service.ts` | Scoped space reads/RPC calls. |
| CREATE | `src/features/spaces/actions.ts` | Admin space actions. |
| CREATE | `src/components/spaces/space-board.tsx` | Accessible status list/grid. |
| CREATE | `src/components/spaces/space-editor.tsx` | Zone/type/space configuration. |
| CREATE | `src/features/rates/schemas.ts` | Strict draft/preview/publish schemas. |
| CREATE | `src/features/rates/service.ts` | Rate queries and RPC calls. |
| CREATE | `src/features/rates/actions.ts` | Draft/publish/retire actions. |
| CREATE | `src/features/rates/components/rate-editor.tsx` | Draft editor and preview. |
| CREATE | `src/features/rates/components/rate-version-list.tsx` | Effective version comparison. |
| CREATE | `src/app/(protected)/spaces/page.tsx` | Same-location space view. |
| CREATE | `src/app/(protected)/admin/rates/page.tsx` | Admin rate page. |
| CREATE | `src/app/(protected)/admin/settings/page.tsx` | Admin facility page. |
| CREATE | `src/app/api/spaces/route.ts` | Bounded scoped GET only if UI requires Route Handler. |
| CREATE | `src/app/api/rates/route.ts` | Scoped GET/draft boundary. |
| CREATE | `src/app/api/rates/[rateId]/publish/route.ts` | Publish boundary. |
| CREATE | `tests/unit/facility-schemas.test.ts` | Boundary tests. |
| CREATE | `tests/unit/rate-schemas.test.ts` | Decimal-string centavos, bigint conversion/bounds, mode, and date tests. |
| CREATE | `tests/integration/configuration.test.ts` | RPC-to-server boundary tests. |
| CREATE | `tests/e2e/configuration.spec.ts` | Mobile/desktop admin flows. |
| GENERATE | `src/lib/supabase/database.types.ts` | Run generator after reset; never hand-edit. |
| MODIFY | `src/app/(protected)/layout.tsx`, navigation components | Add authorized navigation only. |
| FORBIDDEN | Existing migrations; entry/payment files; direct table mutations | Stop if contracts require broader scope. |

If a listed API route is unnecessary because a Server Action supplies the exact
same boundary, record the decision in the phase completion record and do not
create a duplicate surface.

## 5.3 TDD execution steps

### Step 5.0 — Fail-closed product decision approval

```powershell
$decisionPath = 'contexts/plans/evidence/phase-05.md'
if (-not (Test-Path -LiteralPath $decisionPath)) { throw 'Missing Phase 5 decision approval' }
$decision = Get-Content -LiteralPath $decisionPath -Raw
$patterns = @(
  '(?m)^- Decision status: APPROVED\s*$',
  '(?m)^- Approver name: \S.+$',
  '(?m)^- Approver role: \S.+$',
  '(?m)^- Approval date: \d{4}-\d{2}-\d{2}\s*$',
  '(?m)^- Scope: PHASE_05_CONFIGURATION\s*$',
  '(?m)^- Fixture or vector version: \S.+$',
  '(?im)^- Decisions covered: .*location.*zone.*space.*vehicle type.*tariff.*$',
  '(?m)^- Production approval implied: NO\s*$'
)
$missing = $patterns | Where-Object { $decision -notmatch $_ }
if ($missing -or $decision -match '(?im)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw 'Invalid or incomplete Phase 5 approval' }
$source = [regex]::Match($decision, '(?m)^- Source artifact: (?<value>\S.+)$').Groups['value'].Value.Trim()
if (-not $source -or (($source -notmatch '^https://') -and -not (Test-Path -LiteralPath $source))) { throw 'Missing Phase 5 approval source artifact' }
```

Expected: the command exits 0 only for a non-placeholder, named, dated, scoped
approval whose source artifact exists. Any failure keeps Phase 5 blocked.

### Step 5.1 — RED database configuration contract

Write `00006_configuration_rpcs.sql` first. Assert caller/location/role checks,
unknown/invalid settings, duplicate codes, cross-location zone/type references,
historical deactivation, space status/version conflicts, rate mode consistency,
negative centavos/minutes, effective overlap including concurrent publish,
published-row immutability, audit rows, grants, and fixed search paths.

```powershell
npm run db:reset
npm run db:test
```

Expected RED: new function assertions fail; all prior assertions stay green.

### Step 5.2 — GREEN authoritative RPCs

```powershell
npm run db:migrate -- phase5_configuration_rpcs
```

Record the generated filename. Implement only named protected RPCs for facility
settings, zone/type lifecycle, space configuration/status, and rate
draft/preview/publish/retire. Use database time and bigint centavos; every
sensitive mutation appends an audit event.

```powershell
npm run db:reset
npm run db:test
npm run db:types
```

Expected: all database tests pass; generation exits 0.

### Step 5.3 — RED/GREEN web boundaries

Write the unit and integration tests before modules. Reject unknown fields,
client actor/location, numeric/decimal/signed/leading-junk centavos, out-of-policy
bounds, invalid UUIDs/dates, overlap conflicts, ordinary-staff mutations, and raw
database errors. Prove canonical decimal strings convert to internal `bigint` and
are emitted as strings. Implement minimal schemas, services, and Server
Actions/Route Handlers.

```powershell
npx vitest run tests/unit/facility-schemas.test.ts tests/unit/rate-schemas.test.ts tests/integration/configuration.test.ts
```

Expected: targeted tests pass after GREEN implementation.

### Step 5.4 — Responsive accessible UI

Use existing shadcn primitives. If a primitive is missing, add it only via
`npx shadcn@latest add <component>`. Implement keyboard-operable status board,
forms, comparison views, confirmations, focus restoration, field errors,
non-color states, 360px layout, and conflict refresh.

```powershell
npm run typecheck
npm run lint
npm run test:e2e -- tests/e2e/configuration.spec.ts
```

Expected: all commands exit 0 across configured browser projects.

## 5.4 Gate and handoff

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
npm run test:e2e -- tests/e2e/configuration.spec.ts
git diff --check
```

Gate: all commands exit 0; global four-metric coverage is at least 80%; immutable
publish/overlap race/location/grant/audit tests pass; mobile/admin/staff flows are
verified; no critical/high review finding; files remain under the project size
limits.

Append migration, commands/exits, test counts, coverage, browsers, fixture
decisions, and reviews to `contexts/plans/evidence/phase-05.md`. Link its successful
attempt from §0.2, set Phase 5 complete and Phase 6 active, update
`ACTIVE_PLAYBOOK`, and stop.

> **END OF PHASE 5 — STOP.** Do not begin Phase 6 automatically.

<!-- ============================================================
PHASE 5 END — HARD STOP
============================================================ -->
