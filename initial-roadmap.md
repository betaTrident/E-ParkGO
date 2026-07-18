# E-ParkGO: Serverless Parking Management System

## Project Summary

**E-ParkGO** is an automated, serverless parking management system delivered as an installable Progressive Web Application.

Instead of manually recording vehicle entry times, exit times, parking durations, and fees, the system automatically manages the complete parking lifecycle:

1. A staff member registers an arriving vehicle.
2. The system creates a parking session.
3. The database records the official server-generated entry time.
4. A unique QR parking ticket is generated.
5. The assigned parking space is marked as occupied.
6. A staff member scans the QR ticket when the vehicle is ready to leave.
7. The system retrieves the active parking session.
8. Parking duration and fees are calculated automatically.
9. The staff member records the payment and confirms the vehicle exit.
10. The database records the official exit time and closes the session.
11. The parking space becomes available again.

The same staff account may handle vehicle entry, ticket generation, payment collection, QR scanning, and exit confirmation. These are operational responsibilities rather than separate user roles.

The system will work on phones, tablets, laptops, and desktop computers without requiring separate native Android or iOS applications.

---

# Recommended Serverless Architecture

```text
Staff Phone / Tablet / Computer
              │
              ▼
┌────────────────────────────────────┐
│         Next.js E-ParkGO PWA       │
│                                    │
│ Entry • QR Scanner • Exit          │
│ Dashboard • Parking Map • Reports  │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│             Supabase               │
│                                    │
│ Authentication                     │
│ PostgreSQL Database                │
│ Database Functions                 │
│ Edge Functions                     │
│ Realtime Updates                   │
│ File Storage                       │
└─────────────────┬──────────────────┘
                  │
                  ▼
       Optional Future Hardware

 QR Printer • Plate Camera • Gate Barrier
```

The PWA will be deployed on **Vercel**, while Supabase will provide the database and backend services.

There will be no traditional VPS, Express server, NestJS server, or manually maintained cloud server during the MVP.

---

# Recommended Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Application framework | Next.js with App Router | PWA interface, routing, and server-rendered pages |
| Programming language | TypeScript | Type-safe frontend and backend logic |
| UI styling | Tailwind CSS | Responsive interface design |
| Component library | shadcn/ui | Dashboard, dialogs, tables, forms, and controls |
| Icons | Lucide React | Interface icons |
| Form management | React Hook Form | Entry, payment, and configuration forms |
| Validation | Zod | Client-side and server-side validation |
| Hosting | Vercel | Frontend deployment, HTTPS, CDN, and CI/CD |
| Database | Supabase PostgreSQL | Parking sessions, tickets, vehicles, rates, and payments |
| Authentication | Supabase Auth | Secure administrator and staff login |
| Authorization | PostgreSQL Row Level Security | Role-based and branch-based data access |
| Backend logic | Supabase Edge Functions | Secure server-only operations |
| Transaction logic | PostgreSQL functions or RPC | Atomic entry, payment, and exit operations |
| Live dashboard | Supabase Realtime | Instant occupancy and transaction updates |
| File storage | Supabase Storage | Optional receipts, vehicle images, and exports |
| QR generation | QR-code generation package | Generate secure parking ticket QR codes |
| QR scanning | Browser camera scanner | Scan tickets through phones or tablets |
| Offline storage | IndexedDB | Cache application data and pending operations |
| PWA support | Web app manifest and service worker | Installation, caching, and limited offline operation |
| Testing | Vitest and Playwright | Unit, integration, and end-to-end workflow tests |
| Source control | GitHub | Version control and automated Vercel deployment |

Next.js will provide the application interface, routing, and PWA foundation. A web app manifest and service worker will allow E-ParkGO to be installed on supported devices and provide cached application resources.

---

# Responsibilities of Each Platform

## Vercel

Vercel will handle:

- Hosting the Next.js PWA
- HTTPS and SSL certificates
- Global CDN delivery
- Automatic deployments from GitHub
- Preview deployments
- Static asset caching
- Security and response headers
- Lightweight Next.js Route Handlers when necessary

Most business logic should remain in Supabase so that Vercel primarily serves the application interface. This reduces Vercel function usage and keeps the architecture simpler.

## Supabase

Supabase will provide:

