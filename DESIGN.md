# E-ParkGO Design System

> **Product:** E-ParkGO
> **Document:** `DESIGN.md`
> **Application Type:** Serverless Parking Management Progressive Web Application
> **Primary Platforms:** Mobile, tablet, laptop, desktop, and future kiosk displays
> **Theme Support:** Light, dark, system, and customizable accent themes
> **Design Direction:** Clean, minimalistic, visually polished, organized, modern, professional, responsive, and operationally efficient

---

# 1. Design Overview

E-ParkGO is a parking management system designed to automate the complete parking workflow, including:

* Vehicle entry registration
* Parking-space assignment
* QR ticket generation
* Parking-session monitoring
* QR ticket scanning
* Parking-duration calculation
* Payment recording
* Vehicle exit confirmation
* Parking-space availability updates
* Administrative monitoring and reporting

The interface should feel like a modern transportation operations platform rather than a generic administration dashboard.

The design must prioritize speed, clarity, reliability, security, and ease of use.

Staff members may operate the system while vehicles are waiting, so all high-frequency workflows must be simple, focused, and fast.

---

# 2. Design Goals

The E-ParkGO interface should be:

## 2.1 Clear

Every screen must clearly communicate:

1. What the staff member is currently doing
2. What information is required
3. What action should be performed next
4. Whether the action succeeded or failed

## 2.2 Fast

Common tasks should require minimal steps.

| Task                         | Target                        |
| ---------------------------- | ----------------------------- |
| Register a vehicle           | One focused form              |
| Assign a parking space       | One selection                 |
| Generate a ticket            | Automatic after submission    |
| Scan a ticket                | One primary action            |
| Review parking charges       | One screen                    |
| Record payment               | One confirmation              |
| Confirm vehicle exit         | One explicit confirmation     |
| Search for a parking session | Plate number or ticket number |

## 2.3 Reliable

The interface must prevent errors through:

* Clear validation
* Duplicate-session warnings
* Disabled occupied parking spaces
* Server-generated timestamps
* Explicit payment states
* Explicit exit confirmation
* Read-only calculated fees
* Clear operational statuses
* Audit reasons for sensitive actions

## 2.4 Professional

The visual direction should feel appropriate for:

* Parking facilities
* Commercial establishments
* Office buildings
* Universities
* Hospitals
* Shopping centers
* Hotels
* Government facilities
* Private parking operators

## 2.5 Responsive

The same application should work on:

* Mobile phones
* Tablets
* Laptops
* Desktop computers
* Large monitoring displays
* Future entry and exit kiosks

---

# 3. Brand Direction

## 3.1 Product Name

**E-ParkGO**

Possible meaning:

* **E** — electronic, efficient, and easy
* **Park** — parking operations
* **GO** — fast and seamless movement

## 3.2 Brand Personality

E-ParkGO should feel:

* Modern
* Efficient
* Reliable
* Secure
* Calm
* Precise
* Friendly
* Professional

It should not feel:

* Overly futuristic
* Childlike
* Gaming-inspired
* Crypto-themed
* Visually noisy
* Complicated
* Generic
* Excessively decorative

## 3.3 Suggested Tagline

> Smarter parking from entry to exit.

Alternative:

> One ticket. One scan. Complete parking control.

## 3.4 Logo Direction

Recommended logo concepts:

* Abstract `P` symbol
* Combined `E` and `P` monogram
* Parking lane
* Entry-to-exit route
* Directional movement
* Ticket path
* Parking gate
* Minimal parking marker

The logo must:

* Remain readable at favicon size
* Work in light and dark mode
* Use simple geometry
* Avoid excessive detail
* Avoid literal vehicle illustrations
* Avoid heavy gradients in the primary version

---

# 4. Visual Style

The E-ParkGO interface should combine:

```text
Modern SaaS structure
+
Transportation clarity
+
Fintech-level transaction trust
+
Fast operational workflows
+
Minimalistic visual design
```

## 4.1 Visual Characteristics

Use:

* Spacious but efficient layouts
* Clean card surfaces
* Strong typography
* Soft borders
* Subtle shadows
* Controlled rounded corners
* Clear information hierarchy
* Compact status badges
* Purposeful icons
* Restrained colors
* Consistent spacing
* Minimal motion

