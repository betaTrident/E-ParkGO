# E-ParkGO Precision Operations UI/UX Program

> Status: design contract and Composer 2.5 execution controls integrated.
>
> This file is a durable index, not an execution authority or a duplicate design
> specification.

## Authoritative documents

- Visual and UX contract: `DESIGN.md`
- Current execution authority: `PLAN.md §0.2`
- Phase 10 reports/audit playbook:
  `contexts/plans/phases/phase-10-reports-audit.md`
- Phase 10A refinement playbook:
  `contexts/plans/phases/phase-10a-premium-ui-ux-refinement.md`
- Phase 10A exact file allowlist:
  `contexts/plans/phases/phase-10a-allowed-files.txt`
- Phase 10A evidence:
  `contexts/plans/evidence/phase-10a.md`
- Design-contract size decision:
  `docs/adr/0002-design-contract-size-exception.md`

## Locked sequence

1. Phase 10 remains active and builds transactions, reports, audit, and shift
   history using the Phase 10 compatibility subset of `DESIGN.md`.
2. A passed Phase 10 gate activates Phase 10A.
3. Phase 10A refines the full implemented UI without domain, database, API,
   authorization, money, timestamp, QR, payment, or release changes.
4. A passed Phase 10A gate activates Phase 11 PWA/offline work.

## Design direction

The locked direction is **Precision Operations UI**: planar, compact, calm,
premium, user-centered, lightly rounded, semantically colored, accessible,
truthful to live data, and optimized for sustained parking operations.

Composer must not use this index as permission to implement a pending phase.
