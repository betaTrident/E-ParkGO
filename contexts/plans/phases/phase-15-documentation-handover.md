# Phase 15 — Documentation and Handover

<!-- ============================================================
PHASE 15 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 15 and Phase 14 is COMPLETE.
============================================================ -->

## 15.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: NOT_STARTED` except plan/design and
  draft Phase 12/14 security/operations documents.
- Load project `documentation-lookup`; plugin `context7-mcp` only when validating
  current external commands/APIs.
- Dependencies: release SHA, migration list, staging/pilot evidence, finalized
  environment/support owners, and Phase 14 gate.
- Documentation must describe actual repository behavior and exact safe commands;
  it cannot promise unimplemented features, guarantees, or secret values.

## 15.1 Delivered handover set

Finalize concise project overview, architecture, data dictionary, ADR index,
setup/environment/deploy/rollback/backup/restore/incident/continuity/reconciliation/
lost-device runbooks, staff operator guide, admin guide, troubleshooting by
correlation ID, monitoring/support escalation, training, decision register,
release record, and full `PLAN.md §33` acceptance evidence.

Completion is validated by a person unfamiliar with the implementation using the
documents without undocumented coaching.

Authoritative contracts: entire `PLAN.md`, especially `§§6–27, 32, 33`, actual
source/migrations/scripts, `DESIGN.md`, and `AGENTS.md`.

## 15.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| MODIFY | `README.md` | Real overview, status, prerequisites, local start/test, docs index. |
| CREATE | `docs/architecture/overview.md` | Runtime components/trust boundaries/data flow. |
| CREATE | `docs/architecture/data-dictionary.md` | Actual enums/tables/columns/ownership/invariants. |
| CREATE | `docs/architecture/api-rpc-contracts.md` | Actual routes/RPCs/envelopes/errors/idempotency. |
| CREATE | `docs/adr/README.md` | ADR index and status. |
| CREATE | `docs/adr/0002-postgresql-transaction-authority.md` | RPC authority and no generic mutation CRUD. |
| CREATE | `docs/adr/0003-online-only-authoritative-writes.md` | Offline/security decision. |
| CREATE | `docs/operations/local-development.md` | Safe local setup/reset/test/type generation. |
| MODIFY | `docs/operations/environment-matrix.md` | Final owners/variables/targets without values. |
| MODIFY | `docs/operations/deployment.md`, `rollback.md` | Verified commands and evidence links. |
| MODIFY | `docs/operations/backup-restore.md` | Verified backup/restore and targets. |
| MODIFY | `docs/operations/incident-response.md`, `lost-device.md` | Final owners/escalations. |
| MODIFY | `docs/operations/downtime-continuity.md` | Final paper log/reconciliation process. |
| MODIFY | `docs/operations/monitoring-alerts.md` | Final dashboards/thresholds/on-call owner. |
| CREATE | `docs/operations/operator-guide.md` | Shift → entry → ticket → scan → pay → exit. |
| CREATE | `docs/operations/admin-guide.md` | Staff, permissions, facility, rates, audit. |
| CREATE | `docs/operations/troubleshooting.md` | Safe symptoms/correlation/log/next action. |
| CREATE | `docs/operations/support-escalation.md` | Ownership, severity, communications. |
| CREATE | `docs/operations/training-checklist.md` | Role-based training and sign-off. |
| CREATE | `docs/decision-register.md` | Development vs pilot/production decisions and owners. |
| MODIFY | `docs/operations/release-record.md` | Final SHA/migrations/evidence/approvals. |
| CREATE | `docs/handover-checklist.md` | Independent dry-run results and final acceptance. |
| MODIFY | `PLAN.md §0.2 and §33` | Evidence-backed completion only. |
| FORBIDDEN | Secret values, production data/screenshots with PII, invented commands or owners | Stop and correct. |

## 15.3 Documentation and validation steps

### Step 15.1 — Repo-truth inventory

Compare docs against actual `package.json`, `.env.example`, routes, migrations,
RPCs, RLS/grants, tests, workflows, scripts, monitoring, and deployment records.
Remove stale Phase 2 historical commands from operator paths; never document
`next lint`, global Supabase CLI installs, or hand-editing generated types if the
repository no longer uses them.

