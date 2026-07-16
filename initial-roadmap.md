# Automated Parking Management System Roadmap

## 1. Project Vision

The system will be a **Progressive Web Application parking platform** that automates the complete parking lifecycle:

1. Detect or register a vehicle entering.
2. Create a parking session automatically.
3. Generate a unique QR ticket or receipt.
4. Record the vehicle’s official entry time.
5. Track the vehicle as currently parked.
6. Scan the QR ticket during exit.
7. Calculate parking duration and fees automatically.
8. Confirm payment or exit authorization.
9. Record the official exit time.
10. Close and permanently store the parking transaction.

The system should not merely replace a paper logbook. It should function as a complete parking operations platform with real-time occupancy, staff accountability, automated calculations, audit records, reporting, and optional hardware integrations.

---

# 2. Recommended System Concept

A good project name could be:

**ParkFlow — Automated Parking Operations Platform**

Its main promise would be:

> One scan at entry, one scan at exit, and every parking transaction is automatically recorded, calculated, and verified.

The platform can support three levels of automation.

| Level           | Entry Process                                                | Best Use                |
| --------------- | ------------------------------------------------------------ | ----------------------- |
| Staff-assisted  | Staff enters the plate number and generates the QR ticket    | Initial MVP             |
| Kiosk-assisted  | Driver enters details or scans a generated ticket at a kiosk | Medium automation       |
| Fully automated | Camera recognizes the plate and automatically opens the gate | Advanced implementation |

The project should begin with staff-assisted automation, but its architecture should already support cameras, barriers, printers, and sensors later.

---

# 3. Core Parking Workflow

## Entry Workflow

```text
Vehicle arrives
      ↓
Staff selects “New Vehicle Entry”
      ↓
Vehicle type and plate number are entered
      ↓
System checks for an existing active parking session
      ↓
Available parking space is assigned
      ↓
Parking session is created
      ↓
Entry time is recorded by the server
      ↓
Unique QR ticket is generated
      ↓
Ticket is printed or displayed
      ↓
Parking slot becomes occupied
```

The entry time should not depend on the staff member manually entering a time.

The server should assign the official timestamp when the parking session is successfully created.

Example:

```text
Ticket Number: PK-20260716-00421
Plate Number: ABC 1234
Vehicle Type: Car
Slot: A-017
Entry Time: July 16, 2026, 10:42 PM
Status: Active
QR Reference: Random secure ticket token
```

## Exit Workflow

```text
Vehicle approaches exit
      ↓
Staff opens QR scanner
      ↓
Ticket QR code is scanned
      ↓
System retrieves the active parking session
      ↓
Current server time becomes the proposed exit time
      ↓
Parking duration is calculated
      ↓
Parking fee is calculated
      ↓
Staff reviews the details
      ↓
Payment or exit is confirmed
      ↓
Official exit time is recorded
      ↓
Parking session is closed
      ↓
Parking slot becomes available
      ↓
Digital receipt is generated
```

Scanning should not immediately close the transaction. The staff should first see a confirmation screen to prevent accidental scans.

---

# 4. Important Architectural Principle

The QR code must not contain editable parking details such as:

* Entry time
* Parking fee
* Vehicle plate
* Exit status
* Payment status

Instead, it should contain only a secure ticket reference.

Example:

```text
https://parking.example.com/ticket/verify/4f0bdf86-d876-4e07-a908-95ba08239afe
```

The system uses that reference to retrieve the official information from the database.

This prevents users from modifying a QR code to change their entry time, plate number, or parking fee.

The database remains the source of truth.

---

# 5. Recommended Technology Stack

Based on your current full-stack experience, the following stack would be appropriate.

## Frontend PWA

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui or PrimeReact
* React Query or TanStack Query
* React Router
* Vite PWA Plugin
* Browser camera API for QR scanning
* IndexedDB for offline data
* Workbox for service worker caching

A Next.js PWA is also possible, but React with Vite provides a focused and lightweight structure for a parking operations dashboard.

## Backend

**Recommended: NestJS with TypeScript**

NestJS is suitable because the system will eventually need:

* Authentication
* Role-based permissions
* Multiple parking branches
* Audit logging
* WebSockets
* Hardware integration
* Payment processing
* Background jobs
* Modular architecture

Suggested backend modules:

