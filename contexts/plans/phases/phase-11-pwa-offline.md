# Phase 11 — Installable PWA and Read-Only Offline States

<!-- ============================================================
PHASE 11 START — EXECUTION LOCK
Run only when PLAN.md §0.2 declares CURRENT_PHASE: 11 and Phase 10 is COMPLETE.
============================================================ -->

## 11.0 Execution guard

- `STATUS: PENDING`; `IMPLEMENTATION_STATE: NOT_STARTED`.
- Load project `frontend-patterns`, `supabase`; plugins `v-runtime-cache`,
  `v-next-cache-components`; load `context7-mcp` before choosing PWA tooling.
- Dependency: stable routes/data classifications from Phases 5–10.
- No offline mutation outbox, background entry/payment/exit, cached fee authority,
  or caching of Auth, QR, payment, receipt, admin, report, or audit payloads.

## 11.1 Required tooling decision

Before code, verify current Next.js 16.2.10 support from official documentation
for candidate PWA tooling. Record the chosen package/version/build integration in
`docs/adr/0001-pwa-tooling.md`. If no maintained compatible tool is verified, stop
the phase and request an architecture decision; do not copy a stale service-worker
recipe or invent APIs.

## 11.2 Delivered features

Deliver manifest, approved standard/maskable 192/512 icons, scoped service worker,
offline page/shell, explicit sanitized read-cache schema, connectivity health,
cache-age/stale labels, all mutation controls disabled offline, install guidance,
controlled update prompt, cache migration/clear, and logout/account/location clear.

Authoritative contracts: `PWA-001`, `OFFLINE-001`, `PLAN.md §§18, 20, 21, 23,
24, 32`.

## 11.3 File change manifest

| Action | Exact path | Purpose |
| --- | --- | --- |
| CREATE | `docs/adr/0001-pwa-tooling.md` | Verified package/version/API, alternatives, rollback. |
| MODIFY | `package.json`, `package-lock.json`, `next.config.ts` | Only verified PWA integration. |
| CREATE | `src/app/manifest.ts` | Typed application manifest. |
| CREATE | `public/icons/icon-192.png`, `icon-512.png` | Approved standard icons. |
| CREATE | `public/icons/icon-maskable-192.png`, `icon-maskable-512.png` | Maskable icons. |
| CREATE OR GENERATE | `public/sw.js` | Follow ADR generation rule; never hand-edit generated output. |
| CREATE | `public/offline.html` | Static non-sensitive fallback. |
| CREATE | `src/lib/offline/cache-schema.ts` | Versioned allowlisted IndexedDB records. |
| CREATE | `src/lib/offline/cache-store.ts` | Scoped read/write/clear/migrate operations. |
| CREATE | `src/lib/pwa/service-worker.ts` | Register/update lifecycle. |
| CREATE | `src/hooks/use-connectivity.ts` or MODIFY existing | Browser plus health status. |
| CREATE | `src/hooks/use-install-prompt.ts` | Install lifecycle without assumptions. |
| CREATE | `src/components/shared/connectivity-banner.tsx` | Offline/stale/reconnect UI. |
| CREATE | `src/components/shared/update-prompt.tsx` | Nonblocking controlled activation. |
| CREATE | `src/app/(protected)/offline/page.tsx` | Cached read-only explanation. |
| MODIFY | Auth sign-out and provider/query cleanup modules | Clear SW/IndexedDB/query/camera state. |
| CREATE | `tests/unit/cache-policy.test.ts`, `connectivity.test.tsx` | Allow/deny/clear/update tests. |
| CREATE | `tests/integration/offline-gates.test.ts` | Mutation prohibition/cache scopes. |
| CREATE | `tests/e2e/pwa-offline.spec.ts` | Install/update/offline/logout flows. |
| FORBIDDEN | Mutation response caches, transaction outbox, background sync writes | Failing condition. |

## 11.4 TDD execution steps

### Step 11.1 — RED manifest/cache policy

Write tests first for manifest fields/icons/scope, allowlisted static assets and
sanitized reference records, required location/user/fetched/expiry/schema fields,
forbidden URL/body classes, logout/location/version clearing, and mutation gate.

```powershell
npx vitest run tests/unit/cache-policy.test.ts tests/integration/offline-gates.test.ts
```

Expected RED: missing PWA/cache modules only.

### Step 11.2 — GREEN install/build integration

Complete the ADR, install only the verified pinned package, implement manifest,
icons, service-worker generation/registration, offline fallback, and conservative
cache allowlist. Never cache responses by broad URL pattern.

```powershell
npm run build
```

Expected: build exits 0 and emits/registers the service worker according to ADR.

### Step 11.3 — GREEN read cache and mutation gates

Implement versioned cache store, expiry, user/location binding, health-based
connectivity, stale labels, write-control disablement, and safe retry guidance.

```powershell
npx vitest run tests/unit/cache-policy.test.ts tests/unit/connectivity.test.tsx tests/integration/offline-gates.test.ts
```

Expected: all cache/gate tests pass.

### Step 11.4 — Install/update/offline E2E

Test first install, reload, waiting update, critical-form deferral, incompatible
cache clear, offline shell, sanitized recent reads, every mutation disabled,
network restoration, logout, account/location change, and browser cache inspection.

```powershell
npm run test:e2e -- tests/e2e/pwa-offline.spec.ts
```

Expected: supported browser cases pass; unsupported install UI degrades clearly.

## 11.5 Gate and handoff

```powershell
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e -- tests/e2e/pwa-offline.spec.ts
git diff --check
```

Manually inspect Application/Storage during E2E evidence: no Auth/cookie/JWT, raw
QR, payment/receipt, permission/admin, report/audit, mutation POST, or outbox data.
Require ≥80% all coverage metrics, valid manifest/icons/scope, install/update/
offline/clear pass, all offline write controls blocked, and no critical/high finding.

Append ADR/tool version and the required attempt to
`contexts/plans/evidence/phase-11.md`, link its successful anchor from §0.2, set
Phase 11 complete and Phase 12 active, update the playbook, and stop.

> **END OF PHASE 11 — STOP.** Do not start hardening automatically.

<!-- ============================================================
PHASE 11 END — HARD STOP
============================================================ -->