- PostgreSQL database
- Administrator and staff authentication
- Role-based database access
- Parking transaction processing
- Realtime occupancy updates
- Serverless Edge Functions
- Receipt and file storage
- Database triggers and constraints
- Audit records

Supabase Edge Functions are appropriate for secure QR validation, receipt generation, webhooks, payment integrations, notifications, and operations that must not run directly in the browser.

Supabase Realtime can listen to selected database changes so connected dashboards update when a vehicle enters, pays, exits, or changes parking spaces.

---

# Core Application Modules

## 1. Authentication and Staff Management

E-ParkGO will use generalized user roles.

### Recommended MVP Roles

```text
ADMIN
STAFF
```

### Optional Extended Role

```text
SUPERVISOR
```

The supervisor role may be added when the parking facility requires separate approval authority.

### Administrator

Administrators can:

- Manage staff accounts
- Configure parking rates
- Manage parking zones and spaces
- View reports and transaction history
- Configure system settings
- Review audit logs
- Approve sensitive corrections when no supervisor role is used

### Staff

Staff members can perform the complete daily parking workflow, including:

- Registering arriving vehicles
- Creating parking sessions
- Generating and printing QR tickets
- Assigning parking spaces
- Scanning tickets during vehicle exit
- Reviewing parking duration and fees
- Recording customer payments
- Confirming vehicle exits
- Reprinting active tickets
- Handling basic parking operations

Entry processing, exit processing, and cashiering are responsibilities assigned to staff members rather than separate system roles.

The same staff member may perform one or several responsibilities depending on the parking facility, assigned station, or work shift.

### Optional Supervisor

A supervisor can approve sensitive actions such as:

- Lost-ticket processing
- Fee overrides
- Transaction cancellation
- Payment voiding
- Manual time corrections
- Completed-session corrections

For a simpler MVP, supervisor capabilities may instead be assigned to selected staff members through permissions such as:

```text
can_approve_overrides
can_void_payments
can_process_lost_tickets
can_correct_session_times
```

The system must record which staff member performed each action. A parking transaction may therefore include:

```text
entry_processed_by
payment_processed_by
exit_processed_by
override_approved_by
```

These fields may reference the same staff account or different staff accounts.

---

## 2. Vehicle Entry

The staff member enters:

- Plate number
- Vehicle type
- Vehicle color
- Assigned parking space

The backend then:

1. Normalizes the plate number.
2. Checks for an existing active parking session.
3. Confirms that the parking space is available.
4. Creates or retrieves the vehicle record.
5. Creates the parking session.
6. Records the database server time.
7. Generates a unique ticket number and secure QR token.
8. Marks the parking space as occupied.
9. Returns the printable or digital ticket.

The frontend must never supply the official entry timestamp. PostgreSQL should generate it using the database server time.

---

## 3. QR Parking Ticket

The QR code should contain only an opaque secure token or verification URL.

Example:

```text
https://e-parkgo.vercel.app/verify/7c52f7d2...
```

It should not directly contain:

- Entry time
- Exit time
- Parking fee
- Payment status
- Staff account
- Editable parking information

The QR token should be randomly generated, and its hashed representation should be stored in the database.

Changing information inside a locally generated QR code will therefore not change the official parking record.

---

## 4. Vehicle Exit

A staff member scans the ticket using the PWA camera.

The system will:

1. Validate the secure QR token.
2. Retrieve the active parking session.
3. Display the plate number and vehicle details.
4. Generate a proposed exit time using the server clock.
5. Calculate the parking duration.
6. Apply the correct parking rate.
7. Display the total amount due.
8. Wait for staff confirmation.
9. Record the payment.
10. Record the official exit time.
11. Close the parking session.
12. Release the parking space.

Scanning alone should not immediately complete the exit. A confirmation screen prevents accidental or duplicate scans.

---

## 5. Parking Fee Engine

Parking rates will be configurable rather than hard-coded.

The system can support:

- Grace periods
- Initial parking fees
- Succeeding hourly rates
- Different rates for different vehicle types
- Flat-rate parking
- Overnight fees
- Daily maximum charges
- Lost-ticket penalties
- Discounts
- Complimentary parking

The backend—not the browser—must perform the final fee calculation.

A snapshot of the applied rate should be stored with the transaction so that previous receipts remain correct even after an administrator changes the active rates.