## 4.2 Avoid

Avoid:

* Heavy glassmorphism
* Excessive gradients
* Neon effects
* Decorative 3D illustrations inside operational screens
* Low-contrast gray text
* Oversized empty cards
* Excessive rounded pills
* Too many status colors
* Continuous animated backgrounds
* Overly dense forms
* Decorative UI elements with no functional purpose

---

# 5. Design Technology

Recommended design and frontend tools:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Radix UI
* Lucide React
* Geist Sans
* Geist Mono
* next-themes
* React Hook Form
* Zod
* Recharts
* Framer Motion for limited purposeful animations

---

# 6. Theme System

E-ParkGO must support:

```text
system
light
dark
```

Optional accent themes:

```text
emerald
blue
graphite
purple
amber
high-contrast
```

Themes must use semantic tokens rather than hard-coded component colors.

Changing the theme must not affect component layout, behavior, accessibility, or business logic.

---

# 7. Color System

## 7.1 Default Brand Colors

| Color             | Value     | Usage                                   |
| ----------------- | --------- | --------------------------------------- |
| Primary Blue      | `#2563EB` | Main buttons, active navigation, links  |
| Primary Blue Dark | `#1D4ED8` | Hover and active button states          |
| Emerald           | `#10B981` | Available spaces, successful actions    |
| Cyan              | `#06B6D4` | Scanner and realtime accent             |
| Amber             | `#F59E0B` | Pending and reserved states             |
| Red               | `#EF4444` | Occupied, destructive, and error states |
| Violet            | `#8B5CF6` | Manual review or special states         |
| Slate 950         | `#020617` | Dark mode page background               |
| Slate 900         | `#0F172A` | Dark mode cards                         |
| Slate 50          | `#F8FAFC` | Light mode page background              |
| White             | `#FFFFFF` | Light mode cards                        |

## 7.2 Parking Status Colors

| Parking State | Color        |
| ------------- | ------------ |
| Available     | Emerald      |
| Occupied      | Red          |
| Reserved      | Amber        |
| Maintenance   | Gray         |
| Accessible    | Blue         |
| Selected      | Primary blue |

## 7.3 Session Status Colors

| Session State      | Color            |
| ------------------ | ---------------- |
| Active             | Emerald          |
| Exit pending       | Amber            |
| Payment pending    | Amber            |
| Paid awaiting exit | Blue             |
| Completed          | Slate or emerald |
| Cancelled          | Red              |
| Manual review      | Violet           |
| Lost ticket        | Red or amber     |

Status information must never depend only on color.

Each status should include:

* Text label
* Optional icon
* Semantic color
* Accessible contrast

---

# 8. Semantic Design Tokens

```css
:root {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;

  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 20%;

  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;

  --accent: 160 84% 39%;
  --accent-foreground: 0 0% 100%;

  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;

  --destructive: 0 72% 51%;
  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  --info: 199 89% 48%;

  --space-available: 160 84% 39%;
  --space-occupied: 0 84% 60%;
  --space-reserved: 38 92% 50%;
  --space-maintenance: 215 16% 65%;
  --space-accessible: 217 91% 60%;

  --radius: 0.875rem;
}

.dark {
  --background: 222 47% 6%;
  --foreground: 210 40% 98%;

  --card: 222 47% 9%;
  --card-foreground: 210 40% 98%;

  --popover: 222 47% 9%;
  --popover-foreground: 210 40% 98%;

  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 7%;

  --secondary: 217 33% 14%;
  --secondary-foreground: 210 40% 96%;

  --muted: 217 33% 14%;
  --muted-foreground: 215 20% 65%;

  --accent: 158 64% 52%;
  --accent-foreground: 222 47% 7%;

  --border: 217 33% 18%;
  --input: 217 33% 18%;
  --ring: 217 91% 60%;

  --destructive: 0 63% 55%;
  --success: 158 64% 52%;
  --warning: 43 96% 56%;
  --info: 199 89% 58%;
}
```

All final token values must be validated for WCAG contrast.

---

# 9. Light Mode

Light mode should use:

* Soft slate page background
* White cards
* Dark slate text
* Light gray borders
* Blue primary actions
* Emerald success states
* Minimal shadows
* Soft secondary surfaces

Recommended hierarchy:

```text
Page background: Slate 50
Primary card: White
Secondary surface: Slate 100
Primary text: Slate 950
Secondary text: Slate 600
Muted text: Slate 500
Border: Slate 200
```

---

# 10. Dark Mode

Dark mode should feel like a professional operations command center.

Use:

* Deep slate page background
* Slightly lighter cards
* High-contrast text
* Blue primary actions
* Emerald success indicators
* Muted borders
* Minimal shadows
* Restrained glow effects

Recommended hierarchy:

```text
Page background: Slate 950
Primary card: Slate 900
Secondary surface: Slate 900/70
Primary text: Slate 50
Secondary text: Slate 300
Muted text: Slate 400
Border: Slate 800
```

Avoid using pure black for every surface.

---

# 11. Typography

## 11.1 Font Families

Use:

* **Geist Sans** for general interface text
* **Geist Mono** for ticket numbers, plate numbers, timestamps, identifiers, and financial metrics

Fallback:

```css
font-family: Geist, Inter, ui-sans-serif, system-ui, sans-serif;
```

## 11.2 Type Scale

| Style         | Size     | Weight   | Usage                      |
| ------------- | -------- | -------- | -------------------------- |
| Display       | 40–48 px | Bold     | Marketing or setup screens |
| Page title    | 28–32 px | Bold     | Main page heading          |
| Section title | 20–24 px | Semibold | Main card sections         |
| Card title    | 16–18 px | Semibold | Cards and panels           |
| Body          | 14–16 px | Regular  | Standard content           |
| Small         | 12–13 px | Regular  | Supporting information     |
| Metric        | 24–36 px | Bold     | Dashboard values           |
| Mono code     | 14–22 px | Medium   | Ticket and plate values    |

## 11.3 Typography Rules

* Use sentence case for interface labels.
* Use uppercase for plate numbers.
* Use monospace for ticket codes.
* Use semibold for actions and headings.
* Use muted colors only for secondary information.
* Avoid long uppercase labels.
* Avoid small low-contrast text.

---

# 12. Spacing System

Use a 4-pixel base spacing scale.

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Recommended usage:

| Spacing | Usage                              |
| ------- | ---------------------------------- |
| 4 px    | Icon and label adjustment          |
| 8 px    | Tight component spacing            |
| 12 px   | Form label to input                |
| 16 px   | Standard card content              |
| 24 px   | Card sections                      |
| 32 px   | Page sections                      |
| 48 px   | Major layout separation            |
| 64 px   | Marketing or large page separation |

---

# 13. Border Radius

| Component           | Radius        |
| ------------------- | ------------- |
| Small controls      | 8 px          |
| Buttons             | 10–12 px      |
| Inputs              | 10–12 px      |
| Cards               | 14–18 px      |
| Dialogs             | 18–22 px      |
| Parking-space tiles | 10–14 px      |
| Status badges       | Fully rounded |

Avoid mixing sharp and highly rounded components without a clear reason.

---

# 14. Shadows and Elevation

## Light Mode

Use subtle shadows:

```css
box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
```

Use stronger shadows only for:

* Dialogs
* Dropdown menus
* Floating scanner controls
* Side panels

## Dark Mode

Prefer:

* Borders
* Surface contrast
* Low-opacity highlights

Avoid heavy black shadows.

---

# 15. Responsive Layout

## 15.1 Desktop