```powershell
rg --files src supabase tests scripts .github docs
Get-Content package.json
```

Expected: every documented file/command has a real source or a clearly labeled
manual external step.

### Step 15.2 — Write architecture and operational guides

Use plain language plus exact paths/commands. Distinguish local/staging/
production, automated/manual, routine/emergency, safe/requires approval, and
development default/production-approved decision. Link instead of duplicating
large contracts.

```powershell
$requiredPaths = @(
  'README.md',
  'docs/architecture/overview.md',
  'docs/architecture/data-dictionary.md',
  'docs/architecture/api-rpc-contracts.md',
  'docs/adr/README.md',
  'docs/adr/0002-postgresql-transaction-authority.md',
  'docs/adr/0003-online-only-authoritative-writes.md',
  'docs/operations/local-development.md',
  'docs/operations/environment-matrix.md',
  'docs/operations/deployment.md',
  'docs/operations/rollback.md',
  'docs/operations/backup-restore.md',
  'docs/operations/incident-response.md',
  'docs/operations/lost-device.md',
  'docs/operations/downtime-continuity.md',
  'docs/operations/monitoring-alerts.md',
  'docs/operations/operator-guide.md',
  'docs/operations/admin-guide.md',
  'docs/operations/troubleshooting.md',
  'docs/operations/support-escalation.md',
  'docs/operations/training-checklist.md',
  'docs/operations/release-record.md',
  'docs/decision-register.md',
  'docs/handover-checklist.md'
)
$missingPaths = $requiredPaths | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missingPaths) { throw "Missing handover artifacts: $($missingPaths -join ', ')" }
git diff --check -- README.md docs
```

Expected: the command fails closed on any missing artifact; otherwise the
documentation change set has no whitespace error before link validation begins.

### Step 15.3 — Validate links and commands

Run every non-destructive local command from the docs on a clean checkout or
equivalent isolated environment. Check local Markdown links and referenced paths.
Use a documented link checker if already installed; otherwise use repository
inspection without introducing an unreviewed dependency merely for this phase.

At minimum verify:

```powershell
npm ci
npm run typecheck
npm run lint
npm run test:coverage
npm run db:start
npm run db:reset
npm run db:test
npm run build
git diff --check
```

Expected: commands match the documents and exit 0. External deployment/restore
commands are validated only against explicitly approved nonproduction targets.

### Step 15.4 — Independent handover dry run

An operator unfamiliar with the implementation must, using docs alone:

1. Configure a safe local environment and rebuild the database.
2. Run the quality/database/release commands.
3. Complete shift → entry → ticket → scan/manual fallback → preview → payment →
   exit and locate dashboard/report/audit evidence.
4. Diagnose a supplied safe failure using its correlation ID.
5. Explain and rehearse disable/revoke, downtime continuity, rollback, alert, and
   isolated restore procedures.

Record duration, questions, missing steps, failures, corrections, reviewer, and
final rerun in `docs/handover-checklist.md`. Undocumented coaching is a failure.

```powershell
$handoverPath = "docs/handover-checklist.md"
if (-not (Test-Path -LiteralPath $handoverPath)) { throw "Missing handover checklist" }
$handover = Get-Content -LiteralPath $handoverPath -Raw
$required = @(
  '(?m)^Reviewer name: \S.+$',
  '(?m)^Reviewer role: \S.+$',
  '(?m)^Started at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})\s*$',
  '(?m)^Duration: \d+(?:\.\d+)? (?:minutes|hours)\s*$',
  '(?m)^Undocumented coaching: NONE\s*$',
  '(?m)^Workflow result: PASS\s*$',
  '(?m)^Correlation diagnosis result: PASS\s*$',
  '(?m)^Restore rehearsal result: PASS\s*$',
  '(?m)^Final rerun result: PASS\s*$'
)
$missing = $required | Where-Object { $handover -notmatch $_ }
if ($missing -or $handover -match '(?im)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw "Incomplete handover evidence: $($missing -join ', ')" }
```

