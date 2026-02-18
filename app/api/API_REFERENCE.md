# LPA Online — Developer API Reference

## Overview

Supabase-based Lasting Power of Attorney service. Leads submit personal details, nominate attorneys, and the system generates official OPG PDF forms (LP1H / LP1F) for postal submission. Payments via Stripe.

**Base URL:** `https://odhlmprtdbrzjezyccno.supabase.co`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Data Model & Ownership Chain](#2-data-model--ownership-chain)
3. [Database Tables — Full Schema](#3-database-tables--full-schema)
4. [CRUD Operations (Supabase Client)](#4-crud-operations-supabase-client)
5. [Edge Functions (Custom API Endpoints)](#5-edge-functions-custom-api-endpoints)
6. [Security & Business Rules](#6-security--business-rules)
7. [Status Flows](#7-status-flows)
8. [Fee Calculation Logic](#8-fee-calculation-logic)
9. [Environment Variables](#9-environment-variables)
10. [Test Accounts](#10-test-accounts)

---

## 1. Authentication

All auth is handled by Supabase Auth. The frontend uses `@supabase/supabase-js`.

### Lead Registration & Login

```js
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in (email/password)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in (Google OAuth)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
})
```

### Admin Login (email/password + MFA)

Admins log in with email/password, then must complete MFA (TOTP) to access admin functions.

```js
// Step 1: Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password123'
})

// Step 2: Enroll MFA (first time only)
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Admin TOTP'
})
// Returns QR code URI for authenticator app

// Step 3: Challenge + Verify (every login)
const { data: challenge } = await supabase.auth.mfa.challenge({
  factorId: '<factor_id>'
})
const { data, error } = await supabase.auth.mfa.verify({
  factorId: '<factor_id>',
  challengeId: challenge.id,
  code: '123456' // from authenticator app
})

// Step 4: Check assurance level
const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
// data.currentLevel === 'aal2' means MFA verified
```

### Session Management

```js
// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => { ... })
```

---

## 2. Data Model & Ownership Chain

All data access is enforced via Row Level Security (RLS) following this ownership chain:

```
auth.users
  └── leads (id = auth.users.id)
        └── applications (lead_id → leads.id)
              ├── donors (application_id → applications.id)
              │     ├── lpa_documents (donor_id → donors.id)
              │     │     ├── lpa_document_attorneys (lpa_document_id → lpa_documents.id)
              │     │     ├── lpa_document_applicants (lpa_document_id → lpa_documents.id)
              │     │     ├── people_to_notify (lpa_document_id → lpa_documents.id)
              │     │     └── certificate_providers (lpa_document_id → lpa_documents.id)
              │     └── benefits_assessments (donor_id → donors.id)
              └── attorneys (application_id → applications.id)
```

**Key rule:** A lead can only read/write records that trace back to their own `applications.lead_id = auth.uid()`. RLS policies enforce this automatically — the frontend just calls the Supabase client and the database handles access control.

---

## 3. Database Tables — Full Schema

### `leads`
Extends `auth.users` — stores lead personal details.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | yes | FK → auth.users.id |
| title | text | yes | |
| first_name | text | yes | |
| last_name | text | yes | |
| middle_name | text | no | |
| known_by_other_names | text | no | free text |
| preferred_name | text | no | |
| date_of_birth | date | yes | |
| address_line_1 | text | yes | |
| address_line_2 | text | no | |
| city | text | yes | |
| county | text | no | |
| postcode | text | yes | |
| mobile | text | yes | |
| landline | text | no | |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |
| deleted_at | timestamptz | no | soft delete |

---

### `applications`
Top-level container grouping all donors/LPAs for a single lead's submission.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | gen_random_uuid() |
| lead_id | uuid FK | yes | → leads.id |
| status | text | yes | default `draft`. Values: `draft`, `complete`, `paid`, `processing`, `completed` |
| payment_method | text | no | `card` or `cheque` |
| stripe_checkout_session_id | text | no | set by create-checkout |
| stripe_payment_intent_id | text | no | set by Stripe webhook |
| our_fee_pence | integer | yes | default 0, set by create-checkout |
| opg_fee_pence | integer | yes | default 0, set by create-checkout |
| total_pence | integer | yes | default 0, set by create-checkout |
| paid_at | timestamptz | no | set by Stripe webhook |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |
| deleted_at | timestamptz | no | soft delete |

---

### `donors`
People the LPA is being created for. Can be the lead themselves.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| application_id | uuid FK | yes | → applications.id |
| is_lead | boolean | yes | default false. True if donor IS the lead |
| title | text | yes | |
| first_name | text | yes | |
| last_name | text | yes | |
| middle_name | text | no | |
| preferred_name | text | no | |
| date_of_birth | date | yes | |
| address_line_1 | text | yes | |
| address_line_2 | text | no | |
| city | text | yes | |
| county | text | no | |
| postcode | text | yes | |
| relationship_to_lead | text | yes | `self`, `partner`, `parent`, `other` |
| same_attorneys_for_both_types | boolean | yes | default false. If true, UI keeps junction tables in sync for both H&W and P&F |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |
| deleted_at | timestamptz | no | |

---

### `lpa_documents`
One per donor per LPA type. Core record that becomes a PDF.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| donor_id | uuid FK | yes | → donors.id |
| lpa_type | text | yes | `health_and_welfare` or `property_and_finance` |
| status | text | yes | default `draft`. Values: `draft`, `complete`, `pdf_generated`, `sent_to_post` |
| attorney_decision_type | text | no | `jointly`, `jointly_and_severally`, `mixed` |
| replacement_attorney_decision_type | text | no | `jointly`, `jointly_and_severally`, `mixed` |
| life_sustaining_treatment | boolean | no | H&W only |
| when_attorneys_can_act | text | no | P&F only: `when_registered`, `loss_of_capacity` |
| applicant_type | text | no | `attorneys` or `donor` |
| opg_fee_tier | text | no | `full`, `reduced`, `exempt` — set by create-checkout |
| opg_fee_pence | integer | no | set by create-checkout |
| pdf_storage_path | text | no | set by generate-pdf |
| postal_reference | text | no | set by submit-postal |
| postal_status | text | no | `submitted`, `in_transit`, `delivered`, `failed` |
| postal_submitted_at | timestamptz | no | set by submit-postal |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |
| deleted_at | timestamptz | no | |

**Unique constraint:** One LPA type per donor (when not soft-deleted).

---

### `attorneys`
Attorney records belong to an application, shared across LPA documents via junction table.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| application_id | uuid FK | yes | → applications.id |
| title | text | yes | |
| first_name | text | yes | |
| last_name | text | yes | |
| middle_name | text | no | |
| date_of_birth | date | yes | |
| address_line_1 | text | yes | |
| address_line_2 | text | no | |
| city | text | yes | |
| county | text | no | |
| postcode | text | yes | |
| email | text | no | |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |
| deleted_at | timestamptz | no | |

**Unique constraint:** `(application_id, first_name, last_name, date_of_birth, postcode)` where not deleted — prevents duplicate entries.

---

### `lpa_document_attorneys` (junction table)
Links attorneys to LPA documents. Delete and re-create — do not update.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| lpa_document_id | uuid FK | yes | → lpa_documents.id |
| attorney_id | uuid FK | yes | → attorneys.id |
| role | text | yes | `primary` or `replacement` |
| sort_order | integer | yes | default 0, for ordering on the form |
| created_at | timestamptz | auto | |
| deleted_at | timestamptz | no | |

**Unique constraint:** `(lpa_document_id, attorney_id, role)` where not deleted.

**No `updated_at`** — use delete/re-create pattern.

---

### `lpa_document_applicants` (junction table)
Tracks who is applying to register each LPA. Delete and re-create — do not update.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| lpa_document_id | uuid FK | yes | → lpa_documents.id |
| attorney_id | uuid FK | no | → attorneys.id. NULL if applicant is the donor |
| applicant_role | text | yes | `attorney` or `donor` |
| created_at | timestamptz | auto | |

**Unique constraint:** `(lpa_document_id, attorney_id)` where attorney_id is not null.

**Check constraint:** If `applicant_role = 'donor'`, `attorney_id` must be NULL. If `applicant_role = 'attorney'`, `attorney_id` must NOT be NULL.

**No `updated_at`** — use delete/re-create pattern.

---

### `people_to_notify`
Up to 5 per LPA document. Enforced by database trigger.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| lpa_document_id | uuid FK | yes | → lpa_documents.id |
| title | text | yes | |
| first_name | text | yes | |
| last_name | text | yes | |
| middle_name | text | no | |
| address_line_1 | text | yes | |
| address_line_2 | text | no | |
| city | text | yes | |
| county | text | no | |
| postcode | text | yes | |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |
| deleted_at | timestamptz | no | |

---

### `certificate_providers`
One per LPA document (optional).

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| lpa_document_id | uuid FK | yes | → lpa_documents.id, UNIQUE (when not deleted) |
| title | text | yes | |
| first_name | text | yes | |
| last_name | text | yes | |
| middle_name | text | no | |
| address_line_1 | text | yes | |
| address_line_2 | text | no | |
| city | text | yes | |
| county | text | no | |
| postcode | text | yes | |
| certification_basis | text | yes | `personal_knowledge` or `professional` |
| professional_title | text | no | e.g. "Solicitor", "GP". Used when basis is `professional` |
| relationship_length_years | integer | no | For `personal_knowledge` (must be 2+) |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |
| deleted_at | timestamptz | no | |

---

### `benefits_assessments`
One per donor. Determines OPG fee reduction/exemption.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| donor_id | uuid FK | yes | → donors.id, UNIQUE |
| receives_means_tested_benefits | boolean | yes | |
| selected_benefits | text[] | yes | default `{}`. Values: `income_based_esa`, `income_based_jsa`, `guaranteed_pension_credit`, `housing_benefit`, `council_tax_reduction`, `none_of_above` |
| income_12k_or_more | boolean | no | |
| receives_universal_credit | boolean | no | |
| income_sources | text[] | no | Values: `paid_employment`, `self_employment`, `non_means_tested_benefits`, `capital_interest`, `no_income`, `none_of_above` |
| calculated_fee_tier | text | yes | `full`, `reduced`, `exempt` — set by frontend based on answers |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |

**Note:** This table has no `deleted_at` — use upsert (`onConflict: 'donor_id'`).

---

### `payments`
Stripe payment records. Read-only for leads.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | auto | |
| application_id | uuid FK | yes | → applications.id |
| stripe_checkout_session_id | text | yes | UNIQUE — idempotency key |
| stripe_payment_intent_id | text | no | |
| amount_pence | integer | yes | |
| status | text | yes | `pending`, `succeeded`, `failed`, `refunded` |
| stripe_event_data | jsonb | no | raw Stripe event payload for audit |
| paid_at | timestamptz | no | |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |

**Note:** This table has no `deleted_at`. Created by the Stripe webhook, not by the frontend.

---

### `admin_users`
Extends `auth.users` for admin-specific data.

| Column | Type | Required | Notes |
|---|---|---|---|
| id | uuid PK | yes | FK → auth.users.id |
| email | text | yes | |
| is_active | boolean | yes | default true |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |

---

### `audit_logs`
Field-level change tracking. INSERT-ONLY — never update or delete.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| table_name | text | e.g. `donors`, `attorneys` |
| record_id | uuid | the record that was changed |
| action | text | `insert`, `update`, `delete` |
| field_name | text | null for insert/delete of whole row |
| old_value | jsonb | null for inserts |
| new_value | jsonb | null for deletes |
| changed_by | uuid | FK → auth.users.id (nullable) |
| changed_by_role | text | `lead`, `admin`, `system` |
| ip_address | text | nullable |
| created_at | timestamptz | |

**Access:** Admin read-only. No lead access.

---

## 4. CRUD Operations (Supabase Client)

All standard CRUD is done via `@supabase/supabase-js`. RLS enforces access control automatically — the frontend does not need to filter by user ID.

### Initialise Client

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://odhlmprtdbrzjezyccno.supabase.co',
  '<ANON_KEY>'
)
```

### Lead Profile

```js
// Create lead profile (after sign-up)
await supabase.from('leads').insert({
  id: user.id,  // must match auth.users.id
  title: 'Mr',
  first_name: 'John',
  last_name: 'Smith',
  date_of_birth: '1990-01-15',
  address_line_1: '42 Oak Lane',
  city: 'London',
  postcode: 'SW1A 1AA',
  mobile: '07700900001'
})

// Read own profile
const { data } = await supabase.from('leads').select('*').single()

// Update profile
await supabase.from('leads').update({ mobile: '07700900002' }).eq('id', user.id)
```

### Applications

```js
// Create application
const { data } = await supabase.from('applications').insert({
  lead_id: user.id
}).select().single()

// List own applications
const { data } = await supabase.from('applications')
  .select('*')
  .is('deleted_at', null)

// Update application status
await supabase.from('applications')
  .update({ status: 'complete' })
  .eq('id', applicationId)
```

### Donors

```js
// Create donor
await supabase.from('donors').insert({
  application_id: applicationId,
  is_lead: true,
  title: 'Mr',
  first_name: 'John',
  last_name: 'Smith',
  date_of_birth: '1990-01-15',
  address_line_1: '42 Oak Lane',
  city: 'London',
  postcode: 'SW1A 1AA',
  relationship_to_lead: 'self'
})

// List donors for an application
const { data } = await supabase.from('donors')
  .select('*')
  .eq('application_id', applicationId)
  .is('deleted_at', null)

// Update donor
await supabase.from('donors')
  .update({ first_name: 'Jonathan' })
  .eq('id', donorId)
```

### LPA Documents

```js
// Create LPA document
await supabase.from('lpa_documents').insert({
  donor_id: donorId,
  lpa_type: 'health_and_welfare'  // or 'property_and_finance'
})

// List LPA documents for a donor
const { data } = await supabase.from('lpa_documents')
  .select('*')
  .eq('donor_id', donorId)
  .is('deleted_at', null)

// Update LPA document fields
await supabase.from('lpa_documents').update({
  attorney_decision_type: 'jointly_and_severally',
  life_sustaining_treatment: true,
  applicant_type: 'attorneys',
  status: 'complete'
}).eq('id', lpaDocId)
```

### Attorneys

```js
// Create attorney (belongs to application, shared across LPA docs)
const { data } = await supabase.from('attorneys').insert({
  application_id: applicationId,
  title: 'Mrs',
  first_name: 'Jane',
  last_name: 'Smith',
  date_of_birth: '1978-07-22',
  address_line_1: '42 Oak Lane',
  city: 'London',
  postcode: 'SW1A 1AA',
  email: 'jane@example.com'
}).select().single()

// List attorneys for an application
const { data } = await supabase.from('attorneys')
  .select('*')
  .eq('application_id', applicationId)
  .is('deleted_at', null)
```

### LPA Document ↔ Attorney Links (Junction Table)

```js
// Link attorney to LPA document
await supabase.from('lpa_document_attorneys').insert({
  lpa_document_id: lpaDocId,
  attorney_id: attorneyId,
  role: 'primary',   // or 'replacement'
  sort_order: 1
})

// List attorneys for an LPA document (with attorney details)
const { data } = await supabase.from('lpa_document_attorneys')
  .select('*, attorneys(*)')
  .eq('lpa_document_id', lpaDocId)
  .is('deleted_at', null)
  .order('sort_order')

// Remove attorney from LPA document (delete the junction row)
await supabase.from('lpa_document_attorneys')
  .delete()
  .eq('id', junctionRowId)
```

### LPA Document Applicants (Junction Table)

```js
// Set donor as applicant
await supabase.from('lpa_document_applicants').insert({
  lpa_document_id: lpaDocId,
  applicant_role: 'donor',
  attorney_id: null  // must be null for donor
})

// Set attorney as applicant
await supabase.from('lpa_document_applicants').insert({
  lpa_document_id: lpaDocId,
  applicant_role: 'attorney',
  attorney_id: attorneyId  // must NOT be null for attorney
})

// Replace applicants: delete all, then re-insert
await supabase.from('lpa_document_applicants')
  .delete()
  .eq('lpa_document_id', lpaDocId)

// Then insert new ones...
```

### People to Notify

```js
// Add person to notify (max 5 per LPA doc — enforced by DB trigger)
await supabase.from('people_to_notify').insert({
  lpa_document_id: lpaDocId,
  title: 'Dr',
  first_name: 'Sarah',
  last_name: 'Williams',
  address_line_1: '7 Birch Road',
  city: 'Oxford',
  postcode: 'OX1 1AA'
})

// List for an LPA document
const { data } = await supabase.from('people_to_notify')
  .select('*')
  .eq('lpa_document_id', lpaDocId)
  .is('deleted_at', null)
```

### Certificate Providers

```js
// Create or update (one per LPA doc — use upsert pattern)
// Since there's a unique constraint on lpa_document_id,
// soft-delete the old one first if replacing
await supabase.from('certificate_providers').insert({
  lpa_document_id: lpaDocId,
  title: 'Mr',
  first_name: 'James',
  last_name: 'Wilson',
  address_line_1: '15 High Street',
  city: 'Bristol',
  postcode: 'BS1 1AA',
  certification_basis: 'personal_knowledge',
  relationship_length_years: 5
})

// Read for an LPA document
const { data } = await supabase.from('certificate_providers')
  .select('*')
  .eq('lpa_document_id', lpaDocId)
  .is('deleted_at', null)
  .maybeSingle()
```

### Benefits Assessments

```js
// Upsert (one per donor)
await supabase.from('benefits_assessments').upsert({
  donor_id: donorId,
  receives_means_tested_benefits: true,
  selected_benefits: ['guaranteed_pension_credit'],
  income_12k_or_more: false,
  receives_universal_credit: false,
  income_sources: [],
  calculated_fee_tier: 'exempt'
}, { onConflict: 'donor_id' })

// Read for a donor
const { data } = await supabase.from('benefits_assessments')
  .select('*')
  .eq('donor_id', donorId)
  .single()
```

### Payments (Read-Only for Leads)

```js
// List payments for an application
const { data } = await supabase.from('payments')
  .select('*')
  .eq('application_id', applicationId)
```

### Fetching Related Data (Joins)

Supabase supports nested selects via foreign key relationships:

```js
// Full application with donors, LPA docs, and attorneys
const { data } = await supabase.from('applications')
  .select(`
    *,
    donors (
      *,
      lpa_documents (
        *,
        lpa_document_attorneys (
          *,
          attorneys (*)
        ),
        lpa_document_applicants (
          *,
          attorneys (*)
        ),
        people_to_notify (*),
        certificate_providers (*)
      ),
      benefits_assessments (*)
    ),
    attorneys (*)
  `)
  .eq('id', applicationId)
  .is('deleted_at', null)
  .single()
```

---

## 5. Edge Functions (Custom API Endpoints)

Base URL: `https://odhlmprtdbrzjezyccno.supabase.co/functions/v1`

All Edge Functions (except `stripe-webhook`) require a user JWT in the `Authorization` header.

### 5.1 `POST /functions/v1/calculate-fees`

Calculates total fees for an application.

**Auth:** Lead JWT (must own the application)

**Request:**
```json
{
  "application_id": "uuid"
}
```

**Response (200):**
```json
{
  "our_fee_pence": 19800,
  "opg_fee_pence": 16400,
  "total_pence": 36200,
  "breakdown": [
    {
      "lpa_document_id": "uuid",
      "donor_id": "uuid",
      "donor_name": "John Smith",
      "lpa_type": "health_and_welfare",
      "our_fee_pence": 9900,
      "opg_fee_tier": "full",
      "opg_fee_pence": 8200
    }
  ]
}
```

**Errors:**
- `401` — Missing/invalid authorization
- `400` — Missing application_id
- `404` — Application not found (or not owned by user)

---

### 5.2 `POST /functions/v1/create-checkout`

Creates a Stripe Checkout Session for payment. Validates all LPA documents are `complete`.

**Auth:** Lead JWT

**Request:**
```json
{
  "application_id": "uuid"
}
```

**Response (200):**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/...",
  "session_id": "cs_test_..."
}
```

**Side effects:**
- Updates `applications` with `stripe_checkout_session_id`, fee totals, `payment_method: 'card'`
- Updates each `lpa_documents` with `opg_fee_tier` and `opg_fee_pence`

**Errors:**
- `400` — Application not in `complete` status
- `400` — One or more LPA documents not in `complete` status (returns `incomplete_ids[]`)
- `404` — Application not found

**Required env vars:** `STRIPE_SECRET_KEY`, `SITE_URL`

---

### 5.3 `POST /functions/v1/stripe-webhook`

Handles Stripe webhook events. **No JWT required** — verified via Stripe webhook signature.

**Auth:** None (Stripe signature verification)

**Events handled:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Creates `payments` record (idempotent), updates `applications.status` → `paid`, sets `paid_at` |
| `payment_intent.payment_failed` | Updates `payments.status` → `failed` |

**Idempotency:** UNIQUE constraint on `payments.stripe_checkout_session_id`. Duplicate webhook events are safely ignored.

**Required env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Stripe webhook setup:**
```bash
# For local testing:
stripe listen --forward-to https://odhlmprtdbrzjezyccno.supabase.co/functions/v1/stripe-webhook

# In Stripe Dashboard, add endpoint:
# URL: https://odhlmprtdbrzjezyccno.supabase.co/functions/v1/stripe-webhook
# Events: checkout.session.completed, payment_intent.payment_failed
```

---

### 5.4 `GET /functions/v1/admin-dashboard`

Aggregated stats for admin reporting.

**Auth:** Admin JWT + MFA verified (aal2)

**Request:** No body required (GET).

**Response (200):**
```json
{
  "total_applications": 42,
  "by_status": {
    "draft": 15,
    "complete": 8,
    "paid": 12,
    "processing": 5,
    "completed": 2
  },
  "revenue_pence": 450000,
  "conversion_rate": 0.4524,
  "recent_applications": [
    {
      "id": "uuid",
      "status": "paid",
      "total_pence": 36200,
      "paid_at": "2026-02-09T12:00:00Z",
      "created_at": "2026-02-08T10:00:00Z",
      "leads": {
        "first_name": "John",
        "last_name": "Smith"
      }
    }
  ]
}
```

**Errors:**
- `401` — Missing authorization / not authenticated
- `403` — MFA not verified (`current_level: 'aal1'`) or not an admin

---

### 5.5 `POST /functions/v1/generate-pdf`

Generates filled OPG PDF forms (LP1H / LP1F) and uploads to storage.

**Auth:** Admin JWT

**Request:**
```json
{
  "lpa_document_id": "uuid"
}
```

**Response (200):**
```json
{
  "pdf_url": "https://...supabase.co/storage/v1/object/sign/lpa-pdfs/...",
  "storage_path": "{application_id}/{lpa_document_id}/{lpa_type}.pdf"
}
```

**Side effects:**
- Uploads PDF to `lpa-pdfs` storage bucket
- Updates `lpa_documents.pdf_storage_path` and `status` → `pdf_generated`
- Bypasses post-payment lock via `app.allow_system_edit`

**Note:** Currently generates a JSON placeholder. Replace with actual OPG PDF template filling (using pdf-lib or similar) when templates are available.

---

### 5.6 `POST /functions/v1/submit-postal`

Submits generated PDF to 3rd party postal API.

**Auth:** Admin JWT

**Request:**
```json
{
  "lpa_document_id": "uuid"
}
```

**Response (200):**
```json
{
  "postal_reference": "SIM-1707480000-30000000",
  "status": "submitted"
}
```

**Side effects:**
- Updates `lpa_documents`: `postal_reference`, `postal_status` → `submitted`, `postal_submitted_at`, `status` → `sent_to_post`
- Bypasses post-payment lock via `app.allow_system_edit`

**Precondition:** LPA document must have `status: 'pdf_generated'` and a valid `pdf_storage_path`.

**Required env vars:** `POSTAL_API_URL`, `POSTAL_API_KEY` (if not set, simulates with a `SIM-` prefixed reference)

**Errors:**
- `400` — LPA document status is not `pdf_generated`
- `400` — No PDF file found
- `502` — Postal API returned an error

---

## 6. Security & Business Rules

### Row Level Security (RLS)

| Table | Lead | Admin |
|---|---|---|
| leads | Own record (read/write) | All records (read/write) |
| applications | Own records | All (edit pre-payment only) |
| donors | Via own application | All (edit pre-payment only) |
| lpa_documents | Via own application | All (edit pre-payment only) |
| lpa_document_applicants | Via own application | All (edit pre-payment only) |
| attorneys | Via own application | All (edit pre-payment only) |
| lpa_document_attorneys | Via own application | All (edit pre-payment only) |
| people_to_notify | Via own application | All (edit pre-payment only) |
| certificate_providers | Via own application | All (edit pre-payment only) |
| benefits_assessments | Via own application | All (edit pre-payment only) |
| payments | Read own only | Read all |
| admin_users | No access | Own record only |
| audit_logs | No access | Read all |

### Post-Payment Lock (Defence in Depth)

Once an application reaches `paid`, `processing`, or `completed` status, all related records are locked:

- **Layer 1 (RLS):** UPDATE policies check application status. Direct client writes are blocked.
- **Layer 2 (DB Trigger):** `fn_prevent_post_payment_edits()` raises an exception even for service_role writes. Only bypassed when the session variable `app.allow_system_edit = 'true'` is set (used by generate-pdf and submit-postal Edge Functions).

**Tables with lock trigger:** applications, donors, lpa_documents, lpa_document_applicants, attorneys, lpa_document_attorneys, people_to_notify, certificate_providers, benefits_assessments

**Tables NOT locked:** leads (can have multiple applications), payments, admin_users, audit_logs

### Audit Logging

Every insert, update, and delete on core tables is automatically logged to `audit_logs`:

- **Updates:** One row per changed field, with `old_value` and `new_value` as JSONB
- **Inserts/Deletes:** One summary row
- **Attribution:** `changed_by` is automatically set from the authenticated user or from Edge Function session variables
- **Roles:** `lead`, `admin`, or `system` (for webhook-driven changes)

### Database Constraints

- **People to notify:** Max 5 per LPA document (enforced by trigger)
- **Certificate provider:** Max 1 per LPA document (unique index)
- **Benefits assessment:** Max 1 per donor (unique constraint)
- **Attorney dedup:** Unique on `(application_id, first_name, last_name, date_of_birth, postcode)` within non-deleted records
- **LPA document dedup:** One type per donor (unique on `(donor_id, lpa_type)` within non-deleted records)

---

## 7. Status Flows

### Application Status

```
draft → complete → paid → processing → completed
```

| Transition | Triggered by |
|---|---|
| draft → complete | Frontend (when all LPA docs are complete) |
| complete → paid | Stripe webhook (checkout.session.completed) |
| paid → processing | Admin action (when starting PDF generation) |
| processing → completed | Admin action (when all LPAs sent to post) |

### LPA Document Status

```
draft → complete → pdf_generated → sent_to_post
```

| Transition | Triggered by |
|---|---|
| draft → complete | Frontend (when all fields filled) |
| complete → pdf_generated | generate-pdf Edge Function |
| pdf_generated → sent_to_post | submit-postal Edge Function |

### Payment Status

```
pending → succeeded
pending → failed
succeeded → refunded
```

---

## 8. Fee Calculation Logic

### Our Fee
- **£99 per LPA document** (9900 pence)
- A donor with both H&W and P&F = 2 x £99 = £198

### OPG Registration Fee (per LPA document, based on donor's benefit assessment)

| Tier | Amount | Criteria |
|---|---|---|
| Full | £82 (8200p) | Default — no qualifying benefits |
| Reduced | £41 (4100p) | Annual income under £12,000 |
| Exempt | £0 | Receives qualifying means-tested benefits |

**Qualifying benefits for exemption:**
- Income-based ESA
- Income-based JSA
- Guaranteed Pension Credit
- Housing Benefit
- Council Tax Reduction
- Universal Credit (with income under £12k)

**Note:** The `calculated_fee_tier` is set by the frontend based on the user's answers in `benefits_assessments`. The backend reads whatever tier is stored.

### Example: 1 donor, 2 LPA types, full tier
- Our fee: 2 x £99 = £198
- OPG fee: 2 x £82 = £164
- **Total: £362**

---

## 9. Environment Variables

Set these as Supabase Edge Function secrets via:
```bash
supabase secrets set KEY=value --project-ref odhlmprtdbrzjezyccno
```

| Variable | Required | Used by |
|---|---|---|
| `SUPABASE_URL` | auto | All functions (auto-injected) |
| `SUPABASE_ANON_KEY` | auto | All functions (auto-injected) |
| `SUPABASE_SERVICE_ROLE_KEY` | auto | All functions (auto-injected) |
| `STRIPE_SECRET_KEY` | yes | create-checkout, stripe-webhook |
| `STRIPE_WEBHOOK_SECRET` | yes | stripe-webhook |
| `SITE_URL` | yes | create-checkout (redirect URLs) |
| `POSTAL_API_URL` | no | submit-postal (if not set, simulates) |
| `POSTAL_API_KEY` | no | submit-postal (if not set, simulates) |

---

## 10. Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@lpa-online.test` | `Admin123!` |
| Lead | `lead@lpa-online.test` | `Lead1234!` |

### Seed Data Summary

The database is pre-populated with:

- 1 lead (John Smith) with profile
- 1 application (draft status)
- 1 donor (John Smith, self)
- 2 LPA documents (health_and_welfare + property_and_finance)
- 2 attorneys (Jane Smith + Robert Jones)
- 4 attorney-document links (primary + replacement on each LPA)
- 1 benefits assessment (full fee tier)

---

## Appendix: Supabase Client Setup

```bash
npm install @supabase/supabase-js
```

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://odhlmprtdbrzjezyccno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaGxtcHJ0ZGJyemplenljY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjIxMzgsImV4cCI6MjA4NjEzODEzOH0.eGe4EKkylIxoKGxKc06UQl9HLP5DXIZkDAIS3mLOwR0'
)
```
