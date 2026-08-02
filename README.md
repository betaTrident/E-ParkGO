# E-ParkGO

Parking operations platform for staffed facilities — entry ticketing, session tracking, and cash-at-exit settlement.

## Simplified ops flow (v1)

The product follows the **Ops Simplification v1** playbook: [`contexts/plans/ops-simplification-v1.md`](contexts/plans/ops-simplification-v1.md).

- **Capacity pools** — Car and motorcycle limits are set in Facility settings; no per-bay assignment.
- **Entry** — Staff record plate + vehicle type and print a one-time QR ticket.
- **Cash at exit** — Payment and exit happen on one screen; no separate Payments nav or shift gate.
- **Staff-attributed cash** — Payments are tied to the acting staff member, not an open shift.

Primary staff navigation: Dashboard, Entries, Scan & Exit, Active Sessions.