Expected: independent dry-run identity, measured results, corrections, and final
rerun are recorded.

### Step 15.5 — Final acceptance

Walk every `PLAN.md §33` checkbox and link it to current evidence. Do not check an
item based on planned behavior. Unmet acceptance returns to the owning phase and
requires dependent gate reruns.

```powershell
$planLines = Get-Content -LiteralPath "PLAN.md"
$sectionStartMatch = $planLines | Select-String -Pattern '^## 33\.' | Select-Object -First 1
$sectionEndMatch = $planLines | Select-String -Pattern '^## 34\.' | Select-Object -First 1
if (-not $sectionStartMatch -or -not $sectionEndMatch -or $sectionEndMatch.LineNumber -le $sectionStartMatch.LineNumber) { throw "Missing or invalid Section 33/34 boundaries" }
$section = $planLines[($sectionStartMatch.LineNumber - 1)..($sectionEndMatch.LineNumber - 2)]
$items = $section | Where-Object { $_ -match '^- \[[ xX]\]' }
if (-not $items) { throw "Section 33 has no checklist items" }
foreach ($item in $items) {
  if ($item -notmatch '^- \[[xX]\]') { throw "Unchecked acceptance item: $item" }
  if ($item -notmatch '— Evidence: .*\((?<target>contexts/plans/evidence/phase-\d{2}\.md)#(?<anchor>phase-\d{2}-attempt-[a-zA-Z0-9-]+)\)') { throw "Checked item lacks required anchored local evidence link: $item" }
  $target = $Matches.target
  $anchor = $Matches.anchor
  if (-not (Test-Path -LiteralPath $target)) { throw "Broken evidence path: $target" }
  $evidence = Get-Content -LiteralPath $target -Raw
  $anchorToken = '<a id="' + $anchor + '"></a>'
  $attemptStart = $evidence.IndexOf($anchorToken, [System.StringComparison]::Ordinal)
  if ($attemptStart -lt 0) { throw "Missing evidence anchor: $target#$anchor" }
  $nextAttempt = $evidence.IndexOf('<a id="', $attemptStart + $anchorToken.Length, [System.StringComparison]::Ordinal)
  $attempt = if ($nextAttempt -ge 0) { $evidence.Substring($attemptStart, $nextAttempt - $attemptStart) } else { $evidence.Substring($attemptStart) }
  if ($attempt -notmatch '(?m)^- Result: PASS\s*$') { throw "Evidence attempt is not PASS: $target#$anchor" }
  if ($attempt -notmatch '(?m)^- Result SHA: `?[0-9a-fA-F]{40}`?\s*(?:—.*)?$') { throw "Evidence attempt lacks a verified 40-character result SHA: $target#$anchor" }
  if ($item -match '(?i)\b(TBD|TODO|PLACEHOLDER)\b|<[^>]+>') { throw "Placeholder acceptance evidence: $item" }
}
```

Expected after final acceptance: the command exits 0 because no unchecked item
remains, every checked item uses the evidence format from
`contexts/plans/evidence/README.md`, every anchor exists, and the linked attempt is
`PASS` with a verified 40-character result SHA.

## 15.4 Final gate

Require all documented local commands and link/path checks pass; independent dry
run succeeds without undocumented guidance; architecture/data/API docs match the
release; runbooks name owners/approvals/recovery; no secrets/PII; Section 33 is
fully evidenced; stakeholders sign handover; no critical/high open issue.

Append final SHA, migrations, release status, evidence index, reviewers, support
owner, training, and acceptance date to `contexts/plans/evidence/phase-15.md`.
Link its successful anchor from §0.2, set Phase 15 and the MVP `COMPLETE`, and do
not automatically start post-MVP work.

> **END OF PHASE 15 — FINAL STOP.**
> The MVP plan is complete only after the evidence-backed handover gate. Any
> post-MVP capability requires a new approved plan and execution pointer.

<!-- ============================================================
PHASE 15 END — FINAL HARD STOP
Do not begin PLAN.md §34 roadmap work automatically.
============================================================ -->
