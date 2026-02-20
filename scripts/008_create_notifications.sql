-- 008: Notification log (SMS stub)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  type text not null check (type in ('welcome', 'stamp', 'reward', 'reminder', 'promotion')),
  channel text default 'sms' check (channel in ('sms', 'push', 'email')),
  message text not null,
  status text default 'pending' check (status in ('pending', 'sent', 'failed', 'logged')),
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_customer on public.notifications(customer_id);

alter table public.notifications enable row level security;

create policy "notifications_select_owner" on public.notifications
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = notifications.customer_id and c.owner_id = auth.uid()
    )
  );

create policy "notifications_insert_owner" on public.notifications
  for insert with check (
    exists (
      select 1 from public.customers c
      where c.id = notifications.customer_id and c.owner_id = auth.uid()
    )
  );
