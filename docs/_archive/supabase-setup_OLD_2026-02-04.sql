-- Walden Ridge Ops App: Phase 0 schema

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key,
  name text,
  role text,
  created_at timestamptz default now()
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  property_name text,
  city text,
  state text,
  brand_flag text,
  owner_entity text,
  management_company text,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists intakes_lead_call (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references opportunities(id),
  created_by uuid,
  captured_at timestamptz,
  data jsonb,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid references intakes_lead_call(id),
  opportunity_id uuid references opportunities(id),
  created_by uuid,
  template_id text,
  wr_class text,
  md_path text,
  pdf_path text,
  qa_report jsonb,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Optional: enable RLS
alter table profiles enable row level security;
alter table opportunities enable row level security;
alter table intakes_lead_call enable row level security;
alter table documents enable row level security;

-- Minimal RLS policies (owner read/write)
create policy "profiles_owner" on profiles
  for select using (auth.uid() = id);

create policy "profiles_owner_update" on profiles
  for update using (auth.uid() = id);

create policy "opportunities_owner" on opportunities
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "intakes_owner" on intakes_lead_call
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "documents_owner" on documents
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
