# E-ParkGO Precision Operations UI/UX Contract

> Status: authoritative product design specification.
>
> Executor: Composer 2.5.
>
> Visual direction: **Precision Operations UI**.
>
> Execution authority remains `PLAN.md §0.2`. This document defines how approved
> product surfaces must look and behave; it does not activate a pending phase or
> override database, authorization, security, money, timestamp, QR, or workflow
> contracts.

## 1. How Composer 2.5 must use this document

### 1.1 Precedence

When instructions conflict, use this order:

1. `PLAN.md §0.2` current execution control and active playbook.
2. Security, data, authorization, state-machine, and server-authority contracts
   in `PLAN.md`, `AGENTS.md`, migrations, RPCs, schemas, and tests.
3. This design contract.
4. Reference screenshots and visual inspiration.

Reference images under `src/app/assets/pages/` are composition references only.
They do not authorize fake data, unsupported controls, combined workflows,
invented routes, or new business capabilities.

### 1.2 Route status labels

- `LIVE_REDESIGN`: route exists and may be refined only when Phase 10A is active.
- `CURRENT_PHASE_NEW`: Phase 10 owns initial implementation; use this contract
  when creating it, then include it in the Phase 10A regression pass.
- `PHASE_10A_NEW`: user-visible presentation surface does not exist yet but is
  explicitly authorized for creation by the Phase 10A playbook.
- `FUTURE_PHASE_DEFERRED`: specified for consistency but forbidden until its
  owning phase is active.
- `NON_VISUAL`: handler or redirect contract; only the user-visible destination
  receives design treatment.

While Phase 10 is active, its new report surfaces apply this document’s
truthfulness, hierarchy, one-primary-action, current-component reuse, responsive
state, accessibility, redaction, and security rules. Exact Phase 10A tokens,
shell changes, and shared compositions remain Phase 10A-owned; Phase 10 must not
edit those shared foundations or duplicate them locally.

### 1.3 Composer working method

For each authorized step:

1. Load every routed skill before editing.
2. Inspect the actual route, data contract, tests, and existing primitives.
3. Classify reference elements as `SUPPORTED`, `ADAPTED`, `DEFERRED`, or
   `EXCLUDED`.
4. Write the required RED behavior or regression test.
5. Refine the smallest coherent page family with existing components.
6. Verify behavior, accessibility, responsive layout, theme parity, security,
   and performance before continuing.
7. Record evidence and stop at the playbook boundary.

Use a fresh Composer session for every numbered Phase 10A step. At 70% context
utilization, stop at the nearest completed step boundary, record an exact receipt,
and continue in a fresh session. Do not edit shared tokens, the shell, or shared
primitives concurrently.

## 2. Product UX principles

### 2.1 Operator-first

E-ParkGO is an operational parking system, not a generic analytics dashboard.
Optimize for quick recognition, low error rates, repeatable keyboard/touch use,
and clear recovery during busy entry and exit periods.

Every operational page must answer:

- Where am I?
- What record or facility am I working on?
- What is its current authoritative state?
- What is the next permitted action?
- What will happen after I take it?
- How do I recover if the action fails?

### 2.2 One dominant job per page

Every page has one primary user job and no more than one visually dominant
primary action. Secondary actions use outline, quiet, or text treatments.
Destructive or irreversible actions state their consequence explicitly.

### 2.3 Truth over decoration

No notification, trend, chart, metric, search, selector, menu, status, or button
may look functional unless real behavior and authorized data back it.

Production UI must not contain:

- fabricated metrics, fallback counts, trends, revenue, dates, facilities, or
  parking-space data;
- dead `href="#"` links, inert menus, fake overflow actions, or read-only fields
  presented as controls;
- invented testimonials, clients, integrations, reservations, features, or
  claims;
- raw internal evidence presented as user-facing product data.

When data is unavailable, use an honest loading, empty, stale, permission, or
error state.

### 2.4 Server authority

The browser never determines authoritative fees, money totals, timestamps,
availability, permissions, payment state, or session state. It displays
server-provided results and may calculate presentation-only values such as a
safe tender/change preview when the owning contract permits it.

