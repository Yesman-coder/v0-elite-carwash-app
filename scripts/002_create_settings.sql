-- 002: Business settings table (configurable stamps, SMS templates, etc.)
create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  stamps_required int default 5 check (stamps_required >= 2 and stamps_required <= 20),
  business_name text default 'Elite Carwash',
  business_phone text,
  business_address text,
  welcome_sms_template text default 'Bienvenido a Elite Carwash! Tu tarjeta de lealtad ha sido activada.',
  reward_sms_template text default 'Felicidades! Has ganado un lavado gratis en Elite Carwash!',
  reminder_sms_template text default 'Te extrañamos en Elite Carwash! Ven por tu proximo lavado.',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.business_settings enable row level security;

create policy "settings_select_own" on public.business_settings
  for select using (auth.uid() = owner_id);

create policy "settings_insert_own" on public.business_settings
  for insert with check (auth.uid() = owner_id);

create policy "settings_update_own" on public.business_settings
  for update using (auth.uid() = owner_id);
