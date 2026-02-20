-- 006: Loyalty cards and stamps (CORE FEATURE)
create table if not exists public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  stamps_required int not null default 5,
  current_stamps int default 0 check (current_stamps >= 0),
  is_complete boolean default false,
  is_redeemed boolean default false,
  redeemed_at timestamptz,
  completed_at timestamptz,
  card_number serial,
  created_at timestamptz default now()
);

create index if not exists idx_loyalty_cards_customer on public.loyalty_cards(customer_id);
create index if not exists idx_loyalty_cards_active on public.loyalty_cards(customer_id) where is_redeemed = false;

alter table public.loyalty_cards enable row level security;

-- Owner can manage loyalty cards of their customers
create policy "loyalty_cards_select_owner" on public.loyalty_cards
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = loyalty_cards.customer_id and c.owner_id = auth.uid()
    )
  );

create policy "loyalty_cards_insert_owner" on public.loyalty_cards
  for insert with check (
    exists (
      select 1 from public.customers c
      where c.id = loyalty_cards.customer_id and c.owner_id = auth.uid()
    )
  );

create policy "loyalty_cards_update_owner" on public.loyalty_cards
  for update using (
    exists (
      select 1 from public.customers c
      where c.id = loyalty_cards.customer_id and c.owner_id = auth.uid()
    )
  );

-- Stamps on loyalty cards
create table if not exists public.loyalty_stamps (
  id uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid references public.loyalty_cards(id) on delete cascade not null,
  stamp_number int not null,
  service_id uuid references public.services(id),
  stamped_by uuid references auth.users(id),
  stamped_at timestamptz default now(),
  notes text
);

create index if not exists idx_loyalty_stamps_card on public.loyalty_stamps(loyalty_card_id);

alter table public.loyalty_stamps enable row level security;

create policy "loyalty_stamps_select_owner" on public.loyalty_stamps
  for select using (
    exists (
      select 1 from public.loyalty_cards lc
      join public.customers c on c.id = lc.customer_id
      where lc.id = loyalty_stamps.loyalty_card_id and c.owner_id = auth.uid()
    )
  );

create policy "loyalty_stamps_insert_owner" on public.loyalty_stamps
  for insert with check (
    exists (
      select 1 from public.loyalty_cards lc
      join public.customers c on c.id = lc.customer_id
      where lc.id = loyalty_stamps.loyalty_card_id and c.owner_id = auth.uid()
    )
  );