PostgreSQL RPCs continue to own official time, integer-centavo money, locks,
idempotency, state transitions, audit evidence, occupancy, payment, and release.

### 2.5 Progressive disclosure

Keep the default view focused. Put supporting history, evidence, advanced
filters, and exceptional actions behind an inline disclosure, drawer, details
region, or permission-aware menu. Use dialogs only for destructive,
irreversible, security-sensitive, or cross-record actions.

### 2.6 User-centered recovery

Preserve safe form input after validation and recoverable server errors. State
what failed, whether anything was recorded, and the exact next action. Never use
“Oops,” blame the operator, or expose stack traces.

## 3. Precision Operations visual direction

### 3.1 Character

The interface is:

- clean and planar;
- calm under operational pressure;
- compact without feeling cramped;
- premium through typography, alignment, rhythm, and detail;
- visually distinctive without ornamental SaaS styling;
- equally intentional in light and dark modes.

The design is not:

- a wall of identical rounded cards;
- a purple/blue gradient template;
- glassmorphism, blurred blobs, glowing borders, or decorative noise;
- a rainbow of KPI icons;
- a marketing layout copied into protected operational pages;
- motion-heavy, cinematic, or scroll-driven inside staff workflows.

### 3.2 Color roles

Use semantic tokens rather than page-local color utilities.

| Role                   | Intended use                                                                  |
| ---------------------- | ----------------------------------------------------------------------------- |
| Application background | Cool off-white in light mode; deep blue-charcoal in dark mode.                |
| Work surface           | White or lightly tinted planar surface; distinct charcoal plane in dark mode. |
| Foreground             | Graphite/slate with high contrast.                                            |
| Primary cobalt         | Primary action, selected navigation, focus, active data series.               |
| Emerald                | Available, verified, paid, successful, healthy.                               |
| Amber                  | Attention, pending, stale, expiring, variance, manual review.                 |
| Red                    | Destructive action, failed state, blocked state, critical exception.          |
| Neutral graphite       | Completed, inactive, secondary, historical.                                   |

Violet, cyan, and additional hues are not ordinary decoration. A status always
uses visible text and, where useful, an icon; color alone never carries meaning.

Phase 10A starts from these exact OKLCH targets. It may adjust a value only as
much as measured WCAG contrast requires, and must record the before/after value:

```text
LIGHT background 0.982/0.006/255; foreground 0.200/0.025/260; card+popover 0.998/0.002/255; muted+secondary 0.955/0.008/255
LIGHT muted-foreground 0.480/0.025/260; border+input 0.885/0.012/255; primary 0.530/0.170/258; ring 0.580/0.170/258
DARK background 0.160/0.022/260; foreground 0.940/0.010/255; card+popover 0.205/0.025/260; muted+secondary 0.255/0.022/260
DARK muted-foreground 0.720/0.018/255; border+input 0.340/0.025/260; primary 0.670/0.160/257; ring 0.700/0.150/257
LIGHT/DARK destructive 0.550/0.190/27 and 0.680/0.170/25; success 0.550/0.140/154 and 0.690/0.130/154
LIGHT/DARK warning 0.690/0.140/75 and 0.780/0.130/78; info 0.560/0.140/245 and 0.710/0.130/245
```

Each triplet is `oklch(lightness chroma hue)` for the named CSS variable.

Set `--radius: 0.5rem`; keep derived primitive radii aligned to §3.6. Chart
tokens use primary, success, warning, destructive, then neutral foreground. Do
not add a decorative series hue without a demonstrated data requirement.

### 3.3 Theme parity

Dark mode is not an inverted light mode. It must preserve:

- distinct background, work-surface, raised-overlay, and input planes;
- readable muted text and borders;
- semantic status contrast;
- visible focus and selected states;
- charts and parking states that remain distinguishable without high saturation.

Do not use pure black or stack many translucent layers.

### 3.4 Typography

- Interface: Geist.
- Identifiers and operational figures: Geist Mono.
- Use tabular figures for money, counts, durations, timestamps, receipt numbers,
  ticket numbers, plates, and chart axes.
