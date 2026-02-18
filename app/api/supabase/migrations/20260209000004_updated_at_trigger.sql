-- ============================================================
-- Migration: Auto-set updated_at on every UPDATE
-- ============================================================

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Apply to all tables with updated_at column
create trigger trg_updated_at_leads
  before update on public.leads
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_applications
  before update on public.applications
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_donors
  before update on public.donors
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_lpa_documents
  before update on public.lpa_documents
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_attorneys
  before update on public.attorneys
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_people_to_notify
  before update on public.people_to_notify
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_certificate_providers
  before update on public.certificate_providers
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_benefits_assessments
  before update on public.benefits_assessments
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_payments
  before update on public.payments
  for each row execute function public.fn_set_updated_at();

create trigger trg_updated_at_admin_users
  before update on public.admin_users
  for each row execute function public.fn_set_updated_at();
