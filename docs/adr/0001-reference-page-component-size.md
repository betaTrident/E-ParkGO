# ADR 0001: Reference page component size exceptions

- Status: Accepted
- Date: 2026-07-19

## Context

The reference-driven landing and dashboard screens contain several tightly
coupled visual regions whose DOM order, responsive grid behavior, and theme
classes must remain easy to compare with the supplied full-page PNGs.

The project convention targets 200–400 lines per file and requires deliberate
review when a file exceeds 400 lines. The hard limit is 800 lines.

## Decision

Keep the following route-specific display components intact for this visual
implementation:

- `src/components/landing/landing-page.tsx` — approximately 425 lines.
- `src/components/dashboard/dashboard-view.tsx` — approximately 516 lines.

Both remain below the 800-line hard limit. The landing data and footer are
already extracted into focused files. The dashboard's reference data is static
presentation data that will be replaced by authoritative Phase 5 services; a
larger component split now would create short-lived prop plumbing without
improving runtime behavior or ownership boundaries.

## Consequences

- The reference composition remains straightforward to audit against the PNGs.
- Interactive state and data fetching remain outside these display components.
- When Phase 5 connects real dashboard services, extract the KPI, occupancy,
  revenue, entries, and space-map regions into data-backed components as part
  of that phase rather than preserving the preview implementation.
