# ParkFlow: Serverless Parking Management System

## Project Summary

**ParkFlow** is an automated, serverless parking management system delivered as an installable Progressive Web Application.

Instead of manually recording vehicle entry times, exit times, durations, and fees, the system automatically manages the entire parking lifecycle:

1. Staff registers an arriving vehicle.
2. The system creates a parking session.
3. The database records the official server-generated entry time.
4. A unique QR parking ticket is generated.
5. The parking space is marked as occupied.
6. Exit staff scans the QR ticket.
7. The system retrieves the active parking session.
8. Parking duration and fees are calculated automatically.
9. Staff confirms payment and vehicle exit.
10. The database records the exit time and closes the session.
11. The parking space becomes available again.

The system will work on phones, tablets, laptops, and desktop computers without requiring separate native Android or iOS applications.

---

# Recommended Serverless Architecture

```text
Staff Phone / Tablet / Computer
              │
              ▼
┌────────────────────────────────────┐
│       Next.js Parking PWA          │
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

| Layer                 | Technology                          | Purpose                                                  |
| --------------------- | ----------------------------------- | -------------------------------------------------------- |
| Application framework | Next.js with App Router             | PWA interface and routing                                |
| Programming language  | TypeScript                          | Type-safe frontend and backend logic                     |
| UI styling            | Tailwind CSS                        | Responsive interface design                              |
| Component library     | shadcn/ui                           | Dashboard, dialogs, tables, forms, and controls          |
| Icons                 | Lucide React                        | Interface icons                                          |
| Form management       | React Hook Form                     | Entry, payment, and configuration forms                  |
| Validation            | Zod                                 | Client-side and server-side validation                   |
| Hosting               | Vercel                              | Frontend deployment, HTTPS, CDN, and CI/CD               |
| Database              | Supabase PostgreSQL                 | Parking sessions, tickets, vehicles, rates, and payments |
| Authentication        | Supabase Auth                       | Secure staff login and session management                |
| Authorization         | PostgreSQL Row Level Security       | Role and data-access enforcement                         |
| Backend logic         | Supabase Edge Functions             | Secure server-only operations                            |
| Transaction logic     | PostgreSQL functions or RPC         | Atomic entry, payment, and exit operations               |
| Live dashboard        | Supabase Realtime                   | Instant parking occupancy updates                        |
| File storage          | Supabase Storage                    | Optional receipts, vehicle images, and exports           |
| QR generation         | QR-code generation package          | Generate parking ticket QR codes                         |
| QR scanning           | Browser camera scanner              | Scan tickets using phone or tablet cameras               |
| Offline storage       | IndexedDB                           | Cache pending operations and application data            |
| PWA support           | Web app manifest and service worker | Installation, caching, and limited offline operation     |
| Testing               | Vitest and Playwright               | Unit and end-to-end workflow tests                       |
| Source control        | GitHub                              | Version control and automated Vercel deployment          |

Next.js has built-in support for web app manifests, while service workers can provide installation, notifications, caching, and offline functionality. A valid manifest and HTTPS deployment allow the application to behave like an installable app on supported devices.

---

# Responsibilities of Each Platform

## Vercel

Vercel will handle:

* Hosting the Next.js PWA
* HTTPS and SSL certificates
* Global CDN delivery
* Automatic deployments from GitHub
* Preview deployments
* Static asset caching
* Security and response headers
* Lightweight Next.js Route Handlers when necessary

Most business logic should remain in Supabase so that Vercel primarily serves the application interface. This helps reduce Vercel function usage and keeps the architecture simpler.

## Supabase

Supabase will provide:

* PostgreSQL database
* Staff authentication
* Role-based database access
* Parking transaction processing
* Realtime occupancy updates
* Serverless Edge Functions
* Receipt and file storage
* Database triggers and constraints
* Audit records

Supabase Edge Functions run server-side TypeScript and are globally distributed. They are suitable for secure QR validation, receipt generation, webhooks, payment integrations, notifications, and other operations that must not run in the browser.

Supabase Realtime can listen to database changes, allowing all connected dashboards to update immediately when a vehicle enters, exits, pays, or changes parking spaces.

---

# Core Application Modules

## 1. Authentication and Staff Management

The system will support roles such as:

* Administrator
* Supervisor
* Entry staff
* Exit staff
* Cashier

Administrators can manage rates, parking spaces, staff members, reports, and system settings.

Entry staff can create parking sessions and generate tickets.

Exit staff can scan tickets and confirm vehicle exits.

Supervisors can approve manual corrections, lost tickets, voids, and fee overrides.

---

## 2. Vehicle Entry

Staff enters:

* Plate number
* Vehicle type
* Vehicle color
* Assigned parking space

The backend then:

1. Normalizes the plate number.
2. Checks for an existing active parking session.
3. Confirms that the parking space is available.
4. Creates the parking session.
5. Records the database server time.
6. Generates a ticket number and secure QR token.
7. Marks the space as occupied.
8. Returns the printable ticket.

The frontend must never supply the official entry timestamp. PostgreSQL should generate it using the database server time.

---

## 3. QR Parking Ticket

The QR code should contain only an opaque secure token or verification URL.

Example:

```text
https://parkflow.vercel.app/verify/7c52f7d2...
```

It should not directly contain:

* Entry time
* Exit time
* Parking fee
* Payment status
* Staff account
* Editable parking information

The QR token should be randomly generated, and its hashed representation should be stored in the database.

This means changing information inside a locally generated QR code will not change the official parking record.

---

## 4. Vehicle Exit

Exit staff scans the ticket using the PWA camera.

The system will:

1. Validate the secure QR token.
2. Retrieve the active parking session.
3. Show the plate number and vehicle details.
4. Generate a proposed exit time using the server clock.
5. Calculate the parking duration.
6. Apply the active parking rate.
7. Display the total amount.
8. Wait for staff confirmation.
9. Record payment.
10. Record the official exit time.
11. Close the parking session.
12. Release the parking space.

Scanning alone should not immediately complete the exit. A confirmation screen prevents accidental or duplicate scans.

---

## 5. Parking Fee Engine

Rates will be configurable rather than hard-coded.

The system can support:

* Grace periods
* Initial parking fee
* Succeeding hourly rate
* Different vehicle rates
* Flat-rate parking
* Overnight fees
* Daily maximum charges
* Lost-ticket penalties
* Discounts
* Complimentary parking

The backend—not the browser—must perform the final fee calculation.

A snapshot of the applied rate should be stored with the transaction so that old receipts remain correct even after an administrator changes the current parking rates.

---

## 6. Live Parking Dashboard

The dashboard will show:

* Total capacity
* Available spaces
* Occupied spaces
* Occupancy percentage
* Active parking sessions
* Vehicles entered today
* Vehicles exited today
* Revenue today
* Pending payments
* Paid vehicles waiting to exit
* Parking zones and space statuses

Supabase Realtime will publish only the necessary occupancy and transaction changes instead of repeatedly refreshing the entire dashboard.

---

# Main Database Tables

The MVP will use approximately the following tables:

```text
profiles
staff_roles
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

