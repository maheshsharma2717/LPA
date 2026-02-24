-- ============================================================
-- Migration: People-to-Notify Limit Trigger
-- Enforces maximum of 5 active people to notify per LPA document
-- ============================================================

create or replace function public.fn_check_notify_limit()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.people_to_notify
  where lpa_document_id = NEW.lpa_document_id
    and deleted_at is null;

  if v_count >= 5 then
    raise exception 'Maximum of 5 people to notify per LPA document reached.';
  end if;

  return NEW;
end;
$$;

create trigger trg_check_notify_limit
  before insert on public.people_to_notify
  for each row execute function public.fn_check_notify_limit();