```text
AuthModule
UsersModule
StaffModule
VehiclesModule
ParkingSessionsModule
ParkingSpacesModule
TicketsModule
RatesModule
PaymentsModule
ReceiptsModule
DevicesModule
ReportsModule
AuditLogsModule
NotificationsModule
```

## Database

**PostgreSQL**

PostgreSQL is a good fit because parking transactions are highly relational and require reliable consistency.

Optional supporting technologies:

* Redis for real-time occupancy caching
* BullMQ for background jobs
* WebSockets for live dashboard updates
* Docker for deployment
* Supabase PostgreSQL, Neon, or managed PostgreSQL
* Vercel for the PWA
* Railway, Render, Fly.io, or Google Cloud Run for the backend

---

# 6. High-Level System Architecture

```text
┌───────────────────────────────────────────┐
│               Parking PWA                 │
│                                           │
│ Entry • Exit • Scanner • Dashboard        │
│ Reports • Rates • Staff • Settings        │
└───────────────────┬───────────────────────┘
                    │ HTTPS / WebSocket
                    ▼
┌───────────────────────────────────────────┐
│              NestJS Backend               │
│                                           │
│ Authentication                            │
│ Parking Session Engine                    │
│ Ticket Generator                          │
│ Fee Calculation Engine                    │
│ Payment and Receipt Service               │
│ Occupancy Service                         │
│ Audit and Reporting Service               │
└──────────────┬──────────────┬─────────────┘
               │              │
               ▼              ▼
┌──────────────────────┐  ┌─────────────────┐
│ PostgreSQL Database  │  │ Redis / Queue   │
│                      │  │                 │
│ Sessions             │  │ Live occupancy  │
│ Tickets              │  │ Background jobs │
│ Vehicles             │  │ Temporary cache │
│ Payments             │  └─────────────────┘
│ Audit logs           │
└──────────────────────┘
               ▲
               │
┌──────────────┴────────────────────────────┐
│ Optional Hardware Integration Layer       │
│                                           │
│ QR printer • Plate camera • Gate barrier  │
│ Occupancy sensor • Payment terminal       │
└───────────────────────────────────────────┘
```

A browser-based PWA can use a phone or tablet camera for QR scanning. However, direct control of barrier gates, receipt printers, USB devices, and entrance sensors may require a local device service or IoT gateway.

---

# 7. Main User Roles

## Administrator

The administrator can:

* Configure parking locations
* Create parking zones and spaces
* Configure rates
* Manage staff accounts
* View all transactions
* Review audit logs
* Generate reports
* Override parking sessions
* Manage hardware devices
* Configure penalties and lost-ticket rules

## Entry Staff

Entry staff can:

* Register incoming vehicles
* Generate QR tickets
* Assign parking slots
* Reprint active tickets
* View current occupancy
* Report entry-related incidents

## Exit or Cashier Staff

Exit staff can:

* Scan QR tickets
* View parking details
* Calculate fees
* Record payments
* Confirm exits
* Generate receipts
* Handle lost tickets with authorization

## Supervisor

The supervisor can:

* Approve manual corrections
* Approve lost-ticket transactions
* Void incorrect transactions
* Review shift totals
* Inspect staff activity
* Resolve duplicate or disputed sessions

---

# 8. Core Database Structure

## `users`

```text
id
first_name
last_name
email
password_hash
role_id
parking_location_id
is_active
created_at
updated_at
```

## `roles`

```text
id
name
description
```

Example roles:

```text
ADMIN
SUPERVISOR
ENTRY_STAFF
EXIT_STAFF
CASHIER
```

## `parking_locations`

Used when the platform supports multiple parking branches.

```text
id
name
address
timezone
operating_status
created_at
```

## `parking_zones`

Examples: Basement A, Outdoor B, VIP Area.

```text
id
parking_location_id
name
description
```

## `parking_spaces`

```text
id
zone_id
space_code
vehicle_type
status
is_accessible
is_reserved
created_at
```

Possible statuses:

```text
AVAILABLE
OCCUPIED
RESERVED
BLOCKED
MAINTENANCE
```

## `vehicles`

```text
id
plate_number
vehicle_type
color
brand
model
owner_name
owner_contact
created_at
updated_at
```

The owner information can remain optional for ordinary walk-in parking.

## `parking_sessions`

This is the most important table.

