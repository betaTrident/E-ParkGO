# Phase 14 — Staging, Deployment, and Pilot

<!-- ============================================================
PHASE 14 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 14 and Phase 13 is COMPLETE.
External state changes require the named human approval checkpoints below.
============================================================ -->

## 14.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: NOT_STARTED`.
- Load project `deployment-patterns`, `supabase`, `docker-patterns`; plugins
  `v-deployments-cicd`, `v-vercel-cli`, `v-vercel-agent`, `v-verification`,
  `sp-finish-branch`, `c-split-prs`.
- Dependency: complete green Phase 13 local and authorized CI evidence.
- Do not create/link projects, configure billing/domains/secrets/Auth, change
  GitHub protection, push migrations, deploy, invite real users, restore data, or
  send operational messages without explicit human approval at that checkpoint.
- Never use production data in preview/staging or demo seed in production.

## 14.1 Delivered release readiness

Deliver repository deployment automation, explicit environment matrix, staging
migration and smoke, monitoring/alerts, encrypted backup and isolated restore,
rollback and downtime-continuity rehearsal, real-device printer/camera checks,
staff UAT/training, limited pilot evidence, and a signed production go/no-go
record. Production deployment happens only if separately approved.

Phase 14 requires draft runbooks sufficient to operate the staging/pilot. Phase
15 finalizes/validates the complete handover and closes full `§33`; this removes
the former circular dependency.

Authoritative contracts: `PLAN.md §§24, 25, 26, 27, 31, 32, 33`.

## 14.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `.github/workflows/deploy-staging.yml` | Protected staging promotion and smoke. |
| CREATE | `.github/workflows/deploy-production.yml` | Manual production approval gate; no automatic DB rollback. |
| MODIFY | `package.json`, `package-lock.json` | Pin the documented Vercel CLI/deployment tooling used by workflows; Supabase stays repository-pinned. |
| CREATE | `scripts/verify-environment.mjs` | Ownership/schema/URL check without printing values. |
| CREATE | `scripts/smoke-test.mjs` | Safe health/Auth/core-flow smoke against named target. |
| CREATE | `scripts/promote-staging.mjs` | Approval/target/SHA-guarded staging migration and deployment orchestrator with dry-run/execute modes. |
| CREATE | `scripts/revoke-bootstrap-admin.mjs` | Target-guarded removal/disable verification for bootstrap authority. |
| CREATE | `scripts/backup-logical.ps1` | Explicit target, encrypted output, hash manifest, no Git artifact. |
| CREATE | `scripts/verify-restore.ps1` | Explicit isolated target and invariant checks. |
| CREATE | `playwright.staging.config.ts` | Approved staging base URL, no local web server, full release projects. |
| CREATE | `tests/unit/deployment-safety.test.ts` | Approval missing/placeholder, target mismatch, production denial, redaction, path safety, bootstrap-removal tests. |
| CREATE | `docs/operations/environment-matrix.md` | Local/preview/staging/production ownership. |
| CREATE | `docs/operations/deployment.md` | Migration → Edge if any → web → smoke order. |
| CREATE | `docs/operations/rollback.md` | Schema-compatible app rollback/forward-fix rules. |
| CREATE | `docs/operations/backup-restore.md` | Backup, hash, retention, isolated restore. |
| CREATE | `docs/operations/downtime-continuity.md` | Pause writes, paper log, audited reconciliation. |
| CREATE | `docs/operations/monitoring-alerts.md` | Metrics, thresholds, owners, test procedure. |
| CREATE | `docs/operations/pilot-uat.md` | Roles, scripts, devices, acceptance, defects. |
| CREATE | `docs/operations/go-live-checklist.md` | Human approvals and production checklist. |
| CREATE | `docs/operations/release-record.md` | SHA, migration IDs, environments, evidence, approvers. |
| MODIFY | `.env.example` | Only new documented variable names with ownership comments. |
| MODIFY | `README.md` | Link staging/operator docs without secrets. |
| FORBIDDEN | `.env*` secrets, dumps, real PII, automatic production migration, destructive rollback | Stop and escalate. |

## 14.3 Approval-gated execution

### Step 14.1 — Repository-only deployment preparation

Write scripts/workflows/docs with target allowlists, confirmation-free CI behavior,
secret redaction, compatibility checks, timeouts, and rollback stop conditions.