- Use sentence case for headings, labels, buttons, table headers, and statuses.
- Body: regular; controls and labels: medium; headings/actions: semibold; bold
  only for page titles and priority figures.
- Operational titles stay compact. Large display type is reserved for the public
  landing and major auth messaging.
- Descriptions should generally remain within 65–75 characters per line.
- Use balanced wrapping for large headings and pretty wrapping for prose.

Suggested hierarchy:

| Element                | Intent                                              |
| ---------------------- | --------------------------------------------------- |
| Public display         | 40–64px responsive, 1–3 lines, tight tracking.      |
| Operational page title | 24–32px responsive, compact line height.            |
| Section heading        | 16–20px semibold.                                   |
| Body/control           | 14–16px.                                            |
| Metadata/caption       | 12–13px, never a substitute for required body text. |

### 3.5 Spacing and density

Use a 4px base rhythm.

- Inline gaps: 4–8px.
- Related control gaps: 8–12px.
- Work-surface padding: 16px compact, 20–24px default.
- Operational section gaps: 24–32px.
- Page inset: 16px mobile, 24px tablet, 28–40px desktop.
- Public sections may use 64–112px vertical spacing.
- Tables are compact and scannable, but controls retain 44px product targets.

Avoid mathematically identical padding everywhere. Align shared baselines and
adjust optical spacing where icons, labels, and values require it.

### 3.6 Geometry

| Component                                       | Radius                                    |
| ----------------------------------------------- | ----------------------------------------- |
| Inline marker or segmented detail               | 2–4px                                     |
| Status label                                    | 4px                                       |
| Button, input, navigation item, parking tile    | 6px                                       |
| Card, work panel, grouped form, table container | 8px                                       |
| Dialog, drawer, sheet                           | 10–12px                                   |
| Avatar, radio, switch, progress point           | True circle when the metaphor requires it |

Do not use pills for ordinary buttons, filters, status labels, or navigation.
Do not apply one radius to every nested layer. Inner geometry must be equal to or
tighter than its container.

### 3.7 Surfaces and elevation

A card must communicate grouping, selection, elevation, or hierarchy. Prefer
open sections, dividers, tonal planes, grouped rows, and shared alignment over
wrapping every block in a bordered card.

Normal page surfaces use borders or tonal contrast. Shadows are reserved for
menus, dialogs, drawers, sticky layers, and temporary elevation. Use one
consistent light direction and no decorative glow.

### 3.8 Icons and data visualization

Retain the installed Lucide set and standardize size, stroke, and alignment. Do
not add a second icon library during Phase 10A.

Use icons to aid scanning, not decorate every heading. Icon-only controls require
an accessible name and tooltip where meaning is not universally clear.

Charts are allowed only when authorized bounded data makes comparison easier.
Every chart needs:

- a neutral descriptive title;
- visible units and time/business-date scope;
- a legend for multiple series;
- tabular or textual equivalent;
- accessible colors and non-color differentiation;
- loading, empty, stale, and error states.

## 4. Shared application composition

### 4.1 Protected shell

The desktop shell uses a compact left navigation and an open main work area.
The shell provides facility identity, navigation, account controls, and
connectivity context; page-specific filters belong inside pages.

Required refinements:

- remove the “Serverless & Scalable” promotion and dead link;
- show the current facility as honest non-interactive context until switching is
  implemented;
- remove the hardcoded global date control;
- remove global search until a real scoped search contract exists;
- remove hardcoded notifications until real notifications exist;
- make the account affordance functional with identity, role, theme, and the
  existing sign-out action;
- render only implemented and authorized destinations;
- use a precise active indicator and minimum 44px targets.

Desktop navigation may collapse to icons with tooltips; tablet may use a rail or
drawer. Mobile bottom navigation is Dashboard, Entry, Scanner, Sessions, and
More; unavailable/unauthorized items stay hidden, and More opens the remaining
navigation/account sheet. It respects safe-area insets and never obscures actions.