```text
id
ticket_id
vehicle_id
parking_space_id
parking_location_id
entry_staff_id
exit_staff_id
entry_time
exit_time
status
entry_method
exit_method
total_minutes
subtotal
discount_amount
penalty_amount
total_amount
payment_status
created_at
updated_at
```

Possible session statuses:

```text
ACTIVE
EXIT_PENDING
PAYMENT_PENDING
COMPLETED
CANCELLED
LOST_TICKET
MANUAL_REVIEW
```

## `parking_tickets`

```text
id
session_id
ticket_number
qr_token_hash
issued_at
printed_at
reprint_count
expires_at
status
```

The system should store a hash of the QR token rather than exposing sensitive identifiers directly.

## `parking_rates`

```text
id
parking_location_id
vehicle_type
rate_name
initial_minutes
initial_fee
succeeding_minutes
succeeding_fee
daily_maximum
grace_period_minutes
lost_ticket_fee
overnight_fee
effective_from
effective_until
is_active
```

## `payments`

```text
id
parking_session_id
receipt_number
amount_due
amount_paid
change_amount
payment_method
reference_number
cashier_id
payment_status
paid_at
created_at
```

Possible payment methods:

```text
CASH
GCASH
MAYA
CARD
BANK_TRANSFER
COMPLIMENTARY
```

## `audit_logs`

```text
id
user_id
action
entity_type
entity_id
old_values
new_values
ip_address
device_information
created_at
```

This records actions such as:

* Ticket reprinted
* Entry time corrected
* Session manually closed
* Payment voided
* Lost ticket approved
* Parking fee overridden
* Slot manually changed

## `staff_shifts`

```text
id
staff_id
parking_location_id
started_at
ended_at
opening_cash
closing_cash
expected_cash
actual_cash
status
```

This will allow the system to reconcile cashier activity.

---

# 9. Parking Session State Machine

Parking sessions should follow controlled status transitions.

```text
CREATED
   ↓
ACTIVE
   ↓
EXIT_PENDING
   ↓
PAYMENT_PENDING
   ↓
COMPLETED
```

Alternative paths:

```text
ACTIVE → LOST_TICKET → MANUAL_REVIEW → COMPLETED

ACTIVE → CANCELLED

EXIT_PENDING → ACTIVE
```

The backend must reject invalid transitions.

For example:

* A completed ticket cannot be scanned again.
* A cancelled ticket cannot be used for exit.
* A ticket belonging to another parking branch cannot be accepted.
* An active vehicle cannot receive another active ticket.
* A parking slot cannot be assigned to two active sessions.

---

# 10. Fee Calculation Engine

The parking rate should not be hard-coded inside the frontend.

The backend should calculate the fee using configurable rate rules.

Example rate:

```text
First 3 hours: ₱50
Every succeeding hour: ₱20
Grace period: 15 minutes
Daily maximum: ₱300
Lost ticket penalty: ₱200
```

Example calculation:

```text
Entry: 9:10 AM
Exit: 1:45 PM
Duration: 4 hours and 35 minutes

Initial 3 hours: ₱50
Remaining 1 hour and 35 minutes:
Rounded to 2 billing hours × ₱20 = ₱40

Total: ₱90
```

The system should store both the result and the rate configuration used at the time of calculation. This ensures that historical receipts remain correct even when rates are changed later.

---

# 11. PWA Application Screens

## Authentication

* Login
* Forgot password
* Device authorization
* Staff shift start

## Dashboard

The dashboard should show:

* Total parking capacity
* Currently occupied spaces
* Available spaces
* Occupancy percentage
* Vehicles entered today
* Vehicles exited today
* Active parking sessions
* Revenue today
* Average parking duration
* Pending exit confirmations
* Parking zones with occupancy indicators

## Vehicle Entry Screen

Recommended interface:

```text
Plate Number
Vehicle Type
Vehicle Color
Preferred Zone
Parking Slot
Generate Ticket
```

The plate-number input should automatically convert text to uppercase and remove unnecessary spaces.

After submission:

* Session is created.
* Slot becomes occupied.
* QR ticket appears.
* Print button becomes available.
* Dashboard updates in real time.

## QR Ticket Screen

The ticket should contain:

* Parking establishment
* Ticket number
* QR code
* Plate number
* Vehicle type
* Parking slot
* Entry time
* Basic lost-ticket notice
* Verification instructions

The QR should remain readable from both printed paper and a phone screen.

## Exit Scanner Screen

The scanner should:

* Use the phone or tablet camera
* Scan continuously
* Detect duplicate scans
* Vibrate or play a confirmation sound
* Show invalid-ticket warnings
* Retrieve the active parking session
* Display a clear confirmation page

## Exit Confirmation Screen

It should display:

* Ticket number
* Plate number
* Entry time
* Proposed exit time
* Total duration
* Rate used
* Parking fee
* Payment status
* Confirm payment
* Confirm vehicle exit

## Parking Map

The map can visually display spaces as:

```text
Green  = Available
Red    = Occupied
Yellow = Reserved
Gray   = Unavailable
Blue   = Accessible parking
```

## Transaction History

Search and filter by:

* Ticket number
* Plate number
* Date
* Staff member
* Parking zone
* Payment status
* Session status
* Payment method

## Reports

Reports may include:

* Daily revenue
* Weekly and monthly revenue
* Occupancy trends
* Peak entry hours
* Average parking duration
* Vehicle-type breakdown
* Lost-ticket incidents
* Manual overrides
* Staff transaction totals
* Payment-method totals

---

# 12. API Structure

## Entry

```text
POST /parking-sessions/entry
```

Example request:

```json
{
  "plateNumber": "ABC 1234",
  "vehicleType": "CAR",
  "parkingSpaceId": "space-uuid"
}
```

The backend should:

1. Validate the plate number.
2. Check for an existing active session.
3. Check if the slot is available.
4. Create or retrieve the vehicle.
5. Generate the ticket.
6. Record server entry time.
7. Occupy the selected space.
8. Return the QR ticket information.

## Ticket Validation

```text
POST /parking-tickets/validate
```

The request sends the QR token.

The response returns the active parking session without closing it.

## Exit Calculation

```text
POST /parking-sessions/:id/calculate-exit
```

This produces a proposed exit time, duration, and fee.

It should not yet finalize the session.

## Payment

```text
POST /parking-sessions/:id/payments
```

This records payment and generates a receipt.

## Exit Confirmation

```text
POST /parking-sessions/:id/confirm-exit
```

The backend should:

1. Verify the session is active.
2. Verify payment requirements.
3. Record the official server exit time.
4. Calculate the final duration.
5. Close the parking session.
6. Release the parking slot.
7. Create an audit record.
8. Notify connected dashboards.

---

# 13. Offline-First PWA Strategy

Parking systems must remain usable during temporary internet problems.

The PWA can cache:

* Application interface
* Parking-rate information
* Parking-space list
* Recent active sessions
* Staff authentication session
* Pending local operations

However, offline entry creation introduces duplicate-ticket risks.

A safe offline approach is:

1. Each authorized device receives a unique device identifier.
2. Offline tickets use device-prefixed ticket numbers.
3. Transactions are saved in IndexedDB.
4. The PWA marks them as pending synchronization.
5. When the connection returns, the backend validates and synchronizes them.
6. Conflicts are sent for supervisor review.

Example offline ticket number:

```text
OFF-ENTRY01-20260716-0007
```

For the initial MVP, exit confirmation may require a connection because payment verification and duplicate prevention are more critical during exit.

---

# 14. Hardware Automation Roadmap

## Stage 1: Staff Device

Equipment:

* Android phone or tablet
* Bluetooth or network thermal printer
* PWA camera scanner

The staff manually registers the plate, while ticket generation and time recording are automatic.

## Stage 2: Entry Kiosk

Equipment:

* Touchscreen kiosk
* QR printer
* Vehicle-presence sensor
* Barrier gate

Flow:

```text
Sensor detects vehicle
      ↓
Kiosk requests vehicle information
      ↓
Ticket is generated
      ↓
Barrier opens
```

## Stage 3: License Plate Recognition

Equipment:

* Entry camera
* Exit camera
* Local recognition service
* Barrier controller

Flow:

```text
Camera captures plate
      ↓
Recognition service reads plate
      ↓
Backend creates session
      ↓
Digital or printed ticket is generated
      ↓
Barrier opens
```

At exit:

```text
Camera reads plate
      ↓
System searches for active session
      ↓
QR or plate is used as verification
      ↓
Payment is confirmed
      ↓
Barrier opens
```

The QR ticket remains a fallback when plate recognition is inaccurate.

## Stage 4: Parking Space Sensors

Sensors can report whether each physical parking slot is occupied.

This allows the system to compare:

```text
Database says slot is available
Physical sensor says slot is occupied
```