The central table is `parking_sessions`.

It should contain:

```text
id
ticket_id
vehicle_id
parking_space_id
entry_staff_id
exit_staff_id
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

Important session statuses include:

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

For example:

```text
create_parking_entry()
calculate_parking_exit()
record_parking_payment()
confirm_vehicle_exit()
cancel_parking_session()
approve_lost_ticket()
```

Each function should validate the entire operation and apply all database changes within one transaction.

For example, `confirm_vehicle_exit()` should atomically:

1. Confirm the session is still active.
2. Validate payment status.
3. Record the exit time.
4. Calculate the final duration.
5. Mark the session as completed.
6. Mark the parking space as available.
7. Create an audit record.

This prevents situations where the parking session is completed but the space remains occupied because one database operation failed.

---

# Security Strategy

## Row Level Security

Row Level Security must be enabled on every exposed Supabase table. Supabase specifically requires RLS for tables in exposed schemas such as `public`.

Example authorization rules:

* Entry staff can create entries but cannot change parking rates.
* Cashiers can create payments but cannot delete transactions.
* Supervisors can approve overrides.
* Administrators can manage the entire parking location.
* Staff can only access the parking branch assigned to them.

## Additional Security Measures

The system should implement:

* Secure Supabase Auth sessions
* Password hashing handled by Supabase Auth
* Role-based RLS policies
* Server-generated timestamps
* Secure QR tokens
* Hashed QR-token storage
* Rate limiting on scan and validation endpoints
* Input validation with Zod
* Database constraints
* Audit logging
* Restricted service-role credentials
* HTTP security headers
* Duplicate request prevention
* Idempotency keys for entry, payment, and exit operations

The Supabase service-role or secret key must never appear in the browser. It should only be available inside secure Edge Functions or server-side environments.

---

# Reliability Strategy

A free serverless platform alone does not guarantee reliability. The application itself must prevent inconsistent data.

The system should include:

* PostgreSQL transactions
* Unique ticket constraints
* Duplicate active-session prevention
* Unique payment references
* Idempotent entry and exit functions
* Automatic retries for temporary connection failures
* Offline operation indicators
* Pending synchronization queues
* Audit records for every sensitive operation
* Daily manual or automated database exports
* Error monitoring
* Clear recovery workflows

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

## Frontend Optimization

* Cache the PWA shell and static assets.
* Load dashboard sections only when needed.
* Paginate transaction histories.
* Use server-rendered pages where interactivity is unnecessary.
* Use client components only for scanners, forms, and live dashboards.
* Compress icons and images.
* Avoid storing unnecessary vehicle photos.
* Cache stable configuration such as vehicle types and parking zones.
* Display optimistic updates only when they can safely be corrected.

## Realtime Optimization

Do not enable database-change subscriptions for every table.

Realtime should primarily cover:

* Parking-space status
* Active parking sessions
* Payment confirmation
* Exit confirmation
* Operational alerts

Reports and historical transactions should use normal paginated database queries.

---

# Free Deployment Plan

## Vercel Hobby

As of July 16, 2026, Vercel Hobby costs $0 and includes automatic CI/CD, CDN delivery, HTTPS, DDoS mitigation, one million monthly edge requests, 100 GB monthly data transfer, one million monthly function invocations, and four hours of active function CPU.

However, Vercel states that the Hobby plan is for **personal and non-commercial use**. It is appropriate for a student project, capstone, prototype, portfolio project, demonstration, or limited non-commercial pilot. A parking business using the system commercially would eventually need an eligible paid plan or a different hosting arrangement.

## Supabase Free

The current Supabase Free plan includes:

* Two active projects
* 500 MB database size per project
* 50,000 monthly active users
* 5 GB database egress
* 5 GB cached egress
* 1 GB file storage
* 200 peak Realtime connections
* Two million Realtime messages monthly
* 500,000 Edge Function invocations
* Unlimited API requests

These limits should be sufficient for development, demonstrations, school deployment, and a small pilot parking facility.

However, the free plan has important limitations:

* Projects may pause after one week of inactivity.
* Automatic database backups are not included.
* Only one day of API and database logs is retained.
* No uptime service-level agreement is included.
* Advanced support and compliance features are not included.

Therefore, the system can initially cost **₱0 per month**, but “free” should not be treated as guaranteed production-grade infrastructure for a busy commercial parking facility.

---

# Recommended MVP Scope

The first version should include:

* Staff login
* Role-based permissions
* Parking-zone and space management
* Vehicle entry registration
* Automatic server entry time
* QR ticket generation
* Printable ticket layout
* Camera-based QR scanning
* Automatic duration calculation
* Configurable parking rates
* Cash payment recording
* Exit confirmation
* Automatic space release
* Active parking dashboard
* Transaction history
* Daily revenue report
* Lost-ticket workflow
* Audit logs
* Installable PWA

The following should be postponed:

* Automatic plate recognition
* Barrier-gate integration
* Physical parking sensors
* Customer reservations
* Mobile payment API integration
* Multi-branch management
* Monthly subscriptions
* AI occupancy prediction

---

# Final Recommended Setup

```text
Frontend and PWA
Next.js + TypeScript + Tailwind CSS + shadcn/ui

Deployment
Vercel connected to GitHub

Database
Supabase PostgreSQL

Authentication
Supabase Auth

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

This configuration gives the project a modern serverless foundation that is inexpensive to start, relatively easy to maintain, responsive on mobile devices, and capable of expanding into a larger parking operations platform.

For a student project, portfolio application, proof of concept, or small non-commercial pilot, the initial infrastructure can remain completely free. For a real commercial deployment, the architecture can stay the same, but the hosting plans, backups, monitoring, support, and uptime guarantees should eventually be upgraded.