### 4.2 Public and auth shells

Public and auth surfaces share brand tokens but may use more whitespace and
editorial composition. They must not inherit operational navigation or
dashboard card patterns.

### 4.3 Page header

Repeated implementation should converge on:

```ts
interface PageHeaderProps {
  title: string;
  description?: string;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
}
```

The page header contains a single `h1`, optional concise explanation, contextual
facility/date/state metadata, and a right-aligned action area. On mobile, actions
stack below the title without reordering semantics.

The protected shell must not emit another `h1`. Its current route title becomes
non-heading navigation context; the route-level `PageHeader` owns the page `h1`.

### 4.4 Work surface

```ts
interface WorkSurfaceProps {
  heading?: string;
  description?: string;
  actions?: React.ReactNode;
  density?: "compact" | "default";
  children: React.ReactNode;
}
```

Use this composition only where a bordered or tonal grouping improves
comprehension. Do not use it as a mandatory wrapper for every section.

### 4.5 Status label

```ts
interface StatusLabelProps {
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
  children: React.ReactNode;
}
```

Status labels use compact rectangular geometry and visible text. Similar states
use the same tone across pages.

### 4.6 Page state

```ts
interface PageStateProps {
  kind:
    | "loading"
    | "empty"
    | "error"
    | "success"
    | "conflict"
    | "stale"
    | "reconnecting"
    | "permission"
    | "offline";
  title: string;
  message: string;
  action?: React.ReactNode;
  correlationId?: string;
}
```

Page states preserve the surrounding page structure to reduce layout shift.
Correlation IDs are safe, optional, copyable references—not stack traces.

### 4.7 Metric strip

```ts
interface MetricStripProps {
  primary: { label: string; value: string; detail?: string };
  supporting: ReadonlyArray<{ label: string; value: string; detail?: string }>;
}
```

Use one dominant metric with aligned supporting facts instead of equal KPI-card
walls. Trends appear only when a real comparison period and data source exist.

### 4.8 Tables and responsive records

Desktop tables require:

- semantic headers and captions where useful;
- aligned numeric columns with tabular figures;
- cursor pagination and bounded page sizes;
- row actions that remain keyboard accessible;
- sticky headers only when they do not obscure focus.

Mobile may use compact record groups rather than horizontal scrolling. Preserve
the same information priority, actions, and source order. Do not hide required
evidence merely to simplify mobile layout.

### 4.9 Forms

- Labels remain visible; placeholders are examples, not labels.
- Required/optional state is explicit.
- Help appears before errors where it prevents failure.
- Validation appears near the field and in an error summary when submission
  fails across multiple fields.
- Focus moves to the error summary only after submission failure.
- Safe inputs remain populated after recoverable errors.
- Pending actions prevent accidental repeats, but server idempotency remains the
  real protection.
- Money, plate, ticket, receipt, and code inputs use appropriate input modes and
  autocomplete attributes.

### 4.10 Dialogs, drawers, menus, and toast

Dialogs contain focus, close with Escape where safe, restore focus, and state
their consequence. Drawers are preferred for supportive detail and mobile
filters. Menus contain real available actions only.

Toasts provide brief confirmation; they never carry the only copy of an error,
receipt, credential, or required next action. Persistent outcomes remain visible
in the page.

### 4.11 Motion

Use 120–180ms opacity or transform feedback for hover, press, selection,
disclosure, and overlay transitions. Avoid layout-property animation, parallax,
scroll hijacking, repeated entrance choreography, and decorative motion inside
protected workflows. Under `prefers-reduced-motion`, remove nonessential motion.

## 5. Accessibility, security, reliability, and performance

### 5.1 Accessibility baseline

Target WCAG 2.2 AA and a 44×44px product minimum for operational controls.

Every page must provide:

- a skip link and semantic landmarks;
- one `h1` and logical heading order;
- complete keyboard operation and visible focus;
- text labels for icon-only actions;
- text or pattern in addition to color;
- announced form errors and dynamic statuses;
- focus containment/restoration for overlays;
- 400% reflow without lost content or function;
- reduced-motion support;
- manual scanner fallback;
- meaningful loading, empty, error, permission, and offline states.

