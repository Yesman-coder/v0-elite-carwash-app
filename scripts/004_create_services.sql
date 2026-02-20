-- 004: Wash services catalog and vehicle-specific pricing
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  base_price decimal(10,2) not null default 0,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.services enable row level security;

-- Anyone can read services (public catalog)
create policy "services_select_all" on public.services
  for select using (true);

create policy "services_insert_auth" on public.services
  for insert with check (auth.uid() is not null);

create policy "services_update_auth" on public.services
  for update using (auth.uid() is not null);

create policy "services_delete_auth" on public.services
  for delete using (auth.uid() is not null);

-- Service pricing per vehicle type
create table if not exists public.service_vehicle_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade not null,
  vehicle_type_id uuid references public.vehicle_types(id) on delete cascade not null,
  price decimal(10,2) not null,
  unique(service_id, vehicle_type_id)
);

alter table public.service_vehicle_prices enable row level security;

create policy "svp_select_all" on public.service_vehicle_prices
  for select using (true);

create policy "svp_insert_auth" on public.service_vehicle_prices
  for insert with check (auth.uid() is not null);

create policy "svp_update_auth" on public.service_vehicle_prices
  for update using (auth.uid() is not null);

create policy "svp_delete_auth" on public.service_vehicle_prices
  for delete using (auth.uid() is not null);
