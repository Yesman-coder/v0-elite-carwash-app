-- 003: Vehicle types catalog
create table if not exists public.vehicle_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.vehicle_types enable row level security;

-- Anyone can read vehicle types (public catalog)
create policy "vehicle_types_select_all" on public.vehicle_types
  for select using (true);

-- Only authenticated users can manage vehicle types
create policy "vehicle_types_insert_auth" on public.vehicle_types
  for insert with check (auth.uid() is not null);

create policy "vehicle_types_update_auth" on public.vehicle_types
  for update using (auth.uid() is not null);
