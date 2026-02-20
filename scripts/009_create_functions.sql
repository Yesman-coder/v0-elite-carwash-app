-- 009: Database functions for loyalty card operations

-- Function: Add a stamp to a loyalty card
create or replace function public.add_stamp(
  p_card_id uuid,
  p_service_id uuid,
  p_stamped_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card loyalty_cards%rowtype;
  v_stamp_number int;
  v_result jsonb;
begin
  -- Get the card and lock it
  select * into v_card from loyalty_cards where id = p_card_id for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Card not found');
  end if;

  if v_card.is_complete then
    return jsonb_build_object('success', false, 'error', 'Card is already complete');
  end if;

  if v_card.is_redeemed then
    return jsonb_build_object('success', false, 'error', 'Card has been redeemed');
  end if;

  -- Calculate stamp number
  v_stamp_number := v_card.current_stamps + 1;

  -- Insert the stamp record
  insert into loyalty_stamps (loyalty_card_id, stamp_number, service_id, stamped_by)
  values (p_card_id, v_stamp_number, p_service_id, p_stamped_by);

  -- Update the card stamp count
  update loyalty_cards
  set current_stamps = v_stamp_number,
      is_complete = (v_stamp_number >= v_card.stamps_required),
      completed_at = case when v_stamp_number >= v_card.stamps_required then now() else null end
  where id = p_card_id;

  v_result := jsonb_build_object(
    'success', true,
    'stamp_number', v_stamp_number,
    'stamps_required', v_card.stamps_required,
    'is_complete', (v_stamp_number >= v_card.stamps_required)
  );

  return v_result;
end;
$$;

-- Function: Redeem a completed loyalty card for a free wash
create or replace function public.redeem_card(
  p_card_id uuid,
  p_redeemed_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card loyalty_cards%rowtype;
  v_customer customers%rowtype;
  v_settings business_settings%rowtype;
  v_new_card_id uuid;
begin
  -- Get and lock the card
  select * into v_card from loyalty_cards where id = p_card_id for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Card not found');
  end if;

  if not v_card.is_complete then
    return jsonb_build_object('success', false, 'error', 'Card is not complete yet');
  end if;

  if v_card.is_redeemed then
    return jsonb_build_object('success', false, 'error', 'Card has already been redeemed');
  end if;

  -- Get customer info
  select * into v_customer from customers where id = v_card.customer_id;

  -- Get business settings for stamps_required on new card
  select * into v_settings from business_settings where owner_id = v_customer.owner_id limit 1;

  -- Mark card as redeemed
  update loyalty_cards
  set is_redeemed = true,
      redeemed_at = now()
  where id = p_card_id;

  -- Record the free wash visit
  insert into visits (customer_id, service_id, loyalty_card_id, amount, payment_method, payment_status, is_free_wash, served_by, notes)
  values (v_card.customer_id, null, p_card_id, 0, 'free_wash', 'free', true, p_redeemed_by, 'Lavado gratis por tarjeta de lealtad completada');

  -- Create a new loyalty card for the customer
  insert into loyalty_cards (customer_id, stamps_required)
  values (v_card.customer_id, coalesce(v_settings.stamps_required, 5))
  returning id into v_new_card_id;

  return jsonb_build_object(
    'success', true,
    'redeemed_card_id', p_card_id,
    'new_card_id', v_new_card_id,
    'customer_name', v_customer.full_name
  );
end;
$$;

-- Function: Get customer data by access token (for portal - no auth required)
create or replace function public.get_customer_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer jsonb;
begin
  select jsonb_build_object(
    'id', c.id,
    'full_name', c.full_name,
    'phone', c.phone,
    'email', c.email,
    'vehicle_type_id', c.vehicle_type_id,
    'vehicle_plate', c.vehicle_plate,
    'vehicle_color', c.vehicle_color,
    'vehicle_brand', c.vehicle_brand,
    'vehicle_model', c.vehicle_model,
    'is_active', c.is_active,
    'created_at', c.created_at,
    'vehicle_type', (select vt.name from vehicle_types vt where vt.id = c.vehicle_type_id),
    'business_name', (select bs.business_name from business_settings bs where bs.owner_id = c.owner_id limit 1)
  ) into v_customer
  from customers c
  where c.access_token = p_token and c.is_active = true;

  if v_customer is null then
    return jsonb_build_object('success', false, 'error', 'Customer not found');
  end if;

  return jsonb_build_object('success', true, 'customer', v_customer);
end;
$$;

-- Function: Get loyalty cards for a customer by token (portal)
create or replace function public.get_loyalty_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_cards jsonb;
begin
  select id into v_customer_id from customers where access_token = p_token and is_active = true;

  if v_customer_id is null then
    return jsonb_build_object('success', false, 'error', 'Customer not found');
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', lc.id,
      'stamps_required', lc.stamps_required,
      'current_stamps', lc.current_stamps,
      'is_complete', lc.is_complete,
      'is_redeemed', lc.is_redeemed,
      'redeemed_at', lc.redeemed_at,
      'completed_at', lc.completed_at,
      'card_number', lc.card_number,
      'created_at', lc.created_at,
      'stamps', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', ls.id,
            'stamp_number', ls.stamp_number,
            'stamped_at', ls.stamped_at,
            'service_name', (select s.name from services s where s.id = ls.service_id)
          ) order by ls.stamp_number
        ), '[]'::jsonb)
        from loyalty_stamps ls where ls.loyalty_card_id = lc.id
      )
    ) order by lc.created_at desc
  ) into v_cards
  from loyalty_cards lc
  where lc.customer_id = v_customer_id;

  return jsonb_build_object('success', true, 'cards', coalesce(v_cards, '[]'::jsonb));
end;
$$;

-- Function: Get visits for a customer by token (portal)
create or replace function public.get_visits_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_visits jsonb;
begin
  select id into v_customer_id from customers where access_token = p_token and is_active = true;

  if v_customer_id is null then
    return jsonb_build_object('success', false, 'error', 'Customer not found');
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', v.id,
      'service_name', (select s.name from services s where s.id = v.service_id),
      'amount', v.amount,
      'payment_method', v.payment_method,
      'payment_status', v.payment_status,
      'is_free_wash', v.is_free_wash,
      'notes', v.notes,
      'created_at', v.created_at
    ) order by v.created_at desc
  ), '[]'::jsonb) into v_visits
  from visits v
  where v.customer_id = v_customer_id;

  return jsonb_build_object('success', true, 'visits', v_visits);
end;
$$;