### 5.2 Sensitive-data rules

Never expose or commit:

- raw QR tokens beyond their authorized one-time surface;
- QR hashes, credentials, cookies, JWTs, passwords, or secret keys;
- private staff data outside authorized scope;
- unredacted audit evidence;
- payment evidence beyond the authorized operational need.

Do not place raw QR payloads in logs, URL paths, screenshots, fixtures, analytics,
IndexedDB, or persistent client state. Use synthetic local test data only.

### 5.3 Authorization and dangerous actions

Role-aware visibility is an affordance, not authorization. Server checks remain
mandatory. Permission-denied states reveal no cross-location or sensitive record
details.

Sensitive actions display the target, consequence, authorization context, and
required reason. Final payment and final vehicle release remain separate
transactions and interfaces.

### 5.4 Reliability

Every mutation state distinguishes:

not submitted, pending, succeeded, failed before recording,
uncertain/interrupted with same-key retry, and conflict because authoritative
state changed.

Do not optimistically claim success for payment, exit, space release, rate
publication, staff permission changes, or report exports.

### 5.5 Performance

- Preserve Server Components for authorization and initial data.
- Limit Client Components to forms, scanner/media APIs, printing, filters,
  Realtime, connectivity, and required interaction.
- Avoid sequential request waterfalls; start independent server reads together.
- Pass minimal serialized data into Client Components.
- Dynamically load heavy scanner/chart code only where used.
- Avoid new runtime dependencies, analytics, tracking, external asset sinks, or
  third-party scripts.
- Use content visibility or virtualization only for measured long-list needs.
- Prevent layout shift with size-stable skeletons and media dimensions.

Phase 13 and 14 own release and staging performance evidence. Phase 10A records
bundle or interaction regressions but must not claim production Web Vitals from
static inspection.

## 6. Route inventory and page blueprints

Each blueprint lists `status/owner`; primary job and hierarchy; required states,
constraints, and evidence. Shared shell, accessibility, security, performance,
and responsive rules from §§4–5 apply to every route.

Authorization follows live server contracts; this is presentation inventory,
never authorization: `/` is public; auth/recovery routes are for signed-out
recovery; operational routes are for active `STAFF`/`ADMIN` within live
location/permission scope; `/spaces` exposes configuration only to admins;
transactions/reports retain existing view/export permissions; `/admin/*` is
admin-only unless an existing narrower permission applies; `/offline` follows
future Phase 11 policy.

### 6.1 Public and authentication

- `/` — `LIVE_REDESIGN`, Phase 10A. Explain the real parking-operations product
  and lead to staff sign-in through an asymmetric editorial composition, real UI
  imagery, and supported workflow proof. Exclude equal feature-card rows,
  gradient CTA bands, vague “serverless” claims, and invented metrics, clients,
  testimonials, integrations, or pricing. Verify light/dark, keyboard, reduced
  motion, metadata, links, and 375/768/1440 layouts.
- `/login`, `/forgot-password`, `/update-password` — `LIVE_REDESIGN`, Phase 10A.
  Use a calm asymmetric desktop shell and focused single-column mobile form.
  Reuse current secure auth/recovery behavior; show password requirements,
  preserve safe input, announce errors, and retain generic anti-enumeration
  responses. Cover invalid, throttled, sent, expired, mismatch, pending, success,
  keyboard, and focus states. Exclude social login and decorative feature rows.

### 6.2 Protected shell and dashboard

- Protected shell — `LIVE_REDESIGN`, Phase 10A. Provide compact grouped desktop
  navigation, an open work area, truthful facility context, a functional
  identity/role/theme/sign-out menu, and mobile task navigation. Show only
  implemented, authorized routes. Verify active state, collapse/drawer/bottom
  navigation, 44px targets, skip link, focus restoration, and absence of dead or
  fake search/date/notification/promotion controls.
