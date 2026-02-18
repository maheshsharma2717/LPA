-- ============================================================
-- Seed Data for LPA Online Development
-- Run after migrations to populate test data
-- ============================================================

-- Note: In Supabase, auth.users are created via the Auth API, not direct SQL.
-- For local development with `supabase start`, you can use the dashboard
-- or the management API to create users, then insert profile rows.

-- The seed below assumes two auth users have been created:
--   Admin:  admin@lpa-online.test  (UUID: 00000000-0000-0000-0000-000000000001)
--   Lead:   lead@lpa-online.test   (UUID: 00000000-0000-0000-0000-000000000002)

-- ============================================================
-- Create test auth users (works with local Supabase only)
-- ============================================================
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@lpa-online.test',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'lead@lpa-online.test',
  crypt('Lead1234!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Test Lead"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

-- Auth identities (required for email login)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@lpa-online.test"}',
  'email',
  '00000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
), (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  '{"sub": "00000000-0000-0000-0000-000000000002", "email": "lead@lpa-online.test"}',
  'email',
  '00000000-0000-0000-0000-000000000002',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do nothing;

-- ============================================================
-- Admin user
-- ============================================================
insert into public.admin_users (id, email, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'admin@lpa-online.test',
  true
)
on conflict (id) do nothing;

-- ============================================================
-- Lead profile
-- ============================================================
insert into public.leads (
  id, title, first_name, last_name, middle_name,
  date_of_birth, address_line_1, city, postcode, mobile
)
values (
  '00000000-0000-0000-0000-000000000002',
  'Mr',
  'John',
  'Smith',
  'David',
  '1975-03-15',
  '42 Oak Lane',
  'London',
  'SW1A 1AA',
  '07700900001'
)
on conflict (id) do nothing;

-- ============================================================
-- Sample application
-- ============================================================
insert into public.applications (id, lead_id, status)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'draft'
)
on conflict (id) do nothing;

-- ============================================================
-- Sample donor (the lead themselves)
-- ============================================================
insert into public.donors (
  id, application_id, is_lead, title, first_name, last_name, middle_name,
  date_of_birth, address_line_1, city, postcode,
  relationship_to_lead, same_attorneys_for_both_types
)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  true,
  'Mr',
  'John',
  'Smith',
  'David',
  '1975-03-15',
  '42 Oak Lane',
  'London',
  'SW1A 1AA',
  'self',
  true
)
on conflict (id) do nothing;

-- ============================================================
-- Sample LPA documents (one of each type)
-- ============================================================
insert into public.lpa_documents (id, donor_id, lpa_type, status)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'health_and_welfare', 'draft'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'property_and_finance', 'draft')
on conflict (id) do nothing;

-- ============================================================
-- Sample attorneys
-- ============================================================
insert into public.attorneys (
  id, application_id, title, first_name, last_name,
  date_of_birth, address_line_1, city, postcode, email
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Mrs',
    'Jane',
    'Smith',
    '1978-07-22',
    '42 Oak Lane',
    'London',
    'SW1A 1AA',
    'jane.smith@example.com'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Mr',
    'Robert',
    'Jones',
    '1970-11-30',
    '10 Elm Street',
    'Manchester',
    'M1 1AA',
    'robert.jones@example.com'
  )
on conflict (id) do nothing;

-- ============================================================
-- Link attorneys to LPA documents
-- ============================================================
insert into public.lpa_document_attorneys (id, lpa_document_id, attorney_id, role, sort_order)
values
  -- H&W: Jane as primary, Robert as replacement
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'primary', 1),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'replacement', 1),
  -- P&F: Same attorneys (same_attorneys_for_both_types = true)
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'primary', 1),
  ('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'replacement', 1)
on conflict (id) do nothing;

-- ============================================================
-- Sample benefits assessment (full fee tier)
-- ============================================================
insert into public.benefits_assessments (
  id, donor_id, receives_means_tested_benefits,
  selected_benefits, calculated_fee_tier
)
values (
  '60000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  false,
  '{}',
  'full'
)
on conflict (donor_id) do nothing;
