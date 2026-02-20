-- 005: Customer records (no auth - token-based portal access)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  email text,
  vehicle_type_id uuid references public.vehicle_types(id),
  vehicle_plate text,
  vehicle_color text,
  vehicle_brand text,
  vehicle_model text,
  access_token text unique not null default encode(gen_random_bytes(32), 'hex'),
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_customers_access_token on public.customers(access_token);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_owner on public.customers(owner_id);

alter table public.customers enable row level security;

-- Owner can manage their own customers
create policy "customers_select_own" on public.customers
  for select using (auth.uid() = owner_id);

create policy "customers_insert_own" on public.customers
  for insert with check (auth.uid() = owner_id);

create policy "customers_update_own" on public.customers
  for update using (auth.uid() = owner_id);

create policy "customers_delete_own" on public.customers
  for delete using (auth.uid() = owner_id);