- `/dashboard` — `LIVE_REDESIGN`, Phase 10A. Prioritize authoritative
  occupancy/availability, a supporting metric strip, exceptions,
  movement/settlement, recent activity, and Realtime health. Use an asymmetric
  desktop grid and ordered mobile sections. Remove hardcoded fallbacks, trends,
  revenue, static space maps, fake menus, and rainbow KPI cards. Cover loading,
  zero activity, stale, reconnecting, offline, denied, two-client convergence,
  and accessible chart alternatives.

### 6.3 Entry, ticket, and scanner

- `/entry` — `LIVE_REDESIGN`, Phase 10A. Use vehicle facts plus an authoritative
  parking-assignment work surface and one `Create entry` action; desktop is
  two-zone, mobile is one logical sequence with a safe sticky action. Reuse
  current schemas/actions/data. Adapt space selection to a keyboard picker only
  when supported. Exclude owner, phone, notes, reservation, and invented fields.
  Cover validation, disabled incompatibility/occupancy, duplicate plate, race,
  pending, success, and retained safe input.
- `/tickets/[ticketNumber]` — `LIVE_REDESIGN`, Phase 10A. Use a receipt-inspired
  planar layout, high-contrast QR, tabular facts, facility context, and clear
  print/reissue actions. Preserve one-time credential and revoke/reissue rules.
  Verify 80mm/A4, monochrome, quiet zone, page breaks, and screen/print
  separation. Visual tests assert exactly one `.ticket-print-qr`, mask it, and
  disable trace/video for credential cases; no artifact may contain the
  credential. Exclude sharing/download/copy without a secure contract.
- `/scanner` — `LIVE_REDESIGN`, Phase 10A. Make the camera dominant and manual
  lookup permanently discoverable. Cover initializing, denied, unsupported, low
  light, scanning, recognized, invalid, throttled, and completed states. Announce
  status without harmful focus movement; never persist or expose raw payloads.
  Verify camera-capable projects, denial, manual fallback, keyboard, reduced
  motion, and mobile layout.
- `/verify` — `LIVE_REDESIGN`, Phase 10A. Use a compact transitional
  progress/failure surface with safe facts and recovery to scanner/manual lookup.
  Preserve fragment handling/clearing. Cover pending, valid redirect, invalid,
  expired, revoked, completed, throttled, and unauthorized states.

### 6.4 Exit, payment, and release

- `/exit/[sessionId]` — `LIVE_REDESIGN`, Phase 10A. Show session identity,
  authoritative time/duration, dominant read-only fee breakdown, quote expiry,
  and the next permitted action. Distinguish proposed and official exit time;
  never combine payment and release. Cover quote pending/expired/stale, added
  amount, lost ticket, correction, completion, and denial.
- `/payments` — `PHASE_10A_NEW`, Phase 10A. Replace the current no-query
  not-found outcome with a static surface linking to the existing scanner and
  sessions routes. Do not add search, lookup, or payment capability.
- `/payments/[sessionId]` — `LIVE_REDESIGN`, Phase 10A. Present server-provided
  PHP amount due, shift context, keypad-friendly tender, permitted change
  preview, static non-interactive `Cash` context, receipt facts, and one
  `Record payment` action. Cover
  insufficient cash, missing shift, expired quote, duplicate, top-up,
  interrupted retry, offline, and denial. Never recompute authoritative fees.
- `/exit/[sessionId]/confirm` — `LIVE_REDESIGN`, Phase 10A. Keep final release
  distinct; show paid/receipt context, plate, space, consequence, and one
  `Confirm exit and release space` action. Cover top-up, stale, already complete,
  idempotent retry, denial, and success with a next-task route.

### 6.5 Operations and configuration

- `/sessions` — `LIVE_REDESIGN`, Phase 10A. Present the current bounded
  exception-session result as a compact desktop list/table and mobile records.
  Do not add filters, search, cursors, or pagination until an owning phase adds
  that query contract. Emphasize existing payment-pending, review, lost-ticket,
  and correction states; keep actions permissioned, reasoned, focusable, and
  resilient to empty/stale/error states.
