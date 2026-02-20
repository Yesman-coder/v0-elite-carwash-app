-- 007: Visit/transaction history
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  service_id uuid references public.services(id),
  vehicle_type_id uuid references public.vehicle_types(id),
  loyalty_card_id uuid references public.loyalty_cards(id),
  amount decimal(10,2),
  payment_method text default 'pending' check (payment_method in ('cash', 'transfer', 'card', 'free_wash', 'pending')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'free')),
  is_free_wash boolean default false,
  notes text,
  served_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_visits_customer on public.visits(customer_id);
create index if not exists idx_visits_date on public.visits(created_at desc);

alter table public.visits enable row level security;

create policy "visits_select_owner" on public.visits
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = visits.customer_id and c.owner_id = auth.uid()
    )
  );

create policy "visits_insert_owner" on public.visits
  for insert with check (
    exists (
      select 1 from public.customers c
      where c.id = visits.customer_id and c.owner_id = auth.uid()
    )
  );

create policy "visits_update_owner" on public.visits
  for update using (
    exists (
      select 1 from public.customers c
      where c.id = visits.customer_id and c.owner_id = auth.uid()
    )
  );