```powershell
npx vitest run tests/unit/deployment-safety.test.ts
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

Expected: unit tests and repository checks exit 0. The deployment-safety tests are
the sole pre-approval negative proof and assert nonzero rejection for missing/
placeholder approval, target-ID/SHA mismatch, production target, unsafe backup
destination, non-isolated restore, secret output, and incomplete bootstrap-removal
plan without contacting staging or production.

### Step 14.2 — Human approval: provision/link staging

Required approval must name staging Supabase/Vercel targets, owners, budget/tier,
domain, Auth URLs, secret owners, data classification, and whether CLI login/link
is authorized. After approval, verify target IDs before every action; apply
migrations only to staging, never production.

Record URLs without tokens, project references, approver, timestamp, and current
migration list in `release-record.md`.

```powershell
$recordPath = "docs/operations/release-record.md"
if (-not (Test-Path -LiteralPath $recordPath)) { throw "Missing release record" }
$record = Get-Content -LiteralPath $recordPath -Raw
$required = @(
  '(?m)^Approval status: APPROVED\s*$',
  '(?m)^Approver name: \S.+$',
  '(?m)^Approver role: \S.+$',
  '(?m)^Approval date: \d{4}-\d{2}-\d{2}\s*$',
  '(?m)^Release SHA: [0-9a-fA-F]{40}\s*$',
  '(?m)^Staging Supabase target ID: \S.+$',
  '(?m)^Staging Vercel target ID: \S.+$',
  '(?m)^Migration IDs: \S.+$'
)
$missing = $required | Where-Object { $record -notmatch $_ }
if ($missing -or $record -match '(?im)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw "Incomplete or placeholder approval record: $($missing -join ', ')" }
node scripts/verify-environment.mjs --target staging --approval-record $recordPath --preflight
node scripts/promote-staging.mjs --approval-record $recordPath --dry-run
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/backup-logical.ps1 -Target staging -ApprovalRecord $recordPath -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-restore.ps1 -Target restore-rehearsal -ApprovalRecord $recordPath -DryRun
```

Expected: assertions, target guards, and all post-approval dry runs exit 0; the
audited SHA and both target IDs match the approved record/environment, no secret
value is printed, and dry runs list exact repository-pinned deploy/backup/restore
operations. This check does not authorize execution by itself.

### Step 14.3 — Staging gate

Apply clean migrations, approved synthetic fixtures only, bootstrap test admin,
disable public signup, configure MFA/redirects/grants/Realtime, deploy, then run
full release suite and smoke. Remove bootstrap authority after verification.

Expected: staging parity, RLS/secret bundle checks, all critical flows, monitoring
and alert tests pass. Any failure stops promotion.

```powershell
node scripts/promote-staging.mjs --approval-record docs/operations/release-record.md --execute
node scripts/revoke-bootstrap-admin.mjs --target staging --approval-record docs/operations/release-record.md --execute
node scripts/verify-environment.mjs --target staging --approval-record docs/operations/release-record.md --post-deploy
npx playwright test --config playwright.staging.config.ts
node scripts/smoke-test.mjs --target staging --approval-record docs/operations/release-record.md
```

Expected after human approval: the orchestrator rechecks target IDs and SHA before
each mutation, applies only pending forward migrations, configures the documented
staging Auth/Realtime settings, dispatches/records the protected staging deploy,
removes bootstrap authority, and every post-deploy/full-release/smoke command exits
0. Never replace `staging` with production in this step. Store workflow/run IDs
and exact command exits in Phase 14 evidence.

### Step 14.4 — Backup, restore, rollback, and continuity rehearsal

Create encrypted logical export outside Git, hash it, restore to an explicitly
named isolated nonproduction target, verify rows/FKs/invariants/RLS/totals and one
full flow. Rehearse schema-compatible web rollback and paper-continuity/
reconciliation without altering production.

Record measured RPO/RTO, restore/rollback durations, evidence locations, owners,
and defects. A failed restore blocks pilot and production.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/backup-logical.ps1 -Target staging -ApprovalRecord docs/operations/release-record.md -Execute
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-restore.ps1 -Target restore-rehearsal -ApprovalRecord docs/operations/release-record.md -Execute
$record = Get-Content -LiteralPath "docs/operations/release-record.md" -Raw
$required = @(
  '(?m)^Measured RPO: \d+(?:\.\d+)? (?:minutes|hours)\s*$',
  '(?m)^Measured RTO: \d+(?:\.\d+)? (?:minutes|hours)\s*$',
  '(?m)^Restore target ID: \S.+$',
  '(?m)^Restore result: PASS\s*$',
  '(?m)^Rollback result: PASS\s*$',
  '(?m)^Continuity result: PASS\s*$',
  '(?m)^Reconciliation result: PASS\s*$'
)
$missing = $required | Where-Object { $record -notmatch $_ }
if ($missing -or $record -match '(?im)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw "Incomplete rehearsal evidence: $($missing -join ', ')" }
```

Expected: verified nonproduction rehearsal evidence and measurements are present;
no dump or secret is stored in the repository.

### Step 14.5 — UAT, real devices, and limited pilot

Use approved printers, representative Android/iOS camera devices, supported
desktop browsers, network interruption, accessibility, staff roles, peak-like
workload, and training scripts. Record issues; critical/high or integrity defects
return to the owning earlier phase and repeat dependent gates.

```powershell
$uatPath = "docs/operations/pilot-uat.md"
if (-not (Test-Path -LiteralPath $uatPath)) { throw "Missing pilot UAT record" }
$uat = Get-Content -LiteralPath $uatPath -Raw
$required = @(
  '(?m)^Camera result: PASS\s*$',
  '(?m)^Printer result: PASS\s*$',
  '(?m)^Accessibility result: PASS\s*$',
  '(?m)^Training result: PASS\s*$',
  '(?m)^Defect disposition: \S.+$',
  '(?m)^Reviewer: \S.+$',
  '(?m)^Review date: \d{4}-\d{2}-\d{2}\s*$'
)
$missing = $required | Where-Object { $uat -notmatch $_ }
if ($missing -or $uat -match '(?im)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw "Incomplete UAT evidence: $($missing -join ', ')" }
```

Expected: device/UAT/training results and defect disposition are recorded.

### Step 14.6 — Human approval: production go/no-go

Present the Phase 14 evidence bundle. Production provisioning/migration/deploy is
a separate explicit approval. A `GO` record names product, security, QA,
operations, release owner, window, continuity plan, backup, and rollback decision.
Without it, Phase 14 may be staging/pilot complete but production remains not
authorized.

```powershell
$goLivePath = "docs/operations/go-live-checklist.md"
if (-not (Test-Path -LiteralPath $goLivePath)) { throw "Missing go-live decision" }
$goLive = Get-Content -LiteralPath $goLivePath -Raw
if ($goLive -notmatch '(?m)^Decision: (GO|NO-GO)$') { throw "Missing exact GO or NO-GO decision" }
$required = @(
  '(?m)^Decision date: \d{4}-\d{2}-\d{2}\s*$',
  '(?m)^Release SHA: [0-9a-fA-F]{40}\s*$',
  '(?m)^Product approver: \S.+$',
  '(?m)^Security approver: \S.+$',
  '(?m)^QA approver: \S.+$',
  '(?m)^Operations approver: \S.+$',
  '(?m)^Release owner: \S.+$',
  '(?m)^Deployment window: \S.+$',
  '(?m)^Backup evidence: \S.+$',
  '(?m)^Rollback evidence: \S.+$',
  '(?m)^Continuity evidence: \S.+$'
)
$missing = $required | Where-Object { $goLive -notmatch $_ }
if ($missing -or $goLive -match '(?im)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw "Incomplete go-live decision: $($missing -join ', ')" }
```

Expected: the fail-closed check proves one exact named/dated decision with no
placeholders. `NO-GO` records Phase 14 evidence but cannot authorize production;
`GO` still requires a separate explicit user request before any production action.

## 14.4 Gate and handoff

Require:

- Phase 13 CI remains green at the release SHA.
- Staging clean migration, full suite, smoke, Auth/RLS/Realtime, and no-secret
  checks pass.
- Monitoring alerts fire; encrypted backup and isolated restore meet approved
  targets; rollback/continuity/reconciliation are rehearsed.
- Real-device camera/printer/browser/accessibility and UAT pass.
- Pilot load/cost/quota is measured; no free-tier SLA is claimed.
- Draft operational runbooks are usable for pilot.
- No unresolved critical/high defect or security finding.
- Named stakeholders sign the staging/pilot and production go/no-go status.

Final repository/evidence checks:

```powershell
npx vitest run tests/unit/deployment-safety.test.ts
node scripts/verify-environment.mjs --target staging --approval-record docs/operations/release-record.md --post-deploy
npx playwright test --config playwright.staging.config.ts
node scripts/smoke-test.mjs --target staging --approval-record docs/operations/release-record.md
git diff --check
```

All commands must exit 0. The successful evidence record must include each
target-guard/dry-run/execute command, workflow/run ID, target IDs, and exit code.

Append target-safe evidence, approvers, rehearsals, and deployment status to
`contexts/plans/evidence/phase-14.md`. Link its successful anchor from §0.2, set
Phase 14 complete and Phase 15 active, update the playbook, and stop. Do not claim
full MVP handover until Phase 15.

> **END OF PHASE 14 — STOP.** Do not finalize handover in this run.

<!-- ============================================================
PHASE 14 END — HARD STOP
============================================================ -->
