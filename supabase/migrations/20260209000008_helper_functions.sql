-- ============================================================
-- Migration: Helper Functions for Edge Functions
-- ============================================================

-- Function to set session config variables for audit attribution
-- Called by Edge Functions before mutations
create or replace function public.set_audit_context(
  p_user_id text default '',
  p_user_role text default 'system',
  p_allow_system_edit text default 'false'
)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', p_user_id, true);
  perform set_config('app.current_user_role', p_user_role, true);
  perform set_config('app.allow_system_edit', p_allow_system_edit, true);
end;
$$;