Any mismatch can generate an operational alert.

---

# 15. Security and Fraud Prevention

The system should include:

* HTTPS for every request
* Secure password hashing
* Role-based access control
* Short-lived access tokens
* Refresh-token rotation
* QR token hashing
* Rate limiting
* Device authorization
* Audit logs
* Server-generated timestamps
* Server-side fee calculations
* Database transactions
* Duplicate active-session prevention
* Restricted manual overrides
* Supervisor approval for sensitive actions

Sensitive actions should require a reason.

Example:

```text
Action: Correct entry time
Old value: 9:42 AM
New value: 9:30 AM
Reason: Entry device was temporarily offline
Approved by: Supervisor
```

Staff members should never be allowed to silently edit historical transactions.

---

# 16. Critical Edge Cases

The system must prepare for the following situations.

## Lost Ticket

Staff searches by:

* Plate number
* Vehicle description
* Approximate entry time
* Parking location
* Entry camera record

A supervisor approves the lost-ticket process and penalty.

## Duplicate Ticket Scan

The scanner displays:

```text
This parking session was completed at 3:42 PM.
Receipt: RCPT-20260716-00821
```

## Wrong Parking Branch

A ticket issued at Branch A cannot be processed at Branch B unless the administrator explicitly allows cross-branch exits.

## Vehicle Without a Plate

The system can generate a temporary identifier based on:

* Vehicle type
* Color
* Brand
* Entry image
* Temporary ticket number

## Printer Failure

The system can:

* Display the QR on the customer’s phone
* Send the ticket by SMS or email
* Allow a reprint
* Record every reprint in the audit log

## Internet Failure

The entry device can generate a controlled offline ticket and synchronize it later.

## Early Grace-Period Exit

If the vehicle exits within the configured grace period, the system may charge zero while still creating a completed transaction.

## Payment Made but Exit Not Confirmed

The session becomes:

```text
PAID_AWAITING_EXIT
```

It should not automatically free the parking space until the vehicle actually exits.

## Staff Accidentally Scans the Wrong Ticket

The scan first opens a review screen. Only the confirmation action records the exit.

---

# 17. Development Roadmap

## Phase 1: Planning and System Design

Create:

* Product requirements document
* User-role definitions
* Entry and exit workflows
* Parking-rate rules
* Entity relationship diagram
* System architecture diagram
* Screen map
* API contract
* Session status rules

The most important outcome is a clearly defined parking-session lifecycle.

## Phase 2: Backend Foundation

Build:

* NestJS project
* PostgreSQL database
* Authentication
* Role-based authorization
* User and staff management
* Parking location management
* Parking zone and space management
* Audit-log foundation

## Phase 3: Core Parking Engine

Build:

* Vehicle registration
* Parking-session creation
* Server-generated entry time
* Duplicate session validation
* Slot assignment
* Ticket-number generation
* Secure QR-token generation
* Active-session management

At this stage, a vehicle should be able to enter and receive a valid QR ticket.

## Phase 4: Exit and Fee Calculation

Build:

* QR scanning
* Ticket validation
* Duration calculation
* Parking-rate engine
* Exit review
* Exit confirmation
* Slot release
* Completed transaction records

At this stage, the complete entry-to-exit workflow should function.

## Phase 5: Payments and Receipts

Build:

* Cash payment recording
* Digital payment references
* Receipt generation
* Payment history
* Shift cash reconciliation
* Refund and void workflow
* Supervisor approval

## Phase 6: PWA Capabilities

Implement:

* Installable PWA
* Service worker
* Cached interface
* IndexedDB
* Offline-entry queue
* Connection indicators
* Synchronization status
* Device registration
* Camera permissions
* QR scanner optimization

## Phase 7: Dashboard and Reports

Build:

* Live occupancy dashboard
* Revenue dashboard
* Parking-space map
* Transaction search
* CSV and PDF exports
* Staff performance report
* Occupancy analytics
* Peak-hour analysis

## Phase 8: Operational Hardening

Add:

* Lost-ticket workflow
* Manual override approvals
* Duplicate scan protection
* Printer failure handling
* Offline conflict resolution
* Alerting
* Backup and recovery
* Audit review tools
* Database transaction protection

## Phase 9: Hardware Integration

Integrate progressively:

1. Thermal ticket printer
2. Entrance and exit tablets
3. Vehicle-presence sensors
4. Barrier controller
5. License-plate camera
6. Parking-space occupancy sensors

