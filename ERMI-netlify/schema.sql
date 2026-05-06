-- ERMI production schema draft for PostgreSQL/Supabase.
-- Authentication should be owned by Clerk/Supabase Auth/Auth0, not by custom password tables.
-- Passwords are intentionally not represented here.

create type user_role as enum ('patient', 'clinician', 'support', 'admin', 'super_admin');
create type pharmacy_choice_type as enum ('partner', 'own_pharmacy');

create table users (
  id uuid primary key,
  email text unique not null,
  role user_role not null default 'patient',
  auth_provider text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table patient_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  phone text,
  province text,
  created_at timestamptz not null default now()
);

create table clinician_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null,
  license_province text not null,
  license_status text not null default 'pending_verification',
  specialty text,
  created_at timestamptz not null default now()
);

create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  condition text not null,
  answers_json jsonb not null,
  status text not null default 'quiz_submitted',
  created_at timestamptz not null default now()
);

create table consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  clinician_id uuid references users(id),
  scheduled_at timestamptz,
  status text not null default 'consult_booked',
  notes text,
  created_at timestamptz not null default now()
);

create table prescription_statuses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  status text not null default 'clinical_review_pending',
  note text,
  updated_at timestamptz not null default now()
);

create table pharmacy_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  pharmacy_name text,
  pharmacy_choice_type pharmacy_choice_type not null,
  status text not null default 'not_started',
  tracking_number text,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text not null,
  status text not null,
  monthly_price_cents integer not null,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  stripe_payment_intent_id text,
  item text not null,
  amount_cents integer not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  subject text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  consent_type text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet
);

create table admin_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  author_user_id uuid not null references users(id),
  body text not null,
  visibility text not null default 'operations_only',
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  target_user_id uuid references users(id),
  action text not null,
  reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references users(id),
  target_user_id uuid not null references users(id),
  reason text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  actions_taken jsonb not null default '[]'::jsonb
);

create index idx_quiz_patient on quiz_responses(patient_id);
create index idx_consults_patient on consultations(patient_id);
create index idx_consults_clinician on consultations(clinician_id);
create index idx_audit_actor on audit_logs(actor_user_id);
create index idx_audit_target on audit_logs(target_user_id);
