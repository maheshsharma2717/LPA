-- ============================================================
-- Migration: Audit Log Trigger Function
-- Field-level change tracking for all audited tables
-- ============================================================

create or replace function public.fn_audit_log()
returns trigger
language plpgsql
security definer
as $$
declare
  v_changed_by uuid;
  v_changed_by_role text;
  v_old_value jsonb;
  v_new_value jsonb;
  col_name text;
  v_record_id uuid;
begin
  -- Determine who made the change
  v_changed_by := coalesce(
    nullif(current_setting('app.current_user_id', true), '')::uuid,
    auth.uid()
  );

  -- Determine role
  v_changed_by_role := nullif(current_setting('app.current_user_role', true), '');
  if v_changed_by_role is null and v_changed_by is not null then
    if exists (select 1 from public.admin_users where id = v_changed_by and is_active = true) then
      v_changed_by_role := 'admin';
    else
      v_changed_by_role := 'lead';
    end if;
  end if;

  if TG_OP = 'INSERT' then
    v_record_id := NEW.id;
    insert into public.audit_logs (table_name, record_id, action, changed_by, changed_by_role)
    values (TG_TABLE_NAME, v_record_id, 'insert', v_changed_by, v_changed_by_role);
    return NEW;

  elsif TG_OP = 'DELETE' then
    v_record_id := OLD.id;
    insert into public.audit_logs (table_name, record_id, action, changed_by, changed_by_role)
    values (TG_TABLE_NAME, v_record_id, 'delete', v_changed_by, v_changed_by_role);
    return OLD;

  elsif TG_OP = 'UPDATE' then
    v_record_id := NEW.id;

    -- Iterate over each column and log changes
    for col_name in
      select column_name
      from information_schema.columns
      where table_schema = TG_TABLE_SCHEMA
        and table_name = TG_TABLE_NAME
        and column_name not in ('created_at', 'updated_at')
    loop
      execute format('select to_jsonb(($1).%I)', col_name) using OLD into v_old_value;
      execute format('select to_jsonb(($1).%I)', col_name) using NEW into v_new_value;

      -- Only log if the value actually changed (handling nulls)
      if v_old_value is distinct from v_new_value then
        insert into public.audit_logs (
          table_name, record_id, action, field_name,
          old_value, new_value, changed_by, changed_by_role
        )
        values (
          TG_TABLE_NAME, v_record_id, 'update', col_name,
          v_old_value, v_new_value, v_changed_by, v_changed_by_role
        );
      end if;
    end loop;

    return NEW;
  end if;

  return null;
end;
$$;

-- Apply audit trigger to all audited tables
create trigger trg_audit_leads
  after insert or update or delete on public.leads
  for each row execute function public.fn_audit_log();

create trigger trg_audit_applications
  after insert or update or delete on public.applications
  for each row execute function public.fn_audit_log();

create trigger trg_audit_donors
  after insert or update or delete on public.donors
  for each row execute function public.fn_audit_log();

create trigger trg_audit_lpa_documents
  after insert or update or delete on public.lpa_documents
  for each row execute function public.fn_audit_log();

create trigger trg_audit_lpa_document_applicants
  after insert or update or delete on public.lpa_document_applicants
  for each row execute function public.fn_audit_log();

create trigger trg_audit_attorneys
  after insert or update or delete on public.attorneys
  for each row execute function public.fn_audit_log();

create trigger trg_audit_lpa_document_attorneys
  after insert or update or delete on public.lpa_document_attorneys
  for each row execute function public.fn_audit_log();

create trigger trg_audit_people_to_notify
  after insert or update or delete on public.people_to_notify
  for each row execute function public.fn_audit_log();

create trigger trg_audit_certificate_providers
  after insert or update or delete on public.certificate_providers
  for each row execute function public.fn_audit_log();

create trigger trg_audit_benefits_assessments
  after insert or update or delete on public.benefits_assessments
  for each row execute function public.fn_audit_log();