- `/spaces` — `LIVE_REDESIGN`, Phase 10A. Use a zone/space board with selection
  and details. Make available, occupied, accessible, out-of-service, selected,
  and stale states distinct through text/pattern/icon beyond color. Maintain
  logical keyboard order and exclude reservations.
- `/shifts` — `LIVE_REDESIGN`; Phase 10 expands history/reconciliation and Phase
  10A refines the full surface. Put current shift action before admin history,
  display server centavo strings with tabular figures, and cover no-open, open,
  closing, variance, duplicate close, interruption, and denial with audit.
- `/admin/rates` — `LIVE_REDESIGN`, Phase 10A. Separate draft, preview,
  published versions, and history with progressive disclosure. Emphasize
  effective dates, overlap errors, snapshots, vehicle types, and explicit
  publish/retire consequences.
- `/admin/staff` — `LIVE_REDESIGN`, Phase 10A. Use a desktop directory and mobile
  records with one real action menu. Show only authorized name, role, location,
  status, and safe activity. Surface invite, permission, last-admin,
  self-elevation, disable/reactivate, and session-revocation consequences.
- `/admin/settings` — `LIVE_REDESIGN`, Phase 10A. Group facility identity,
  timezone/business display, receipts, and safe defaults; separate current values
  from editing. Cover loading, validation, unsaved, saving, saved, conflict,
  error, and denial. Do not add Phase 12 security settings.

### 6.6 Transactions, reports, and audit

- `/transactions` — `CURRENT_PHASE_NEW`, Phase 10 then Phase 10A regression.
  Use bounded filters, desktop table, mobile records, and progressive
  reconciliation detail. Show authorized export processing/success/failure/audit
  states. Exclude decorative charts and raw evidence. Verify invalid cursor,
  empty, redaction, denial, stale data, pagination stability, and CSV safety.
- `/reports` — `CURRENT_PHASE_NEW`, Phase 10 then Phase 10A regression. Use one
  primary summary, constrained filters, at most one useful visualization, and a
  reconciliation table. Show units, business date, Asia/Manila timezone,
  comparison basis, and location scope. Cover no data, oversized range,
  processing, denial, stale, and error; provide text/table chart equivalents.
- `/admin/audit` — `CURRENT_PHASE_NEW`, Phase 10 then Phase 10A regression.
  Present immutable evidence through bounded filters, a compact event table, and
  a details drawer/inline disclosure. Redact secrets, QR/hash/auth data, and
  disallowed personal/payment fields. Omit copy/export unless authorized and
  audited; use color only for defined severity/state.

### 6.7 System and deferred surfaces

- Not found and route errors — `PHASE_10A_NEW`, Phase 10A. Provide a branded,
  safe message, retry/back/home action, and optional correlation ID without
  stacks, internal paths, database errors, or sensitive identifiers. Verify
  focus, keyboard recovery, and offline distinction.
- `/offline` — `FUTURE_PHASE_DEFERRED`, Phase 11. Specify connection, cache age,
  allowed read-only content, retry, update, install, and storage-clear guidance.
  No auth, QR, payment, receipt, audit, admin, or mutation payload cache; disable
  writes offline. Phase 10A must not implement PWA tooling, workers, or caches.
- Security surfaces — `FUTURE_PHASE_DEFERRED`, Phase 12. If Phase 12 creates MFA,
  device, session, or revocation pages, use auth geometry and direct language.
  Phase 10A must not invent routes, backend capability, or settings.
- `/auth/callback` and API Route Handlers — `NON_VISUAL`. Preserve redirect,
  error mapping, validation, and security contracts; user-visible destinations
  provide safe, actionable outcomes.

## 7. Responsive behavior

Use content behavior, not device labels, to choose breakpoints. Required evidence
widths are 375px, 768px, and 1440px.

### Mobile

- Single-column task order.
- 16px page inset.
- No horizontal page scroll.
- Sticky actions respect keyboard and safe-area insets.
- Tables become compact records only when information/action parity remains.
- Camera, keypad, and print flows are tested on relevant projects.

### Tablet

