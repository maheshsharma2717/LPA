-- ============================================================
-- Migration: Post-Payment Lock Trigger
-- Defence-in-depth: prevents edits to records after payment
-- even when using service_role (which bypasses RLS)
-- ============================================================

create or replace function public.fn_prevent_post_payment_edits()
returns trigger
language plpgsql
as $$
declare
  v_app_status text;
  v_application_id uuid;
begin
  -- Allow system edits (Edge Functions that set this flag)
  if current_setting('app.allow_system_edit', true) = 'true' then
    return NEW;
  end if;

  -- Determine the parent application ID based on the table
  case TG_TABLE_NAME
    when 'applications' then
      v_application_id := NEW.id;
    when 'donors' then
      v_application_id := NEW.application_id;
    when 'attorneys' then
      v_application_id := NEW.application_id;
    when 'lpa_documents' then
      select d.application_id into v_application_id
      from public.donors d
      where d.id = NEW.donor_id;
    when 'lpa_document_applicants' then
      select d.application_id into v_application_id
      from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      where ld.id = NEW.lpa_document_id;
    when 'lpa_document_attorneys' then
      select d.application_id into v_application_id
      from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      where ld.id = NEW.lpa_document_id;
    when 'people_to_notify' then
      select d.application_id into v_application_id
      from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      where ld.id = NEW.lpa_document_id;
    when 'certificate_providers' then
      select d.application_id into v_application_id
      from public.lpa_documents ld
      join public.donors d on d.id = ld.donor_id
      where ld.id = NEW.lpa_document_id;
    when 'benefits_assessments' then
      select d.application_id into v_application_id
      from public.donors d
      where d.id = NEW.donor_id;
    else
      -- Unknown table, allow
      return NEW;
  end case;

  -- Look up application status
  select status into v_app_status
  from public.applications
  where id = v_application_id;

  -- Block edits if application is in a locked state
  if v_app_status in ('paid', 'processing', 'completed') then
    raise exception 'Cannot modify records after payment. Application status: %', v_app_status;
  end if;

  return NEW;
end;
$$;

-- Apply to all core tables (not payments, audit_logs, or leads)
-- Note: leads table is excluded because a lead can have multiple applications
-- in different states. Lead profile edits are not locked by payment status.

create trigger trg_lock_applications
  before update on public.applications
  for each row execute function public.fn_prevent_post_payment_edits();

create trigger trg_lock_donors
  before update on public.donors
  for each row execute function public.fn_prevent_post_payment_edits();

create trigger trg_lock_lpa_documents
  before update on public.lpa_documents
  for each row execute function public.fn_prevent_post_payment_edits();

create trigger trg_lock_lpa_document_applicants
  before update on public.lpa_document_applicants
  for each row execute function public.fn_prevent_post_payment_edits();

create trigger trg_lock_attorneys
  before update on public.attorneys
  for each row execute function public.fn_prevent_post_payment_edits();

create trigger trg_lock_lpa_document_attorneys
  before update on public.lpa_document_attorneys
  for each row execute function public.fn_prevent_post_payment_edits();

create trigger trg_lock_people_to_notify
  before update on public.people_to_notify
  for each row execute function public.fn_prevent_post_payment_edits();

create trigger trg_lock_certificate_providers
  before update on public.certificate_providers
  for each row execute function public.fn_prevent_post_payment_edits();

create trigger trg_lock_benefits_assessments
  before update on public.benefits_assessments
  for each row execute function public.fn_prevent_post_payment_edits();