---

## 6. Live Parking Dashboard

The dashboard will show:

- Total parking capacity
- Available spaces
- Occupied spaces
- Occupancy percentage
- Active parking sessions
- Vehicles entered today
- Vehicles exited today
- Revenue today
- Pending payments
- Paid vehicles waiting to exit
- Parking zones and space statuses

Supabase Realtime should publish only the necessary occupancy and transaction changes instead of repeatedly refreshing the entire dashboard.

---

# Main Database Tables

The MVP will use approximately the following tables:

```text
profiles
staff_permissions
parking_locations
parking_zones
parking_spaces
vehicles
parking_sessions
parking_tickets
parking_rates
payments
receipts
staff_shifts
audit_logs
devices
```

The `profiles` table will store the generalized account role:

```text
ADMIN
STAFF
SUPERVISOR
```

The `SUPERVISOR` value may be omitted from the initial MVP.

The central table is `parking_sessions`.

It should contain:

```text
id
ticket_id
vehicle_id
parking_space_id
parking_location_id
entry_processed_by
payment_processed_by
exit_processed_by
override_approved_by
entry_time
exit_time
status
total_minutes
subtotal
discount_amount
penalty_amount
total_amount
payment_status
created_at
updated_at
```

Important parking session statuses include:

```text
ACTIVE
EXIT_PENDING
PAYMENT_PENDING
PAID_AWAITING_EXIT
COMPLETED
CANCELLED
LOST_TICKET
MANUAL_REVIEW
```

---

# Secure Transaction Design

Critical operations should use PostgreSQL functions or Supabase Edge Functions.

Examples:

```text
create_parking_entry()
calculate_parking_exit()
record_parking_payment()
confirm_vehicle_exit()
cancel_parking_session()
approve_lost_ticket()
```

Each function should validate the complete operation and apply related database changes within one transaction.

For example, `confirm_vehicle_exit()` should atomically:

1. Confirm that the session is still active.
2. Validate payment requirements.
3. Record the official server exit time.
4. Calculate the final duration.
5. Mark the session as completed.
6. Mark the parking space as available.
7. Record which staff member confirmed the exit.
8. Create an audit record.

This prevents the parking session from being completed while its space incorrectly remains occupied because another database operation failed.

---

# Security Strategy

## Row Level Security

Row Level Security must be enabled on every exposed Supabase table.

Example authorization rules:

- Staff can create vehicle entries.
- Staff can scan tickets and record payments.
- Staff can confirm valid vehicle exits.
- Ordinary staff cannot modify parking rates or system settings.
- Only administrators or authorized approvers can perform sensitive overrides.
- Administrators can manage the entire parking facility.
- Staff can only access the parking location assigned to them.

Role checks should use trusted authorization data, such as Supabase application metadata or protected profile records, rather than user-editable metadata.

## Additional Security Measures

The system should implement:

- Secure Supabase Auth sessions
- Password hashing handled by Supabase Auth
- Role-based RLS policies
- Server-generated timestamps
- Secure random QR tokens
- Hashed QR-token storage
- Rate limiting on scan and validation endpoints
- Input validation with Zod
- Database constraints
- Audit logging
- Restricted service-role credentials
- HTTP security headers
- Duplicate request prevention
- Idempotency keys for entry, payment, and exit operations
- Approval permissions for sensitive staff actions

The Supabase service-role or secret key must never appear in the browser. It should only be available inside secure Edge Functions or trusted server-side environments.

---

# Reliability Strategy

A free serverless platform alone does not guarantee reliability. The application itself must prevent inconsistent data.

The system should include:

- PostgreSQL transactions
- Unique ticket constraints
- Duplicate active-session prevention
- Unique payment references
- Idempotent entry and exit functions
- Automatic retries for temporary connection failures
- Offline operation indicators
- Pending synchronization queues
- Audit records for every sensitive operation
- Daily manual or automated database exports
- Error monitoring
- Clear recovery workflows

Exit transactions should require an internet connection during the MVP. Offline exit confirmation creates greater risks involving duplicate payments, reused tickets, and inconsistent parking-space statuses.

Vehicle entry can later support controlled offline ticket generation using IndexedDB and device-prefixed ticket numbers.

---

# Performance and Optimization

## Database Optimization