## Phase 10: Multi-Branch and Production Scaling

Add:

* Multiple parking locations
* Branch-specific rates
* Branch-specific staff
* Central administrator dashboard
* Device monitoring
* Queue processing
* Centralized logging
* Automated backups
* Monitoring and error tracking

---

# 18. Recommended MVP

The MVP should focus on proving the complete parking lifecycle.

## Include

* Staff authentication
* Entry and exit staff roles
* Parking-space management
* Vehicle entry registration
* Automatic server-based entry time
* QR ticket generation
* QR scanning through the PWA camera
* Automatic exit-time proposal
* Duration calculation
* Configurable parking rates
* Fee calculation
* Cash payment recording
* Exit confirmation
* Parking-space release
* Digital receipt
* Active-session dashboard
* Basic daily reports
* Audit logs

## Exclude Initially

* License plate recognition
* Automated barrier gates
* Parking-space sensors
* Online reservations
* Customer mobile application
* Advanced subscriptions
* AI-powered predictions
* Complex dynamic pricing
* Multiple parking branches

These features can be added once the basic parking transaction engine is stable.

---

# 19. Features That Make the System “Built Different”

After the MVP, the system can become more advanced through the following capabilities.

## Ticketless Parking

Returning users can register their plate number and exit using plate recognition rather than a physical QR ticket.

## Smart Space Recommendation

The system recommends a slot based on:

* Vehicle size
* Distance from entrance
* Accessible-parking requirements
* Current congestion
* Expected parking duration

## Real-Time Parking Map

Staff can see the exact status of each space and identify occupancy mismatches.

## Predictive Occupancy

Historical data can estimate:

* Expected peak hours
* Expected available spaces
* Typical parking durations
* Staffing requirements

## Digital Customer Ticket

Drivers can receive their ticket through:

* QR display
* SMS
* Email
* Installable customer PWA

## Exit Queue Management

The platform can monitor how many vehicles are waiting and direct staff to open another exit lane.

## Fraud Detection

The system can flag:

* Repeated lost-ticket claims
* Frequent staff overrides
* Unusual fee reductions
* Payment and exit mismatches
* Duplicate vehicle sessions
* Suspicious ticket reprints

## Emergency Mode

During emergencies, authorized staff can open barriers while the system continues logging every manual release.

## Memberships and Subscriptions

Regular customers can receive:

* Monthly parking plans
* Reserved spaces
* Automatic billing
* Entry through registered plates
* Usage history

---

# 20. Suggested Project Structure

```text
parking-management-system/
│
├── apps/
│   ├── parking-pwa/
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── entry/
│   │   │   │   ├── exit/
│   │   │   │   ├── scanner/
│   │   │   │   ├── parking-map/
│   │   │   │   ├── payments/
│   │   │   │   └── reports/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── offline/
│   │   │   └── routes/
│   │   └── public/
│   │
│   └── parking-api/
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── vehicles/
│           ├── parking-sessions/
│           ├── parking-spaces/
│           ├── tickets/
│           ├── rates/
│           ├── payments/
│           ├── reports/
│           ├── audit-logs/
│           └── devices/
│
├── packages/
│   ├── shared-types/
│   ├── validation/
│   ├── database/
│   └── ui/
│
├── docker/
├── documentation/
└── tests/
```

A monorepo structure will make it easier to share TypeScript types, validation schemas, and business rules between the PWA and backend.

---

# 21. Final MVP Success Criteria

The MVP can be considered successful when:

1. A staff member can register a vehicle in less than a few seconds.
2. The system generates a unique and secure QR ticket.
3. Entry time is recorded automatically by the backend.
4. A parking space cannot be assigned twice.
5. An active vehicle cannot receive duplicate active sessions.
6. Exit staff can scan the ticket using a phone or tablet.
7. The system retrieves the correct parking transaction.
8. Duration and fees are calculated without manual computation.
9. Payment and exit confirmation are recorded separately.
10. The slot becomes available only after confirmed exit.
11. Completed tickets cannot be reused.
12. Every sensitive staff action is auditable.
13. The dashboard reflects occupancy changes in real time.
14. Historical transactions remain searchable and reportable.

The heart of the entire system is not the QR scanner or the ticket printer. It is the **parking-session engine** that reliably controls each vehicle from entry to completed exit.
