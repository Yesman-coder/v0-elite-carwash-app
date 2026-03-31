-- =============================================================================
-- 012: Fix schema mismatches between DB and application code
-- Run this AFTER scripts 001-011
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SERVICES: add missing columns (owner_id, earns_stamp, category,
--    duration_minutes, updated_at)
-- -----------------------------------------------------------------------------
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS earns_stamp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'wash'
    CHECK (category IN ('wash', 'detail', 'addon', 'premium')),
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index on owner_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_services_owner ON public.services(owner_id);

-- Drop old RLS policies that had no owner filter
DROP POLICY IF EXISTS "services_insert_auth" ON public.services;
DROP POLICY IF EXISTS "services_update_auth" ON public.services;
DROP POLICY IF EXISTS "services_delete_auth" ON public.services;
DROP POLICY IF EXISTS "services_select_all" ON public.services;

-- New RLS: global (null owner_id) readable by all; owner-specific only by owner
CREATE POLICY "services_select" ON public.services
  FOR SELECT USING (owner_id IS NULL OR auth.uid() = owner_id);

CREATE POLICY "services_insert_own" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "services_update_own" ON public.services
  FOR UPDATE USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "services_delete_own" ON public.services
  FOR DELETE USING (auth.uid() = owner_id);

-- updated_at trigger for services
DROP TRIGGER IF EXISTS set_updated_at_services ON public.services;
CREATE TRIGGER set_updated_at_services
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 2. LOYALTY_CARDS: add missing columns (owner_id, status, updated_at)
-- -----------------------------------------------------------------------------
ALTER TABLE public.loyalty_cards
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill owner_id from customers table
UPDATE public.loyalty_cards lc
SET owner_id = c.owner_id
FROM public.customers c
WHERE lc.customer_id = c.id
  AND lc.owner_id IS NULL;

-- Add status as a generated column (computed from is_complete / is_redeemed)
-- Supabase/Postgres doesn't support generated columns on existing tables easily,
-- so we use a view or a real column kept in sync via trigger.
-- We'll add a real column and keep it synced with a trigger.
ALTER TABLE public.loyalty_cards
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'redeemed', 'expired'));

-- Backfill status
UPDATE public.loyalty_cards
SET status = CASE
  WHEN is_redeemed = true THEN 'redeemed'
  WHEN is_complete = true THEN 'completed'
  ELSE 'active'
END;

-- Trigger to keep status in sync
CREATE OR REPLACE FUNCTION public.sync_loyalty_card_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_redeemed = true THEN
    NEW.status := 'redeemed';
  ELSIF NEW.is_complete = true THEN
    NEW.status := 'completed';
  ELSE
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_loyalty_card_status_trigger ON public.loyalty_cards;
CREATE TRIGGER sync_loyalty_card_status_trigger
  BEFORE INSERT OR UPDATE ON public.loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION public.sync_loyalty_card_status();

CREATE INDEX IF NOT EXISTS idx_loyalty_cards_owner ON public.loyalty_cards(owner_id);

-- Drop old RLS that referenced non-existent owner_id column
DROP POLICY IF EXISTS "loyalty_cards_select_owner" ON public.loyalty_cards;
DROP POLICY IF EXISTS "loyalty_cards_insert_owner" ON public.loyalty_cards;
DROP POLICY IF EXISTS "loyalty_cards_update_owner" ON public.loyalty_cards;

-- New RLS using owner_id column directly
CREATE POLICY "loyalty_cards_select_owner" ON public.loyalty_cards
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "loyalty_cards_insert_owner" ON public.loyalty_cards
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "loyalty_cards_update_owner" ON public.loyalty_cards
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "loyalty_cards_delete_owner" ON public.loyalty_cards
  FOR DELETE USING (auth.uid() = owner_id);

-- updated_at trigger for loyalty_cards
DROP TRIGGER IF EXISTS set_updated_at_loyalty_cards ON public.loyalty_cards;
CREATE TRIGGER set_updated_at_loyalty_cards
  BEFORE UPDATE ON public.loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 3. LOYALTY_STAMPS: add missing columns (owner_id)
