# ADR 0000 — Master Plan Size Exception and Phase Playbook Split

- Status: Accepted
- Date: 2026-07-20
- Scope: planning documentation only

## Context

`PLAN.md` is the existing product, architecture, security, data, operations, and
acceptance source of truth. It already exceeds the normal 800-line file cap.
Putting deterministic Composer instructions for thirteen phases into the same file
would make active-phase focus worse and expand the exception further.

## Decision

Keep `PLAN.md` as the master specification and concise execution pointer. Store
bounded Phase 3–15 Composer playbooks under `contexts/plans/phases/`, each below
400 lines. Store append-only gate evidence under `contexts/plans/evidence/`.
Composer reads `AGENTS.md`, `PLAN.md §0`, the selected active playbook, and only
the contract sections linked by that playbook.

The archived Phase 2 recipe remains outside `§0` as Appendix A for historical
traceability and is explicitly non-executable.

## Consequences

- The master specification retains an explicit documentation-only size exception.
- Executable instructions remain small, phase-locked, and independently reviewable.
- Future implementation detail goes in the owning playbook or normal project docs,
  not as another large embedded phase section in `PLAN.md`.
- If the master specification is later split, link stability and requirement IDs
  must be preserved through a separate reviewed documentation change.