Add indexes for commonly searched columns:

```text
parking_sessions.status
parking_sessions.entry_time
parking_sessions.exit_time
parking_sessions.parking_location_id
parking_tickets.ticket_number
parking_tickets.qr_token_hash
vehicles.normalized_plate_number
payments.receipt_number
parking_spaces.status
```

Use a partial unique index to prevent the same vehicle from having multiple active parking sessions.

Use database transactions and locking rules to prevent two staff devices from assigning the same parking space simultaneously.

## Frontend Optimization

- Cache the PWA shell and static assets.
- Load dashboard sections only when needed.
- Paginate transaction histories.
- Use server-rendered pages where interactivity is unnecessary.
- Use client components only for scanners, forms, and live dashboards.
- Compress icons and images.
- Avoid storing unnecessary vehicle photos.
- Cache stable configuration such as vehicle types and parking zones.
- Display optimistic updates only when they can safely be corrected.

## Realtime Optimization

Do not enable database-change subscriptions for every table.

Realtime should primarily cover:

- Parking-space status
- Active parking sessions
- Payment confirmation
- Exit confirmation
- Operational alerts

Reports and historical transactions should use normal paginated database queries.

---

# Free Deployment Plan

## Vercel Hobby

Vercel Hobby can be used for:

- Automatic CI/CD
- CDN delivery
- HTTPS
- Preview deployments
- Development and demonstration hosting
- Student, portfolio, and non-commercial prototype use

The Hobby plan is best suited for development, a capstone, a portfolio project, demonstrations, and a small non-commercial pilot.

A commercial parking operation may eventually require a paid Vercel plan or another eligible hosting setup, depending on usage and platform terms.

## Supabase Free

Supabase Free can initially provide:

- PostgreSQL database hosting
- Authentication
- API access
- Realtime features
- Edge Function usage
- File storage
- Development projects

The free tier should be sufficient for development, testing, demonstrations, and a small pilot.

However, free-tier infrastructure may have limitations involving:

- Database size
- File storage
- Realtime connections and messages
- Edge Function usage
- Log retention
- Automated backups
- Inactive project pausing
- Uptime guarantees

Therefore, E-ParkGO can initially operate at approximately **₱0 per month** for a student project, proof of concept, portfolio application, or limited non-commercial pilot.

A real commercial deployment should eventually include paid infrastructure, automated backups, longer log retention, monitoring, and stronger uptime guarantees.

---

# Recommended MVP Scope

The first version should include:

- Administrator and staff login
- Generalized staff role
- Optional staff approval permissions
- Parking-zone and space management
- Vehicle entry registration
- Automatic server entry time
- QR ticket generation
- Printable ticket layout
- Camera-based QR scanning
- Automatic duration calculation
- Configurable parking rates
- Cash payment recording
- Exit confirmation
- Automatic parking-space release
- Active parking dashboard
- Transaction history
- Daily revenue report
- Lost-ticket workflow
- Audit logs
- Installable PWA

The following should be postponed:

- Automatic plate recognition
- Barrier-gate integration
- Physical parking sensors
- Customer reservations
- Mobile payment API integration
- Multi-branch management
- Monthly subscriptions
- AI occupancy prediction

---

# Final Recommended Setup

```text
Application Name
E-ParkGO

Frontend and PWA
Next.js + TypeScript + Tailwind CSS + shadcn/ui

Deployment
Vercel connected to GitHub

Database
Supabase PostgreSQL

Authentication
Supabase Auth

User Roles
ADMIN + STAFF
Optional: SUPERVISOR or staff approval permissions

Authorization
PostgreSQL Row Level Security

Secure Backend Operations
Supabase Edge Functions + PostgreSQL RPC functions

Live Occupancy
Supabase Realtime

Offline Support
Service Worker + IndexedDB

Validation
Zod + React Hook Form

Testing
Vitest + Playwright
```

This setup gives E-ParkGO a modern serverless foundation that is cost-free to begin with, relatively easy to maintain, responsive across different devices, and capable of expanding into a complete parking operations platform.

For a student project, portfolio application, proof of concept, or limited non-commercial pilot, the initial infrastructure can remain free. For a real commercial deployment, the same architecture may be retained while upgrading hosting, backups, monitoring, support, and uptime guarantees.