```text
┌─────────────────────────────────────────────────────────────┐
│ Top bar: page title, facility, date, search, theme, user   │
├─────────────────┬───────────────────────────────────────────┤
│ Sidebar         │ Main content                              │
│                 │                                           │
│ Dashboard       │                                           │
│ Entries         │                                           │
│ Scan & Exit     │                                           │
│ Payments        │                                           │
│ Active Sessions │                                           │
│ Parking Map     │                                           │
│ Reports         │                                           │
│ Rates           │                                           │
│ Staff           │                                           │
│ Settings        │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

Desktop sidebar:

* Collapsible
* Icon and label
* Clear active state
* Facility branding at top
* Account and shift information near bottom

## 15.2 Tablet

Use:

* Compact sidebar
* Icon rail
* Large touch targets
* Two-column operational layouts
* Large scanner camera area
* Sticky main actions

## 15.3 Mobile

Recommended bottom navigation:

```text
Dashboard
Entry
Scan
Sessions
More
```

The Scan action may be highlighted in the center.

Use:

* Stacked content
* Sticky bottom actions
* Bottom sheets
* Cards instead of wide tables
* Full-width scanner

---

# 16. Navigation Structure

## 16.1 Staff Navigation

```text
Dashboard
New Entry
Scan & Exit
Payments
Active Sessions
Parking Map
Transactions
Shift
```

## 16.2 Administrator Navigation

```text
Dashboard
Operations
Transactions
Parking Management
Rates
Staff
Reports
Audit Logs
Settings
```

## 16.3 Route Structure

```text
/login
/dashboard
/entry
/entry/success/[sessionId]
/scan
/exit/[sessionId]
/payments
/sessions
/sessions/[sessionId]
/parking-map
/transactions
/transactions/[sessionId]
/shift

/admin/spaces
/admin/zones
/admin/rates
/admin/staff
/admin/reports
/admin/audit-logs
/admin/settings

/offline
/error
```

---

# 17. Application Shell

## 17.1 Sidebar

The sidebar should include:

* E-ParkGO logo
* Navigation items
* Active-route indicator
* Role-aware menu items
* Facility information
* Collapse button
* Account or shift summary

Sidebar behavior:

* Expanded on large screens
* Collapsible on desktop
* Icon rail on tablet
* Hidden behind a sheet on mobile

## 17.2 Top Bar

The top bar should include:

* Page title
* Facility selector
* Date or date range
* Global search
* Notifications
* Theme toggle
* User account menu

## 17.3 Account Menu

Include:

* Staff name
* Role
* Shift state
* Appearance
* Account settings
* Sign out

---

# 18. Component Library

Core components:

```text
AppShell
Sidebar
TopBar
MobileBottomNavigation
PageHeader
ThemeSwitcher
FacilitySelector
ShiftStatus

KpiCard
OccupancyChart
RevenueChart
RecentActivity
OperationalAlert
ZoneSummary

PlateNumberInput
VehicleTypeSelect
ColorSelect
ParkingSpacePicker
ParkingSpaceTile
ParkingZoneGrid

TicketPreview
QRCodePanel
PrintTicketButton
ShareTicketButton

QRScanner
ScannerFrame
FlashlightButton
ManualTicketLookup
CameraPermissionState

SessionStatusBadge
PaymentStatusBadge
SessionSummary
FeeBreakdown
PaymentForm
ExitConfirmation

DataTable
MobileDataCard
FilterBar
SearchInput
DateRangePicker
Pagination

