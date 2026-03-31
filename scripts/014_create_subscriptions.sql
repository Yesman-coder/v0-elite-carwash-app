-- =============================================================================
-- 014: Subscription plans and customer subscriptions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Subscription Plans (defined by each owner)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),  -- price in Bs. cents
  wash_limit  integer,                                     -- NULL = unlimited
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_owner ON public.subscription_plans(owner_id);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_plans_select_own" ON public.subscription_plans
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "sub_plans_insert_own" ON public.subscription_plans
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "sub_plans_update_own" ON public.subscription_plans
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "sub_plans_delete_own" ON public.subscription_plans
  FOR DELETE USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS set_updated_at_subscription_plans ON public.subscription_plans;
CREATE TRIGGER set_updated_at_subscription_plans
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Subscriptions (customer enrolled in a plan)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  plan_id               uuid REFERENCES public.subscription_plans(id) NOT NULL,
  owner_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date            date NOT NULL DEFAULT CURRENT_DATE,
  next_billing_date     date NOT NULL,
  washes_used_this_period integer NOT NULL DEFAULT 0,
  is_active             boolean DEFAULT true,
  -- Pago Móvil payment details (recorded manually)
  pago_movil_phone      text,
  pago_movil_bank       text,
  pago_movil_reference  text,
  cancelled_at          timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_owner    ON public.subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active   ON public.subscriptions(owner_id) WHERE is_active = true;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "subscriptions_delete_own" ON public.subscriptions
  FOR DELETE USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Portal RPC: get subscription info by customer access_token
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_subscription_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_sub         jsonb;
BEGIN
  SELECT id INTO v_customer_id
  FROM customers
  WHERE access_token = p_token AND is_active = true;

  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cliente no encontrado');
  END IF;

  SELECT jsonb_build_object(
    'id',                     s.id,
    'plan_name',              sp.name,
    'price_cents',            sp.price_cents,
    'wash_limit',             sp.wash_limit,
    'washes_used',            s.washes_used_this_period,
    'next_billing_date',      s.next_billing_date,
    'start_date',             s.start_date,
    'is_active',              s.is_active
  ) INTO v_sub
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.customer_id = v_customer_id
    AND s.is_active = true
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_sub IS NULL THEN
    RETURN jsonb_build_object('success', true, 'subscription', null);
  END IF;

  RETURN jsonb_build_object('success', true, 'subscription', v_sub);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_subscription_by_token(text) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Seed a couple of default plans for existing owners (optional bootstrap)
-- This only runs if the owner has no plans yet.
-- Since there may be no owners yet, this is a safe no-op if the table is empty.
-- New owners get plans seeded via the UI.
-- -----------------------------------------------------------------------------
-- (no seed data needed here — owners create their own plans)
