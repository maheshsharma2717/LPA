-- ============================================================
-- Migration: Row Level Security Policies
-- ============================================================

-- Helper function: check if current user is an active admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid()
      and is_active = true
  );
$$;

-- Helper function: check if an application is editable (not yet paid)
create or replace function public.is_application_editable(app_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.applications
    where id = app_id
      and status not in ('paid', 'processing', 'completed')
      and deleted_at is null
  );
$$;

-- ============================================================
-- leads
-- ============================================================
alter table public.leads enable row level security;

-- Lead can read own record
create policy leads_select_own on public.leads
  for select using (id = auth.uid());

-- Lead can insert own record
create policy leads_insert_own on public.leads
  for insert with check (id = auth.uid());

-- Lead can update own record
create policy leads_update_own on public.leads
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Admin can read all leads
create policy leads_admin_select on public.leads
  for select using (public.is_admin());

-- Admin can update leads (pre-payment checked at application level)
create policy leads_admin_update on public.leads
  for update using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- applications
-- ============================================================
alter table public.applications enable row level security;

-- Lead can read own applications
create policy applications_select_own on public.applications
  for select using (lead_id = auth.uid());

-- Lead can insert own applications
create policy applications_insert_own on public.applications
  for insert with check (lead_id = auth.uid());

-- Lead can update own applications (only if editable)
create policy applications_update_own on public.applications
  for update using (
    lead_id = auth.uid()
    and status not in ('paid', 'processing', 'completed')
  )
  with check (lead_id = auth.uid());

-- Admin can read all applications
create policy applications_admin_select on public.applications
  for select using (public.is_admin());

-- Admin can update applications (only if editable)
create policy applications_admin_update on public.applications
  for update using (
    public.is_admin()
    and status not in ('paid', 'processing', 'completed')
  );

-- ============================================================
-- donors
-- ============================================================
alter table public.donors enable row level security;