-- -----------------------------------------------------------------------------
ALTER TABLE public.loyalty_stamps
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill owner_id from loyalty_cards
UPDATE public.loyalty_stamps ls
SET owner_id = lc.owner_id
FROM public.loyalty_cards lc
WHERE ls.loyalty_card_id = lc.id
  AND ls.owner_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_loyalty_stamps_owner ON public.loyalty_stamps(owner_id);

-- Drop old RLS for stamps
DROP POLICY IF EXISTS "loyalty_stamps_select_owner" ON public.loyalty_stamps;
DROP POLICY IF EXISTS "loyalty_stamps_insert_owner" ON public.loyalty_stamps;

CREATE POLICY "loyalty_stamps_select_owner" ON public.loyalty_stamps
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "loyalty_stamps_insert_owner" ON public.loyalty_stamps
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- -----------------------------------------------------------------------------
-- 4. VISITS: add missing columns (owner_id, service_name, price, final_price,
--    km_reading, updated_at) and fix payment_method constraint
-- -----------------------------------------------------------------------------
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS service_name text,
  ADD COLUMN IF NOT EXISTS vehicle_type_name text,
  ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km_reading integer,
  ADD COLUMN IF NOT EXISTS served_by_name text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Rename 'amount' column to keep it but also have 'price' (for code compat)
-- The code uses 'price' and 'final_price'; we keep 'amount' too for backwards compat
-- Backfill price from amount where available
UPDATE public.visits SET price = COALESCE(amount, 0), final_price = COALESCE(amount, 0)
WHERE price = 0 OR price IS NULL;

-- Backfill owner_id from customers
UPDATE public.visits v
SET owner_id = c.owner_id
FROM public.customers c
WHERE v.customer_id = c.id
  AND v.owner_id IS NULL;

-- Drop the old payment_method constraint and recreate with pago_movil
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS visits_payment_method_check;
ALTER TABLE public.visits
  ADD CONSTRAINT visits_payment_method_check
    CHECK (payment_method IN ('cash', 'transfer', 'card', 'free_wash', 'pago_movil', 'pending', 'free'));

CREATE INDEX IF NOT EXISTS idx_visits_owner ON public.visits(owner_id);

-- Drop old RLS (referenced non-existent column)
DROP POLICY IF EXISTS "visits_select_owner" ON public.visits;
DROP POLICY IF EXISTS "visits_insert_owner" ON public.visits;
DROP POLICY IF EXISTS "visits_update_owner" ON public.visits;

-- New RLS using owner_id column
CREATE POLICY "visits_select_owner" ON public.visits
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "visits_insert_owner" ON public.visits
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "visits_update_owner" ON public.visits
  FOR UPDATE USING (auth.uid() = owner_id);

-- updated_at trigger for visits
DROP TRIGGER IF EXISTS set_updated_at_visits ON public.visits;
CREATE TRIGGER set_updated_at_visits
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. CUSTOMERS: add last_oil_change_date column (spec requires it)
--    (last_km and last_oil_change_km already exist as per script 005 using
--    vehicle_brand, vehicle_model naming; we add the missing date field)
-- -----------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS last_oil_change_date date,
  ADD COLUMN IF NOT EXISTS last_tire_rotation_km integer,
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'loyalty'
    CHECK (account_type IN ('loyalty', 'subscription'));