EmptyState
ErrorState
OfflineBanner
UpdatePrompt
ConfirmDialog
ApprovalDialog
ReasonForm
AuditTimeline
```

---

# 19. Button Design

Required variants:

* Primary
* Secondary
* Outline
* Ghost
* Destructive
* Success
* Icon
* Loading
* Large operational action

Examples:

```text
Generate Ticket
Scan Ticket
Preview Exit
Record Payment
Confirm Vehicle Exit
Reprint Ticket
Cancel Session
```

Button rules:

* Minimum touch size: 44 × 44 px
* Primary mobile actions: 48–56 px height
* Use icons only when their purpose is clear
* Destructive actions require confirmation
* Loading actions must prevent duplicate submission
* Disabled buttons must remain readable

---

# 20. Form Design

Forms should use:

* Visible labels
* Supporting descriptions
* Clear required markers
* Inline validation
* Error summaries where necessary
* Consistent spacing
* Logical field grouping

## Plate Number Input

Behavior:

* Automatically uppercase text
* Trim unnecessary spaces
* Use monospace
* Search existing vehicle records
* Check for active sessions
* Display a warning before submission

Example:

```text
ABC-1234
```

## Currency Input

Behavior:

* Use Philippine peso formatting
* Display two decimal places
* Prevent negative values
* Validate amount received
* Calculate change automatically

Example:

```text
₱100.00
```

---

# 21. Login Page

## Purpose

Allow administrators and staff to securely access E-ParkGO.

## Layout

Desktop:

* Left brand and product-information panel
* Right centered authentication card
* Theme toggle in the upper-right corner

Mobile:

* Compact logo
* Login card
* No unnecessary illustrations
* Full-width fields and button

## Content

* E-ParkGO logo
* Welcome message
* Email field
* Password field
* Show-password control
* Remember-me option
* Forgot-password link
* Sign-in button
* Optional Google login
* Staff and administrator access label

## Behavior

* Preserve email after a failed login
* Show a clear invalid-credentials message
* Disable submit while authenticating
* Redirect authenticated users
* Support password recovery
* Display disabled-account messages

---

# 22. Dashboard Page

## Purpose

Provide an immediate overview of the parking facility.

## Header

Include:

* Dashboard title
* Facility selector
* Date selector
* Search
* Notifications
* Theme switcher
* User account

## KPI Cards

Recommended:

* Active sessions
* Available spaces
* Revenue today
* Vehicles today
* Pending exits

Each card should include:

* Icon
* Label
* Main value
* Supporting trend
* Optional overflow menu

## Main Panels

### Occupancy Overview

Display:

* Total parking spaces
* Available
* Occupied
* Reserved
* Maintenance
* Occupancy percentage

### Revenue Trend

Display:

* Daily revenue
* Selected date range
* Hover tooltip
* Currency formatting

### Recent Entries

Columns:

* Entry time
* Plate number
* Vehicle
* Entry gate
* Parking level
* Duration
* Status

### Parking Map Preview

Display a compact parking-space overview with:

* Available
* Occupied
* Reserved
* Maintenance
* Accessible

---

# 23. New Vehicle Entry Page

## Purpose

Allow staff to register an arriving vehicle and assign a parking space.

## Layout

Desktop:

```text
Vehicle Information | Parking Assignment
```

Mobile:

```text
Vehicle Information
Parking Assignment
Sticky Generate Ticket button
```

## Vehicle Fields

* Plate number
* Vehicle type
* Color
* Make and model
* Driver or owner name
* Contact number
* Optional notes

Only fields required by the business should be mandatory.

## Parking Assignment

Include:

* Zone selector
* Parking-space search
* Parking-space grid
* Status legend
* Vehicle compatibility
* Accessible-space indicators

## Parking-Space Tile States

Available:

* Green border
* Green indicator
* Selectable

Occupied:

* Red border
* Red indicator
* Disabled

Reserved:

* Amber border
* Amber indicator
* Disabled or restricted

Maintenance:

* Gray
* Tool icon
* Disabled

Accessible:

* Blue border
* Accessibility icon
* Permission or vehicle requirement where applicable

## Primary Action

```text
Generate Ticket
```

Supporting notice:

> The official entry time will be recorded automatically upon submission.

---

# 24. Ticket Generated Page

## Purpose

Confirm successful entry and display the parking ticket.

## Content

* Success indicator
* Ticket number
* QR code
* Plate number
* Vehicle type
* Entry time
* Assigned parking space
* Facility name
* Ticket instructions

## Actions

* View Ticket
* Print Ticket
* Save as PDF
* Share Ticket
* Register Another Vehicle
* Done

## Ticket Style

Use:

* Receipt-inspired layout
* High-contrast QR code
* Monospace ticket number
* Clear separators
* Minimal branding
* Print-friendly white background

---

# 25. Scan Parking Ticket Page

## Purpose

Allow staff to scan and validate a QR ticket.

## Layout

Desktop:

```text
Scanner Panel | Ticket Details
```

Mobile:

```text
Scanner
Recognized ticket summary
Preview Exit
```

## Scanner Panel

Include:

* Camera frame
* QR alignment guides
* Flashlight control
* Camera selector
* Gallery upload, where supported
* Manual ticket number input

## Scan States

### Initial

> Position the QR code inside the frame.

### Scanning

* Subtle scanning line
* Camera active indicator

### Recognized

* Green frame
* Confirmation vibration
* Ticket details displayed

### Invalid

* Red frame
* Human-readable error
* Scanner stays active

### Completed Ticket

Show:

* Completion time
* Receipt number
* Staff member
* No further processing allowed

## Ticket Details

Display:

* Ticket number
* Plate number
* Vehicle
* Entry time
* Parking space
* Current duration
* Session status

Primary action:

```text
Preview Exit
```

---

# 26. Exit Review Page

## Purpose

Review the active parking session, calculate the fee, record payment, and confirm exit.

## Session Header

Display:

* Ticket number
* Plate number
* Vehicle type
* Parking space
* Session status
* Entry time
* Proposed exit time
* Duration

## Fee Breakdown

Display:

* Base fee
* Additional duration charges
* Discounts
* Penalties
* Total amount due
* Rate explanation

The fee breakdown should be read-only and calculated by the backend.

## Payment Panel

Fields:

* Payment method
* Amount received
* Calculated change
* Optional payment reference
* Receipt number

Primary action:

```text
Record Payment
```

## Exit Confirmation

After successful payment:

```text
PAID — AWAITING EXIT
```

Display:

* Paid amount
* Payment method
* Receipt number
* Payment time

Primary action:

```text
Confirm Vehicle Exit
```

Supporting text:

> Confirming the exit will close the parking session and make the parking space available.

---

# 27. Active Sessions Page

## Purpose

Allow staff to monitor all vehicles currently inside the parking facility.

## KPI Cards

Include:

* Total active sessions
* Pending exits
* Long-stay vehicles
* Payment-pending sessions

## Filters

* Search
* Session status
* Payment status
* Zone
* Vehicle type
* Entry date
* Long-stay filter

## Desktop Table

Columns:

* Ticket number
* Plate number
* Vehicle
* Parking space
* Entry time
* Duration
* Payment status
* Session status
* Staff
* Actions

## Mobile Cards

Each card should include:

* Plate number
* Ticket number
* Parking space
* Duration
* Payment status
* Session status
* View button

## Status Examples

```text
ACTIVE
PAYMENT PENDING
PAID AWAITING EXIT
MANUAL REVIEW
```

---

# 28. Parking Map Page

## Purpose

Display the current status of all parking spaces.

## Filters

* Zone
* Level
* Vehicle type
* Parking-space status
* Accessible spaces
* Search by space code

## Parking-Space Grid

Each tile should show:

* Space code
* Current state
* Optional vehicle icon
* Accessibility icon
* Selected state

## Space Details Panel

Available space:

* Space code
* Zone
* Level
* Vehicle compatibility
* Space type
* Dimensions
* Last updated
* Assign action

Occupied space:

* Plate number
* Ticket number
* Vehicle type
* Entry time
* Current duration
* Session link

Reserved space:

* Reservation information
* Reservation time
* Authorized user
* Release action

Maintenance space:

* Maintenance reason
* Start time
* Expected availability
* Restore action

---

# 29. Payments Page

## Purpose

Review and manage parking payments.

## Content

* Payment search
* Pending payments
* Completed payments
* Voided payments
* Payment-method breakdown
* Shift totals

## Desktop Table

Columns:

* Receipt number
* Ticket number
* Plate number
* Amount
* Payment method
* Payment status
* Staff member
* Payment time
* Actions

## Sensitive Actions

The following actions require permission and confirmation:

* Void payment
* Correct payment method
* Correct payment reference
* Process refund
* Apply manual discount

Every sensitive action must require:

* Reason
* Staff identity
* Optional supervisor approval
* Audit log

---

# 30. Transactions Page

## Purpose

Search and review completed and historical parking transactions.

## Search Options

* Plate number
* Ticket number
* Receipt number
* Payment reference
* Staff member

## Filters

* Date range
* Session status
* Payment status
* Payment method
* Vehicle type
* Parking zone

## Transaction Detail Timeline

```text
Entry created
Ticket generated
Ticket reprinted
Exit ticket scanned
Fee calculated
Payment recorded
Exit confirmed
Session completed
```

Sensitive adjustments must display:

* Previous value
* New value
* Staff member
* Approver
* Reason
* Timestamp

---

# 31. Rate Management Page

## Purpose

Allow administrators to configure parking rates.

## Fields

* Rate name
* Vehicle type
* Grace period
* Initial duration
* Initial fee
* Succeeding interval
* Succeeding fee
* Daily maximum
* Overnight fee
* Lost-ticket fee
* Effective date
* End date
* Active state

## Calculation Preview

The page should include an interactive preview.

Example:

```text
Entry: 8:00 AM
Exit: 11:30 AM
Duration: 3 hours 30 minutes
Calculated fee: ₱75.00
```

The preview must clearly show which rules were applied.

## Saving Rates

Before saving:

* Validate overlapping active rates
* Show affected vehicle types
* Show effective date
* Warn that active sessions retain their original rate snapshot

---

# 32. Staff Management Page

## Purpose

Allow administrators to manage staff accounts and permissions.

## Staff Information

* Full name
* Email address
* Role
* Assigned parking location
* Account status
* Last active
* Current shift
* Created date

## Roles

```text
ADMIN
STAFF
```

Optional:

```text
SUPERVISOR
```

Entry, exit, and cashier are not separate user roles.

## Permissions

Possible permissions:

```text
can_approve_overrides
can_void_payments
can_process_lost_tickets
can_correct_session_times
can_cancel_sessions
```

## Actions

* Create staff
* Edit profile
* Assign role
* Assign permissions
* Disable account
* Reset password
* Review activity

---

# 33. Reports Page

## Recommended Reports

* Daily revenue
* Weekly revenue
* Monthly revenue
* Entries and exits
* Occupancy by hour
* Average parking duration
* Vehicle-type distribution
* Lost tickets
* Manual overrides
* Staff activity
* Payment-method totals
* Long-stay vehicles

## Report Layout

Use:

* Summary cards
* Date filters
* Comparison filters
* Simple charts
* Export actions
* Detailed tables

Charts should only be used when they improve understanding.

---

# 34. Audit Logs Page

## Purpose

Display read-only records of sensitive system actions.

## Filters

* Staff member
* Action
* Entity
* Date range
* Severity
* Parking facility

## Columns

* Timestamp
* Staff
* Action
* Entity
* Previous value
* New value
* Reason
* Device
* IP address

Audit logs must not be editable or deletable from the interface.

---

# 35. Loading States

Use:

* Card skeletons
* Table-row skeletons
* Chart placeholders
* Scanner initialization
* Inline button spinners

Avoid blocking the entire page for small actions.

Examples:

```text
Loading active sessions…
Initializing camera…
Calculating parking fee…
Recording payment…
Confirming vehicle exit…
```

---

# 36. Empty States

## No Active Sessions

> No vehicles are currently parked.

Action:

```text
Register Vehicle Entry
```

## No Transactions Found

> No transactions match the selected filters.

Action:

```text
Clear Filters
```

## No Parking Spaces Configured

> Create a parking zone and add parking spaces to begin accepting vehicles.

Action:

```text
Set Up Parking Spaces
```

## No Reports

> No report data is available for the selected date range.

Action:

```text
Change Date Range
```

---

# 37. Error States

Errors should contain:

* Clear title
* Human-readable message
* Recovery action
* Optional reference code

Example:

> **Parking space is no longer available.**
> Another staff device assigned this space moments ago. Select a different available space.

Other examples:

```text
Ticket is invalid.
Ticket has already been completed.
Payment has already been recorded.
Camera permission was denied.
You are not authorized to perform this action.
Connection was lost before the operation completed.
```

Do not expose:

* Database errors
* SQL messages
* Authentication tokens
* Stack traces
* Internal identifiers

---

# 38. Notifications

Use toasts for:

* Ticket generated
* Payment recorded
* Exit confirmed
* Settings saved
* Ticket copied
* Export started

Use inline alerts for:

* Duplicate active session
* Invalid ticket
* Payment required
* Camera permission denied
* Rate configuration error
* Restricted action

Use persistent banners for:

* Offline mode
* Realtime disconnected
* Shift not started
* System maintenance
* Unsynchronized operations
* New app version available

---

# 39. Offline Design

Offline mode should be clearly visible.

Recommended banner:

> You are offline. Payment and vehicle exit confirmation are unavailable.

Allowed offline behavior:

* Open cached application shell
* View recently cached information
* View previously opened sessions
* Access offline guidance

Online-only actions:

* Create official parking entry
* Record payment
* Confirm vehicle exit
* Change parking rates
* Manage staff
* Perform sensitive overrides

Do not make an offline operation appear successful when it has not reached the server.

---

# 40. PWA Design

## Install Prompt

Use a nonintrusive install prompt:

> Install E-ParkGO for faster access at the parking station.

## Application Update

Display:

> A new version of E-ParkGO is available.

Actions:

```text
Update Now
Later
```

Never force an update during an active payment or exit workflow.

## PWA Navigation

The installed application should:

* Open without browser chrome
* Preserve the active theme
* Support mobile-safe areas
* Use a clear app icon
* Provide an offline fallback page

---

# 41. Motion Design

Recommended motion:

* 150–220 ms transitions
* Smooth sidebar collapse
* Subtle card hover
* Scanner success pulse
* Parking-space status update
* Theme transition
* Dialog entrance and exit

Avoid:

* Bouncing buttons
* Long loading animations
* Continuous animated backgrounds
* Excessive page transitions
* Motion that delays staff workflows

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

---

# 42. Accessibility

Target:

```text
WCAG 2.2 AA
```

Requirements:

* Keyboard-accessible navigation
* Visible focus indicators
* Proper form labels
* Semantic heading order
* Accessible dialogs
* Screen-reader announcements
* High color contrast
* Minimum 44 × 44 px touch targets
* Reduced-motion support
* Text alternatives for icons
* Error summaries
* Manual ticket fallback
* Status labels in addition to colors

The QR scanner must provide:

* Manual ticket entry
* Permission instructions
* Scan-success announcement
* Invalid-scan explanation
* Camera-unavailable fallback

---

# 43. Responsive Breakpoints

Recommended Tailwind breakpoints:

```text
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