-- Lead: select via own application
create policy donors_select_own on public.donors
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = donors.application_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: insert — must reference own application
create policy donors_insert_own on public.donors
  for insert with check (
    exists (
      select 1 from public.applications a
      where a.id = donors.application_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: update — own application, editable, cannot change application_id
create policy donors_update_own on public.donors
  for update using (
    exists (
      select 1 from public.applications a
      where a.id = donors.application_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      where a.id = donors.application_id
        and a.lead_id = auth.uid()
    )
  );

-- Admin: select all
create policy donors_admin_select on public.donors
  for select using (public.is_admin());

-- Admin: update (pre-payment only)
create policy donors_admin_update on public.donors
  for update using (
    public.is_admin()
    and public.is_application_editable(application_id)
  );

-- ============================================================
-- lpa_documents
-- ============================================================
alter table public.lpa_documents enable row level security;

-- Lead: select via own application chain (donor → application)
create policy lpa_documents_select_own on public.lpa_documents
  for select using (
    exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = lpa_documents.donor_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: insert — must reference own donor
create policy lpa_documents_insert_own on public.lpa_documents
  for insert with check (
    exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = lpa_documents.donor_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: update — own, editable
create policy lpa_documents_update_own on public.lpa_documents
  for update using (
    exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = lpa_documents.donor_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = lpa_documents.donor_id
        and a.lead_id = auth.uid()
    )
  );

-- Admin: select all
create policy lpa_documents_admin_select on public.lpa_documents
  for select using (public.is_admin());

-- Admin: update (pre-payment)
create policy lpa_documents_admin_update on public.lpa_documents
  for update using (
    public.is_admin()
    and exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = lpa_documents.donor_id
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

-- ============================================================
-- lpa_document_applicants
-- ============================================================
alter table public.lpa_document_applicants enable row level security;

-- Lead: select via own chain
create policy lpa_doc_applicants_select_own on public.lpa_document_applicants
  for select using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_applicants.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: insert
create policy lpa_doc_applicants_insert_own on public.lpa_document_applicants
  for insert with check (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_applicants.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: update (pre-payment)
create policy lpa_doc_applicants_update_own on public.lpa_document_applicants
  for update using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_applicants.lpa_document_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_applicants.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: delete (to remove applicant entries)
create policy lpa_doc_applicants_delete_own on public.lpa_document_applicants
  for delete using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_applicants.lpa_document_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

-- Admin: select all
create policy lpa_doc_applicants_admin_select on public.lpa_document_applicants
  for select using (public.is_admin());

-- Admin: update/insert/delete (pre-payment)
create policy lpa_doc_applicants_admin_update on public.lpa_document_applicants
  for update using (
    public.is_admin()
    and exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_applicants.lpa_document_id
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

create policy lpa_doc_applicants_admin_insert on public.lpa_document_applicants
  for insert with check (public.is_admin());

create policy lpa_doc_applicants_admin_delete on public.lpa_document_applicants
  for delete using (
    public.is_admin()
    and exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_applicants.lpa_document_id
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

-- ============================================================
-- attorneys
-- ============================================================
alter table public.attorneys enable row level security;

-- Lead: select via own application
create policy attorneys_select_own on public.attorneys
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = attorneys.application_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: insert — must reference own application
create policy attorneys_insert_own on public.attorneys
  for insert with check (
    exists (
      select 1 from public.applications a
      where a.id = attorneys.application_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: update — own application, editable
create policy attorneys_update_own on public.attorneys
  for update using (
    exists (
      select 1 from public.applications a
      where a.id = attorneys.application_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      where a.id = attorneys.application_id
        and a.lead_id = auth.uid()
    )
  );

-- Admin: select all
create policy attorneys_admin_select on public.attorneys
  for select using (public.is_admin());

-- Admin: update (pre-payment)
create policy attorneys_admin_update on public.attorneys
  for update using (
    public.is_admin()
    and public.is_application_editable(application_id)
  );

-- ============================================================
-- lpa_document_attorneys (junction)
-- ============================================================
alter table public.lpa_document_attorneys enable row level security;

-- Lead: select via own chain
create policy lpa_doc_attorneys_select_own on public.lpa_document_attorneys
  for select using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_attorneys.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: insert
create policy lpa_doc_attorneys_insert_own on public.lpa_document_attorneys
  for insert with check (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_attorneys.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: update (pre-payment)
create policy lpa_doc_attorneys_update_own on public.lpa_document_attorneys
  for update using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_attorneys.lpa_document_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_attorneys.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: delete (to remove junction entries)
create policy lpa_doc_attorneys_delete_own on public.lpa_document_attorneys
  for delete using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_attorneys.lpa_document_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

-- Admin: select all
create policy lpa_doc_attorneys_admin_select on public.lpa_document_attorneys
  for select using (public.is_admin());

-- Admin: full CRUD (pre-payment)
create policy lpa_doc_attorneys_admin_insert on public.lpa_document_attorneys
  for insert with check (public.is_admin());

create policy lpa_doc_attorneys_admin_update on public.lpa_document_attorneys
  for update using (
    public.is_admin()
    and exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_attorneys.lpa_document_id
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

create policy lpa_doc_attorneys_admin_delete on public.lpa_document_attorneys
  for delete using (
    public.is_admin()
    and exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = lpa_document_attorneys.lpa_document_id
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

-- ============================================================
-- people_to_notify
-- ============================================================
alter table public.people_to_notify enable row level security;

-- Lead: select via own chain
create policy people_to_notify_select_own on public.people_to_notify
  for select using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = people_to_notify.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: insert
create policy people_to_notify_insert_own on public.people_to_notify
  for insert with check (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = people_to_notify.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: update (pre-payment)
create policy people_to_notify_update_own on public.people_to_notify
  for update using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = people_to_notify.lpa_document_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = people_to_notify.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Admin: select all
create policy people_to_notify_admin_select on public.people_to_notify
  for select using (public.is_admin());

-- Admin: update (pre-payment)
create policy people_to_notify_admin_update on public.people_to_notify
  for update using (
    public.is_admin()
    and exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = people_to_notify.lpa_document_id
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

-- ============================================================
-- certificate_providers
-- ============================================================
alter table public.certificate_providers enable row level security;

-- Lead: select via own chain
create policy cert_providers_select_own on public.certificate_providers
  for select using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = certificate_providers.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: insert
create policy cert_providers_insert_own on public.certificate_providers
  for insert with check (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = certificate_providers.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: update (pre-payment)
create policy cert_providers_update_own on public.certificate_providers
  for update using (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = certificate_providers.lpa_document_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = certificate_providers.lpa_document_id
        and a.lead_id = auth.uid()
    )
  );

-- Admin: select all
create policy cert_providers_admin_select on public.certificate_providers
  for select using (public.is_admin());

-- Admin: update (pre-payment)
create policy cert_providers_admin_update on public.certificate_providers
  for update using (
    public.is_admin()
    and exists (
      select 1 from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      join public.applications a on a.id = d.application_id
      where ld.id = certificate_providers.lpa_document_id
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

-- ============================================================
-- benefits_assessments
-- ============================================================
alter table public.benefits_assessments enable row level security;

-- Lead: select via own chain
create policy benefits_select_own on public.benefits_assessments
  for select using (
    exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = benefits_assessments.donor_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: insert
create policy benefits_insert_own on public.benefits_assessments
  for insert with check (
    exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = benefits_assessments.donor_id
        and a.lead_id = auth.uid()
    )
  );

-- Lead: update (pre-payment)
create policy benefits_update_own on public.benefits_assessments
  for update using (
    exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = benefits_assessments.donor_id
        and a.lead_id = auth.uid()
        and a.status not in ('paid', 'processing', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = benefits_assessments.donor_id
        and a.lead_id = auth.uid()
    )
  );

-- Admin: select all
create policy benefits_admin_select on public.benefits_assessments
  for select using (public.is_admin());

-- Admin: update (pre-payment)
create policy benefits_admin_update on public.benefits_assessments
  for update using (
    public.is_admin()
    and exists (
      select 1 from public.donors d
      join public.applications a on a.id = d.application_id
      where d.id = benefits_assessments.donor_id
        and a.status not in ('paid', 'processing', 'completed')
    )
  );

-- ============================================================
-- payments
-- ============================================================
alter table public.payments enable row level security;

-- Lead: read own payments only
create policy payments_select_own on public.payments
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = payments.application_id
        and a.lead_id = auth.uid()
    )
  );

-- Admin: read all payments
create policy payments_admin_select on public.payments
  for select using (public.is_admin());

-- ============================================================
-- admin_users
-- ============================================================
alter table public.admin_users enable row level security;

-- Admin: read own record
create policy admin_users_select_own on public.admin_users
  for select using (id = auth.uid());

-- Admin: update own record
create policy admin_users_update_own on public.admin_users
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- audit_logs
-- ============================================================
alter table public.audit_logs enable row level security;

-- Admin: read all audit logs
create policy audit_logs_admin_select on public.audit_logs
  for select using (public.is_admin());

-- No insert/update/delete policies for users — audit logs are written by triggers only
