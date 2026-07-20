# Phase 12 — Security Hardening

<!-- ============================================================
PHASE 12 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 12 and Phase 11 is COMPLETE.
============================================================ -->

## 12.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: PARTIAL` because nonce CSP, baseline
  headers, safe redirects, default-deny writes, RLS, and immutable evidence exist.
- Load project `security-review`, `supabase-postgres-best-practices`; plugins
  `plug-supabase-pg`, `c-security-review`; load `context7-mcp` before uncertain
  framework/security APIs.
- Dependencies: full MVP surface from Phases 4–11.
- A found critical issue stops normal work: contain locally, do not expose details,
  fix before proceeding, and rotate only real exposed credentials with human
  coordination. Never rewrite Git history without explicit approval.

## 12.1 Delivered security controls

Complete strict headers/CSP, same-origin Origin/Host/CSRF controls, body/query
bounds, CORS denial, database-backed operation throttles, Auth abuse policy,
admin/approver MFA enforcement for pilot, device register/revoke/lost-device
response, session revocation, structured redacted logging, safe health endpoint,
dependency/secret/SAST/bundle/history scans, full grants/RLS/function review, and
security/incident evidence.

Authoritative contracts: `DEVICE-001`, `PLAN.md §§11, 12, 13, 16, 21, 22, 23,
25, 27, 32, 33`.

## 12.2 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `supabase/tests/00017_security_hardening.sql` | Grants/search-path/rate/device/MFA authorization tests. |
| CREATE | `supabase/migrations/<CLI-generated>_phase12_security_hardening.sql` | Rate/device/security helpers and narrow grants. |
| MODIFY | `src/proxy.ts` | Nonce/header/origin protection using Next 16 proxy architecture. |
| MODIFY | `next.config.ts` | Static security headers only where appropriate. |
| CREATE | `src/lib/security/origin.ts` | Allowlisted Origin/Host validation. |
| CREATE | `src/lib/security/csrf.ts` | Cookie-mutation CSRF contract where required. |
| CREATE | `src/lib/security/rate-limit.ts` | Web IP/device/user layer plus RPC bucket mapping. |
| CREATE | `src/lib/security/redact.ts` | Central sensitive-field redaction. |
| CREATE | `src/lib/observability/logger.ts` | Structured safe logs/correlation/release. |
| CREATE | `src/lib/observability/health.ts` | Least-privilege dependency health. |
| CREATE | `src/app/api/health/route.ts` | No-secret health/release response. |
| CREATE | `src/features/devices/schemas.ts`, `service.ts`, `actions.ts` | Register/name/revoke device workflows. |
| CREATE | `src/app/(protected)/admin/settings/security/page.tsx` | MFA/device/session security UI. |
| MODIFY | Auth guards/actions and sensitive mutations | Enforce MFA/device/origin/rate policy. |
| CREATE | `tests/unit/security-headers.test.ts`, `origin-csrf.test.ts`, `redact.test.ts` | Security boundary tests. |
| CREATE | `tests/integration/security-matrix.test.ts` | Auth/RLS/RPC/rate/device tests. |
| CREATE | `tests/e2e/security-flows.spec.ts` | MFA/device/session/origin negative flows. |
| CREATE | `docs/security/threat-model.md` | Final surface-specific model and residual risks. |
| CREATE | `docs/security/security-review.md` | Tool commands, findings, disposition, evidence. |
| CREATE | `docs/operations/lost-device.md` | Revoke/disable/investigate/recover runbook. |
| CREATE | `docs/operations/incident-response.md` | Contain/preserve/classify/recover process. |
| GENERATE | `src/lib/supabase/database.types.ts` | Never hand-edit. |
| FORBIDDEN | `src/middleware.ts`, permissive CORS, in-memory-only rate authority, secrets in docs | Use `src/proxy.ts`; stop on violations. |

## 12.3 TDD and review steps

### Step 12.1 — RED security matrix

Write tests for every exposed table/verb/role/location, privileged function fixed
search path and execute grants, self-elevation, token/hash omission, rate bucket
atomicity, device revoke, MFA-required approvals, audit immutability, and direct
Data API attempts.

```powershell
npm run db:reset
npm run db:test
```

Expected RED only for missing Phase 12 controls.

### Step 12.2 — GREEN database and generated types

```powershell
npm run db:migrate -- phase12_security_hardening
npm run db:reset
npm run db:test
npm run db:types
```

Expected: entire database security matrix passes.

### Step 12.3 — RED/GREEN web security boundaries

Write tests first for CSP/nonce, HSTS in HTTPS environments, `nosniff`, frame,
referrer/camera policy, rejected Origin/Host/CSRF, CORS, request bounds, generic
errors, log redaction, health output, rate limits, session/device revoke, and MFA.

```powershell
npx vitest run tests/unit/security-headers.test.ts tests/unit/origin-csrf.test.ts tests/unit/redact.test.ts tests/integration/security-matrix.test.ts
```

Expected: all targeted cases pass after minimal controls.

### Step 12.4 — Evidence-backed security review

Use the loaded security-review skills. Record exact installed tool versions and
commands before running them; do not invent a scanner name or claim a clean scan
from `npm audit` alone. At minimum inspect dependency advisories, committed and
working-tree secrets, built client assets, Git history, unsafe HTML/dynamic SQL,
public function execution, CSP, and error/log samples. Store only redacted results
in `docs/security/security-review.md`.

```powershell
npm audit
rg -n "dangerouslySetInnerHTML|service_role|SUPABASE_SERVICE_ROLE_KEY|qr_token|console\.(log|error)" src supabase scripts tests
npm run build
git diff --check
```

Expected: every hit is reviewed; no unresolved critical/high finding or secret in
the client bundle/history/log evidence.

### Step 12.5 — Browser and runbook rehearsal

```powershell
npm run test:e2e -- tests/e2e/security-flows.spec.ts
```

Verify rejected cross-origin mutation, MFA gating, revoked device/session, generic
scan/auth errors, CSP enforcement, and run the lost-device/incident tabletop.

Expected: browser tests exit 0 across the configured projects; the evidence record
links the completed lost-device and local incident-tabletop results with no
unresolved critical/high action.

## 12.4 Gate and handoff

```powershell
npm run db:reset
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/security-flows.spec.ts
git diff --check
```

Every Phase 12-owned `PLAN.md §21` checklist item must link to evidence. Require
≥80% all coverage metrics, complete DB/browser matrix, practiced lost-device and
local incident-response tabletop, no secret exposure, and zero unresolved
critical/high finding. The Phase 14-labeled backup/restore/rollback/continuity
item is explicitly not a Phase 12 gate.

Append findings/disposition/tool versions and the required attempt to
`contexts/plans/evidence/phase-12.md`, link its successful anchor from §0.2, set
Phase 12 complete and Phase 13 active, update the playbook, and stop.

> **END OF PHASE 12 — STOP.** Do not build CI/release evidence automatically.

<!-- ============================================================
PHASE 12 END — HARD STOP
============================================================ -->