| Width         | Layout                                          |
| ------------- | ----------------------------------------------- |
| Mobile        | Bottom navigation, cards, stacked forms         |
| Tablet        | Compact sidebar, two-column operational screens |
| Desktop       | Full sidebar, tables, dashboard grid            |
| Large desktop | Wide monitoring and reporting layout            |

---

# 44. Core Screen Checklist

The initial E-ParkGO interface should include:

1. Login
2. Dashboard
3. New Vehicle Entry
4. Ticket Generated
5. Scan Parking Ticket
6. Exit Review
7. Payment Recording
8. Exit Confirmation
9. Active Sessions
10. Parking Map
11. Transactions
12. Rates
13. Staff Management
14. Reports
15. Audit Logs
16. Settings
17. Offline Page
18. Error Page

---

# 45. Design Handoff Requirements

Before development, the final design handoff should include:

* Desktop frames
* Tablet frames
* Mobile frames
* Light mode
* Dark mode
* Alternate theme examples
* Loading states
* Empty states
* Error states
* Offline states
* Form validation
* Disabled states
* Hover states
* Focus states
* Scanner permission states
* Responsive behavior
* Theme tokens
* Typography
* Icons
* Spacing measurements
* Accessibility notes

---

# 46. Design Definition of Done

A page is ready for implementation when:

* The main purpose is clear.
* The primary action is immediately visible.
* Light and dark mode are defined.
* Mobile and desktop layouts are defined.
* Loading states are included.
* Empty states are included.
* Error states are included.
* Offline behavior is defined.
* Forms include validation states.
* Touch targets are large enough.
* Color contrast is accessible.
* Important statuses include labels.
* Sensitive actions require confirmation.
* Keyboard behavior is documented.
* Realtime updates have visible feedback.
* The page matches the E-ParkGO design system.

---

# 47. Final Design Direction

E-ParkGO should feel like a premium and dependable parking operations platform.

The final interface should be:

```text
Clean
Minimal
Modern
Professional
Responsive
Organized
Accessible
Fast
Secure
Operationally clear
```

Visual appeal must never interfere with staff efficiency.

Every interface decision should support the complete parking journey:

```text
Vehicle Entry
→ Parking Assignment
→ Ticket Generation
→ Active Session
→ QR Scanning
→ Fee Calculation
→ Payment
→ Exit Confirmation
→ Parking-Space Release
```

The design should make this process feel seamless, reliable, and easy to understand across light mode, dark mode, and future custom themes.
