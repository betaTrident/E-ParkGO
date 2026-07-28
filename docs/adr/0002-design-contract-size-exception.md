# ADR 0002 — Design Contract Size Exception

- Status: Accepted
- Date: 2026-07-29
- Scope: `DESIGN.md` documentation only

## Context

`DESIGN.md` is the single authoritative visual and UX contract for public,
authentication, operational, administrative, print, error, and deferred system
surfaces. It must keep route ownership, cross-page foundations, accessibility,
security, responsive behavior, state language, and page blueprints together so
Composer does not invent or reconcile conflicting design rules.

The complete contract exceeds the preferred 200–400-line file target but remains
below the 800-line hard cap. Splitting route blueprints from the shared rules
would add cross-file precedence and increase drift risk. Executable instructions
remain in the much smaller Phase 10A playbook.

## Decision

Allow `DESIGN.md` a documentation-only exception above 400 lines while requiring
it to remain below 800 lines. Keep implementation commands, exact file manifests,
step gates, and evidence handoffs in
`contexts/plans/phases/phase-10a-premium-ui-ux-refinement.md`, which remains below
400 lines.

Do not add a second detailed UI/UX program document. Future design requirements
must replace or consolidate existing sections rather than append a competing
source of truth.

## Consequences

- Composer reads one coherent design contract and one bounded active playbook.
- The exception does not apply to application code, phase playbooks, or evidence.
- Any change that would push `DESIGN.md` to 800 lines must split it through a new
  reviewed ADR before implementation.