- 24px inset.
- Shell may become rail/drawer.
- Filters may wrap into two aligned rows or a drawer.
- Two-column composition only where reading and focus order remain logical.

### Desktop

- 28–40px inset and a constrained readable work area.
- Use asymmetric grids based on task priority, not equal card templates.
- Long tables may use the available width while descriptions stay constrained.
- Sticky regions must not cover focus, headings, or table content.

At 400% zoom, content reflows without two-dimensional scrolling except for
intrinsically tabular content where a labeled scroll region is necessary.

## 8. State language

Use direct, specific wording:

- Loading: describe what is being loaded when delay is meaningful.
- Empty: explain why no records appear and offer a valid next action.
- Error: state what failed and how to retry or continue safely.
- Permission: explain that access is unavailable without exposing the record.
- Offline: state which reads may be stale and that writes are unavailable.
- Success: state what was recorded and the next useful task.
- Conflict: state that the authoritative record changed and refresh the facts.

Avoid “Oops,” exclamation marks, celebratory confetti, blame, and vague
“Something went wrong” when a safe specific explanation is available.

## 9. Component and dependency rules

- Use Tailwind 4, shadcn/Base UI, existing Lucide icons, Recharts, and current
  application dependencies.
- Generated primitives remain under `src/components/ui/**`.
- Never hand-write shadcn primitive source. Run
  `npx shadcn@latest add <component>` only for a verified missing primitive.
- Prefer semantic token refinement in `src/app/globals.css`, existing primitive
  `className` support, and focused shared/feature compositions.
- Do not add another UI framework, icon package, font, animation library,
  analytics SDK, tracking pixel, or external runtime asset dependency.
- `@axe-core/playwright` may be added as a development dependency only after
  official compatibility verification in the active Phase 10A step.
- Keep functions under 50 lines where practical, files focused at 200–400 lines,
  and no file above 800 lines without an ADR exception.

## 10. Visual QA and regression matrix

### 10.1 Baselines

Capture synthetic-data evidence for each page family:

- light and dark;
- 375px, 768px, and 1440px;
- loading, populated, empty, and recoverable error where applicable;
- permission, stale, offline-disabled, or print states where applicable.

Stable screenshot assertions run in Chromium desktop and mobile Chrome.
Firefox, WebKit, and mobile Safari perform functional, overflow, and interaction
checks to avoid engine-specific screenshot noise.

### 10.2 Browser checks

For every critical page:

- no horizontal overflow or clipped content;
- no obscured sticky action;
- no accidental layout shift;
- no uncaught console or hydration error;
- no unexpected failed request;
- complete keyboard traversal and visible focus;
- dialog containment and trigger focus restoration;
- meaningful screen-reader names, roles, values, and announcements;
- reduced-motion behavior;
- light/dark parity.

### 10.3 Security review

Before evidence is committed:

- search fixtures, screenshots, logs, and artifacts for credentials and raw QR
  material;
- verify role/location denial and redaction;
- verify no client recomputation of authoritative values;
- verify no analytics, tracking, or external asset sink;
- verify screenshots use synthetic identities and safe financial examples.

## 11. Design Definition of Done

A page is design-complete only when:

- its route, role, job, data authority, and primary action match this contract;
- it uses semantic tokens and the approved radius/surface system;
- it contains no fake data, fake affordance, unsupported field, or dead action;
- desktop, tablet, mobile, light, dark, and 400% reflow are intentional;
- loading, empty, error, success, permission, stale, and offline states are
  implemented where applicable;
- keyboard, focus, screen-reader, contrast, target size, and reduced motion meet
  the accessibility baseline;
- sensitive data is minimized and redacted;
- Server/Client boundaries and all domain contracts remain unchanged unless the
  owning active phase explicitly authorizes a change;
- targeted unit/integration/E2E tests pass;
- visual regression evidence is reviewed;
- there is no unresolved critical/high accessibility, security, code-review, or
  silent-failure finding.

## 12. Phase 10A release gate

Only the Phase 10A playbook’s exact gate and append-only evidence may complete
the phase and activate Phase 11; documentation checks are not app validation.
