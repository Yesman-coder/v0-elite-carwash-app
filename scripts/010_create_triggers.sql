-- 010: Triggers for auto-creating profiles and settings on signup

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  -- Auto-create business settings
  insert into public.business_settings (owner_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_settings on public.business_settings;
create trigger set_updated_at_settings
  before update on public.business_settings
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_customers on public.customers;
create trigger set_updated_at_customers
  before update on public.customers
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_services on public.services;
create trigger set_updated_at_services
  before update on public.services
  for each row execute function public.handle_updated_at();