-- -----------------------------------------------------------------------------
-- 6. Fix add_stamp RPC function to match the call signature used in code:
--    add_stamp(p_card_id, p_owner_id, p_service_id, p_notes)
--    Previous signature was: add_stamp(p_card_id, p_service_id, p_stamped_by)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.add_stamp(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.add_stamp(
  p_card_id   uuid,
  p_owner_id  uuid,
  p_service_id uuid DEFAULT NULL,
  p_notes     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card      loyalty_cards%ROWTYPE;
  v_stamp_num integer;
  v_result    jsonb;
BEGIN
  -- Lock and fetch the card
  SELECT * INTO v_card FROM loyalty_cards
  WHERE id = p_card_id AND owner_id = p_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tarjeta no encontrada');
  END IF;

  IF v_card.is_complete THEN
    RETURN jsonb_build_object('success', false, 'error', 'La tarjeta ya esta completa');
  END IF;

  IF v_card.is_redeemed THEN
    RETURN jsonb_build_object('success', false, 'error', 'La tarjeta ya fue redimida');
  END IF;

  v_stamp_num := v_card.current_stamps + 1;

  -- Insert stamp record
  INSERT INTO loyalty_stamps (loyalty_card_id, stamp_number, service_id, stamped_by, owner_id, notes)
  VALUES (p_card_id, v_stamp_num, p_service_id, p_owner_id, p_owner_id, p_notes);

  -- Update card
  UPDATE loyalty_cards
  SET current_stamps = v_stamp_num,
      is_complete    = (v_stamp_num >= stamps_required),
      completed_at   = CASE WHEN v_stamp_num >= stamps_required THEN now() ELSE NULL END
  WHERE id = p_card_id;

  v_result := jsonb_build_object(
    'success',         true,
    'stamp_number',    v_stamp_num,
    'stamps_required', v_card.stamps_required,
    'is_complete',     (v_stamp_num >= v_card.stamps_required),
    'card_status',     CASE WHEN v_stamp_num >= v_card.stamps_required THEN 'completed' ELSE 'active' END
  );

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.add_stamp(uuid, uuid, uuid, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. Fix redeem_card RPC to use owner_id column on loyalty_cards
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.redeem_card(uuid, uuid);

CREATE OR REPLACE FUNCTION public.redeem_card(
  p_card_id     uuid,
  p_redeemed_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card      loyalty_cards%ROWTYPE;
  v_customer  customers%ROWTYPE;
  v_settings  business_settings%ROWTYPE;
  v_new_card_id uuid;
BEGIN
  SELECT * INTO v_card FROM loyalty_cards
  WHERE id = p_card_id AND owner_id = p_redeemed_by
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tarjeta no encontrada');
  END IF;

  IF NOT v_card.is_complete THEN
    RETURN jsonb_build_object('success', false, 'error', 'La tarjeta aun no esta completa');
  END IF;

  IF v_card.is_redeemed THEN
    RETURN jsonb_build_object('success', false, 'error', 'La tarjeta ya fue redimida');
  END IF;

  SELECT * INTO v_customer FROM customers WHERE id = v_card.customer_id;
  SELECT * INTO v_settings FROM business_settings WHERE owner_id = v_customer.owner_id LIMIT 1;

  -- Mark as redeemed
  UPDATE loyalty_cards
  SET is_redeemed = true, redeemed_at = now()
  WHERE id = p_card_id;

  -- Record the free wash visit
  INSERT INTO visits (
    customer_id, loyalty_card_id, owner_id, price, final_price,
    amount, payment_method, payment_status, is_free_wash, served_by, notes
  )
  VALUES (
    v_card.customer_id, p_card_id, p_redeemed_by, 0, 0,
    0, 'free_wash', 'free', true, p_redeemed_by, 'Lavado gratis por tarjeta de lealtad completada'
  );

  -- Create new loyalty card
  INSERT INTO loyalty_cards (customer_id, stamps_required, owner_id)
  VALUES (v_card.customer_id, COALESCE(v_settings.stamps_required, 5), p_redeemed_by)
  RETURNING id INTO v_new_card_id;

  RETURN jsonb_build_object(
    'success',          true,
    'redeemed_card_id', p_card_id,
    'new_card_id',      v_new_card_id,
    'customer_name',    v_customer.full_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_card(uuid, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. Update handle_new_user trigger to seed default services per owner
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create business settings
  INSERT INTO public.business_settings (owner_id, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'AutoLimpio')
  )
  ON CONFLICT DO NOTHING;

  -- Seed default services for this owner
  INSERT INTO public.services (owner_id, name, description, base_price, sort_order, earns_stamp, category, duration_minutes)
  VALUES
    (NEW.id, 'Lavado Básico',     'Lavado exterior con agua y jabón, secado manual',                    5.00,  1, true, 'wash',    20),
    (NEW.id, 'Lavado Premium',    'Lavado exterior e interior, aspirado, limpieza de tablero',           10.00, 2, true, 'wash',    40),
    (NEW.id, 'Lavado VIP',        'Lavado completo, encerado, limpieza de motor, aromatizante',          18.00, 3, true, 'premium', 60),
    (NEW.id, 'Detailing Completo','Servicio completo de detailing interior y exterior',                  30.00, 4, true, 'detail',  120),
    (NEW.id, 'Cambio de Aceite',  'Cambio de aceite y filtro (lleva tu propio aceite si prefieres)',     8.00,  5, false,'addon',   30);

  RETURN NEW;
END;
$$;
