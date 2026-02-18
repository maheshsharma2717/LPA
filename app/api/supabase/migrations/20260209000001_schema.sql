-- ============================================================
-- Migration: Core Schema
-- All tables, indexes, constraints, and foreign keys for LPA Online
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- Table: leads
-- Extends auth.users — stores lead personal details
-- ============================================================
create table public.leads (
  id            uuid primary key references auth.users(id) on delete cascade,
  title         text not null,
  first_name    text not null,
  last_name     text not null,
  middle_name   text,
  known_by_other_names text,
  preferred_name text,
  date_of_birth date not null,
  address_line_1 text not null,
  address_line_2 text,
  city          text not null,
  county        text,
  postcode      text not null,
  mobile        text not null,
  landline      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index idx_leads_deleted_at on public.leads(deleted_at) where deleted_at is null;

-- ============================================================
-- Table: applications
-- Top-level container for a lead's submission
-- ============================================================
create table public.applications (
  id                          uuid primary key default gen_random_uuid(),
  lead_id                     uuid not null references public.leads(id) on delete cascade,
  status                      text not null default 'draft'
                              check (status in ('draft', 'complete', 'paid', 'processing', 'completed')),
  payment_method              text check (payment_method in ('card', 'cheque') or payment_method is null),
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  our_fee_pence               integer not null default 0,
  opg_fee_pence               integer not null default 0,
  total_pence                 integer not null default 0,
  paid_at                     timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  deleted_at                  timestamptz
);

create index idx_applications_lead_id on public.applications(lead_id);
create index idx_applications_status on public.applications(status);
create index idx_applications_deleted_at on public.applications(deleted_at) where deleted_at is null;

-- ============================================================
-- Table: donors
-- People the LPA is being created for
-- ============================================================
create table public.donors (
  id                          uuid primary key default gen_random_uuid(),
  application_id              uuid not null references public.applications(id) on delete cascade,
  is_lead                     boolean not null default false,
  title                       text not null,
  first_name                  text not null,
  last_name                   text not null,
  middle_name                 text,
  preferred_name              text,
  date_of_birth               date not null,
  address_line_1              text not null,
  address_line_2              text,
  city                        text not null,
  county                      text,
  postcode                    text not null,
  relationship_to_lead        text not null
                              check (relationship_to_lead in ('self', 'partner', 'parent', 'other')),
  same_attorneys_for_both_types boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  deleted_at                  timestamptz
);

create index idx_donors_application_id on public.donors(application_id);
create index idx_donors_deleted_at on public.donors(deleted_at) where deleted_at is null;

-- ============================================================
-- Table: lpa_documents
-- One per donor per LPA type — core record that becomes a PDF
-- ============================================================
create table public.lpa_documents (
  id                                uuid primary key default gen_random_uuid(),
  donor_id                          uuid not null references public.donors(id) on delete cascade,
  lpa_type                          text not null
                                    check (lpa_type in ('health_and_welfare', 'property_and_finance')),
  status                            text not null default 'draft'
                                    check (status in ('draft', 'complete', 'pdf_generated', 'sent_to_post')),
  attorney_decision_type            text check (attorney_decision_type in ('jointly', 'jointly_and_severally', 'mixed') or attorney_decision_type is null),
  replacement_attorney_decision_type text check (replacement_attorney_decision_type in ('jointly', 'jointly_and_severally', 'mixed') or replacement_attorney_decision_type is null),
  life_sustaining_treatment         boolean,  -- H&W only
  when_attorneys_can_act            text check (when_attorneys_can_act in ('when_registered', 'loss_of_capacity') or when_attorneys_can_act is null),  -- P&F only
  applicant_type                    text check (applicant_type in ('attorneys', 'donor') or applicant_type is null),
  opg_fee_tier                      text check (opg_fee_tier in ('full', 'reduced', 'exempt') or opg_fee_tier is null),
  opg_fee_pence                     integer,
  pdf_storage_path                  text,
  postal_reference                  text,
  postal_status                     text check (postal_status in ('submitted', 'in_transit', 'delivered', 'failed') or postal_status is null),
  postal_submitted_at               timestamptz,
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now(),
  deleted_at                        timestamptz
);

create index idx_lpa_documents_donor_id on public.lpa_documents(donor_id);
create index idx_lpa_documents_status on public.lpa_documents(status);
create index idx_lpa_documents_deleted_at on public.lpa_documents(deleted_at) where deleted_at is null;

-- Unique constraint: one LPA type per donor (when not soft-deleted)
create unique index uq_lpa_documents_donor_type
  on public.lpa_documents(donor_id, lpa_type)
  where deleted_at is null;

-- ============================================================
-- Table: attorneys
-- Attorney records belong to an application
-- ============================================================
create table public.attorneys (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  title           text not null,
  first_name      text not null,
  last_name       text not null,
  middle_name     text,
  date_of_birth   date not null,
  address_line_1  text not null,
  address_line_2  text,
  city            text not null,
  county          text,
  postcode        text not null,
  email           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_attorneys_application_id on public.attorneys(application_id);
create index idx_attorneys_deleted_at on public.attorneys(deleted_at) where deleted_at is null;

-- Unique-ish constraint: prevent duplicate person within an application
create unique index uq_attorneys_person
  on public.attorneys(application_id, first_name, last_name, date_of_birth, postcode)
  where deleted_at is null;

-- ============================================================
-- Table: lpa_document_applicants (join table)
-- Tracks who is applying to register each LPA
-- ============================================================
create table public.lpa_document_applicants (
  id                uuid primary key default gen_random_uuid(),
  lpa_document_id   uuid not null references public.lpa_documents(id) on delete cascade,
  attorney_id       uuid references public.attorneys(id) on delete cascade,
  applicant_role    text not null check (applicant_role in ('attorney', 'donor')),
  created_at        timestamptz not null default now()
);

-- Unique constraint: attorney can only be applicant once per LPA doc
create unique index uq_lpa_doc_applicant_attorney
  on public.lpa_document_applicants(lpa_document_id, attorney_id)
  where attorney_id is not null;

-- Check constraint: donor role must have null attorney_id, attorney role must have non-null
alter table public.lpa_document_applicants
  add constraint ck_applicant_role_attorney_id
  check (
    (applicant_role = 'donor' and attorney_id is null)
    or
    (applicant_role = 'attorney' and attorney_id is not null)
  );

create index idx_lpa_doc_applicants_lpa_doc on public.lpa_document_applicants(lpa_document_id);
create index idx_lpa_doc_applicants_attorney on public.lpa_document_applicants(attorney_id);

-- ============================================================
-- Table: lpa_document_attorneys (junction)
-- Links attorneys to LPA documents with role
-- ============================================================
create table public.lpa_document_attorneys (
  id                uuid primary key default gen_random_uuid(),
  lpa_document_id   uuid not null references public.lpa_documents(id) on delete cascade,
  attorney_id       uuid not null references public.attorneys(id) on delete cascade,
  role              text not null check (role in ('primary', 'replacement')),
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- Unique: same attorney can't be same role twice on same doc
create unique index uq_lpa_doc_attorney_role
  on public.lpa_document_attorneys(lpa_document_id, attorney_id, role)
  where deleted_at is null;

create index idx_lpa_doc_attorneys_lpa_doc on public.lpa_document_attorneys(lpa_document_id);
create index idx_lpa_doc_attorneys_attorney on public.lpa_document_attorneys(attorney_id);

-- ============================================================
-- Table: people_to_notify
-- Up to 5 per LPA document
-- ============================================================
create table public.people_to_notify (
  id                uuid primary key default gen_random_uuid(),
  lpa_document_id   uuid not null references public.lpa_documents(id) on delete cascade,
  title             text not null,
  first_name        text not null,
  last_name         text not null,
  middle_name       text,
  address_line_1    text not null,
  address_line_2    text,
  city              text not null,
  county            text,
  postcode          text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index idx_people_to_notify_lpa_doc on public.people_to_notify(lpa_document_id);
create index idx_people_to_notify_deleted_at on public.people_to_notify(deleted_at) where deleted_at is null;

-- ============================================================
-- Table: certificate_providers
-- One per LPA document
-- ============================================================
create table public.certificate_providers (
  id                        uuid primary key default gen_random_uuid(),
  lpa_document_id           uuid not null references public.lpa_documents(id) on delete cascade,
  title                     text not null,
  first_name                text not null,
  last_name                 text not null,
  middle_name               text,
  address_line_1            text not null,
  address_line_2            text,
  city                      text not null,
  county                    text,
  postcode                  text not null,
  certification_basis       text not null
                            check (certification_basis in ('personal_knowledge', 'professional')),
  professional_title        text,
  relationship_length_years integer,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);

-- One certificate provider per LPA doc (unique when not soft-deleted)
create unique index uq_cert_provider_lpa_doc
  on public.certificate_providers(lpa_document_id)
  where deleted_at is null;

create index idx_cert_providers_deleted_at on public.certificate_providers(deleted_at) where deleted_at is null;

-- ============================================================
-- Table: benefits_assessments
-- One per donor — determines OPG fee tier
-- ============================================================
create table public.benefits_assessments (
  id                            uuid primary key default gen_random_uuid(),
  donor_id                      uuid not null references public.donors(id) on delete cascade unique,
  receives_means_tested_benefits boolean not null,
  selected_benefits             text[] not null default '{}',
  income_12k_or_more            boolean,
  receives_universal_credit     boolean,
  income_sources                text[],
  calculated_fee_tier           text not null
                                check (calculated_fee_tier in ('full', 'reduced', 'exempt')),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create index idx_benefits_assessments_donor on public.benefits_assessments(donor_id);

-- ============================================================
-- Table: payments
-- Stripe payment records
-- ============================================================
create table public.payments (
  id                          uuid primary key default gen_random_uuid(),
  application_id              uuid not null references public.applications(id) on delete cascade,
  stripe_checkout_session_id  text not null unique,
  stripe_payment_intent_id    text,
  amount_pence                integer not null,
  status                      text not null default 'pending'
                              check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  stripe_event_data           jsonb,
  paid_at                     timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_payments_application_id on public.payments(application_id);
create index idx_payments_status on public.payments(status);

-- ============================================================
-- Table: admin_users
-- Extends auth.users for admin-specific data
-- ============================================================
create table public.admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- Table: audit_logs
-- Field-level change tracking — INSERT ONLY
-- ============================================================
create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  table_name      text not null,
  record_id       uuid not null,
  action          text not null check (action in ('insert', 'update', 'delete')),
  field_name      text,
  old_value       jsonb,
  new_value       jsonb,
  changed_by      uuid,
  changed_by_role text check (changed_by_role in ('lead', 'admin', 'system') or changed_by_role is null),
  ip_address      text,
  created_at      timestamptz not null default now()
);

create index idx_audit_logs_table_record on public.audit_logs(table_name, record_id);
create index idx_audit_logs_changed_by on public.audit_logs(changed_by);
create index idx_audit_logs_created_at on public.audit_logs(created_at);
