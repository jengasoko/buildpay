# Phase 5 & 6 — Employee Dashboard & Employer/Finance Workflow

Scope and design for closing the gap between the current HMS and real-world
staff-housing / tenant-management systems (benchmarked against Yardi, AppFolio,
Rentec Direct, Re-Leased, Regalis, Bedspace Manager, Insight CAFM, StarRez, Odoo
Staff Accommodation).

## Current state and gaps

The system today records one-off payments that have nothing to reconcile against:
there is **no invoice/ledger, no lease, no room, no billing cycle, and no
maintenance workflow**. Employees see a journey timeline, not a financial
account. Employers/finance approve a status, but the approval carries no
reason/reviewer, and nothing is billed after move-in.

## Design

### 1. Lease (tenancy record)

Created automatically when an application reaches `FINANCIAL_APPROVED`.

- `occupancy_id` (unique FK), `employee_id`, `house_id`, `room_id` (nullable)
- `rent_amount` (defaults to house.rent_price), `deposit_amount`, `deposit_paid`
- `start_date`, `end_date`, `billing_day` (day of month the rent invoice is raised)
- status: `ACTIVE | EXPIRED | TERMINATED`
- `signed_by_id`, `signed_at` (contract acceptance)

### 2. Room (within a house)

- `house_id`, `room_number`, `block_type` (`PRIVATE | SHARED | DORMITORY | OTHER`),
  `capacity`, `is_available`
- A lease may bind to a room; occupied count derived from active leases.

### 3. Billing engine

- `Invoice`: `lease_id` (FK), `period_start`, `period_end`, `due_date`,
  `total_amount`, `paid_amount`, `status` (`OPEN | PARTIAL | PAID | CANCELLED`),
  `late_fee_amount`, `notes`.
- `Charge` (invoice line item): `invoice_id`, `charge_type`
  (`RENT | UTILITY | MESS | OTHER`), `label`, `amount`.
- `Payment` gains `invoice_id` (nullable FK) and `method`
  (`CASH | EFT | CARD | PAYROLL_DEDUCTION`) so money can be allocated to an
  invoice and received as a receipt.
- Recurring generation (per lease, per billing month) with:
  - **proration** of the first invoice when a lease starts mid-month;
  - **late fee** policy (flat amount) applied on the next invoice when an earlier
    invoice is still unpaid after its due date.

### 4. Arrears / collections

- Aging buckets computed from open invoices: `0-30`, `31-60`, `61-90`, `90+`.
- `Invoice.PAID`/`PARTIAL` driven by payment allocation (a payment clears oldest
  open invoice first).
- Summary endpoint for finance + per-employer team.

### 5. Maintenance requests

- `house_id`, `room_id` (nullable), `employee_id`, `category`
  (`PLUMBING | ELECTRICAL | STRUCTURAL | FURNITURE | OTHER`), `title`,
  `description`, `photos` (JSON), status (`SUBMITTED | ASSIGNED | RESOLVED | CLOSED`),
  `assigned_to_id`, `assigned_by_id`, `resolution_note`, `created_at`, `closed_at`.
- Employee submits; employer/finance/manager assigns; assignee resolves, reporter closes.

### 6. Approval with reason and reviewer

- `Application` gains `review_note`, `reviewed_by_id`, `reviewed_at` so every
  approve/reject captures who and why (auditable, segregation-friendly).

### 7. Role dashboards

- **Employee** (`/api/v1/dashboard/me`): own application status, active lease,
  current balance, next invoice/due date, recent invoices + receipts, open maintenance.
- **Employer**: team occupancy, team arrears balance, pending team reviews,
  team maintenance.
- **Finance/Admin**: funding pipeline, arrears aging, monthly collections,
  active leases.
- Existing global `/dashboard/stats` stays for admin/manager.

### 8. Reports

- `GET /api/v1/reports/financial?year=&month=` → collected, outstanding,
  open invoices, by aging.
- `GET /api/v1/reports/occupancy` → active/available, by house.
- Statement of account per employee (invoices + payments, running balance).

## API surface (new/changed)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/v1/leases`, `/api/v1/leases/{id}`, `PUT /set-deposit`, `POST /{id}/terminate` | admin/owner/employee-scoped | Lease management |
| POST | `/api/v1/leases/{id}/generate-invoice` | finance/admin | Roll a billing month |
| GET | `/api/v1/invoices`, `/api/v1/invoices/{id}` | finance/admin/employee-scoped | Invoices + charges |
| POST | `/api/v1/invoices/{id}/allocate` | finance/admin | Allocate payment to invoice |
| GET | `/api/v1/arrears` | employer/finance | Aging summary |
| GET/POST | `/api/v1/rooms`, `/api/v1/rooms/{id}` | manager admin/finance | Room CRUD (house-level) |
| GET/POST/PUT | `/api/v1/maintenance-requests/...` | all roles scoped | Maintenance workflow |
| GET | `/api/v1/dashboard/me` | employee | Personal dashboard |
| GET | `/api/v1/reports/financial`, `/reports/occupancy` | finance/admin | Reports |
| PUT | `/api/v1/applications/{id}` | + `review_note` | Approval reason |
| POST | `/api/v1/payments/` | + `invoice_id`, `method` | Receipt against invoice |

## Out of scope (future)

- PDF generation / document storage (receipts rendered client-side)
- Email/SMS/WhatsApp channels (in-app notifications only)
- Bank reconciliation feeds and accounting-package sync
- Multi-site and bed-level allocation