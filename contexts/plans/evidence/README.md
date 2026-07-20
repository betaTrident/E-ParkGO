# Phase Gate Evidence Contract

This directory is the append-only evidence surface for Composer phase gates.
`PLAN.md §0.2` remains the execution pointer; it links a successful phase record
but does not contain or replace detailed evidence.

## File naming

- One file per phase: `phase-03.md` through `phase-15.md`.
- Create the file on the first gate attempt.
- Append new attempts in chronological order. Never delete or rewrite a failed
  attempt; append a correction and a new attempt.
- Never store secrets, raw QR tokens/hashes, cookies/JWTs, passwords, dumps, real
  PII, or unredacted logs.

## Required attempt template

```markdown
<a id="phase-NN-attempt-yyyy-mm-ddthhmmss0800"></a>
## Attempt YYYY-MM-DDTHH:mm:ss+08:00

- Phase: NN — exact phase name
- Result: PASS | FAIL | BLOCKED
- Base SHA: <40-character commit SHA before execution>
- Result SHA: <40-character commit SHA containing the verified work, or UNCOMMITTED with reason>
- Environment: local | CI | staging | production-approved
- Target identifiers: <safe project/environment names or NONE; never tokens>
- Tool versions: Node, npm, Next.js, Supabase CLI/PostgreSQL, test/browser tools
- Migrations: <exact filenames or NONE>
- Commands: <exact command, exit code, test/assertion count, duration>
- Coverage: statements, branches, functions, lines, or NOT_APPLICABLE
- Browsers/devices: <projects and results, or NOT_APPLICABLE>
- Security/review findings: <IDs, severity, disposition, or NONE>
- Manual evidence and artifacts: <repo-relative paths and approved external URLs>
- Approvers: <name/role/date where required, or NOT_APPLICABLE>
- Known warnings/gaps: <explicit list or NONE>
- Next action: <exact status/pointer transition or blocker recovery>
```

Every `PASS` attempt must include all applicable command exit codes, counts, and
artifact paths from its playbook. A printed success message without exit code and
expected evidence is insufficient. `PLAN.md §0.2` may change the phase to
`COMPLETE` only after a `PASS` attempt exists and is linked from the status row.

## Pre-phase decision approval block

Phases 5, 7, and 8 require a human product decision before RED tests. Put this
block at the top of that phase's evidence file, before any attempts:

```markdown
## Decision approval

- Decision status: APPROVED
- Approver name: <nonblank human name>
- Approver role: <nonblank accountable role>
- Approval date: <YYYY-MM-DD>
- Scope: <PHASE_05_CONFIGURATION | PHASE_07_FEE_VECTORS | PHASE_08_CASH_EXCEPTIONS>
- Fixture or vector version: <nonblank immutable version/hash>
- Decisions covered: <comma-separated required decision IDs/names from the playbook>
- Source artifact: <existing repo-relative path or approved non-secret URL>
- Production approval implied: NO
```

The owning playbook validates this block with anchored, non-empty, type-aware
patterns and rejects placeholders. Approval is scoped only to the named phase and
does not authorize remote actions or production policy.

## Section 33 evidence format

At final acceptance, every checked `PLAN.md §33` item must end with:

```markdown
— Evidence: [phase-NN gate](contexts/plans/evidence/phase-NN.md#phase-NN-attempt-yyyy-mm-ddthhmmss0800)
```

Multiple links are allowed. Local links must resolve to existing repository files;
external URLs must be approved non-secret evidence locations. A checked item with
no `— Evidence:` link is incomplete.
