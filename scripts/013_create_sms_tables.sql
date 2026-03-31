-- =============================================================================
-- 013: Create SMS campaign and notification log tables
-- These tables are referenced in the app code but were never created.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SMS Campaigns
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sms_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           text NOT NULL,
  message         text NOT NULL,
  audience        text NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'active_card', 'completed_card', 'no_visits_30d', 'custom')),
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count      integer NOT NULL DEFAULT 0,
  failed_count    integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_owner ON public.sms_campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON public.sms_campaigns(status);

ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_campaigns_select_own" ON public.sms_campaigns
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "sms_campaigns_insert_own" ON public.sms_campaigns
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "sms_campaigns_update_own" ON public.sms_campaigns
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "sms_campaigns_delete_own" ON public.sms_campaigns
  FOR DELETE USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS set_updated_at_sms_campaigns ON public.sms_campaigns;
CREATE TRIGGER set_updated_at_sms_campaigns
  BEFORE UPDATE ON public.sms_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 2. SMS Campaign Recipients (per-message delivery tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sms_campaign_recipients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid REFERENCES public.sms_campaigns(id) ON DELETE CASCADE NOT NULL,
  customer_id   uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  phone         text NOT NULL,
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'stubbed')),
  error_message text,
  sent_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_recipients_campaign ON public.sms_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_customer ON public.sms_campaign_recipients(customer_id);

ALTER TABLE public.sms_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Access via campaign owner
CREATE POLICY "sms_recipients_select_own" ON public.sms_campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sms_campaigns c
      WHERE c.id = sms_campaign_recipients.campaign_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "sms_recipients_insert_own" ON public.sms_campaign_recipients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sms_campaigns c
      WHERE c.id = sms_campaign_recipients.campaign_id
        AND c.owner_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 3. Notification Log (audit trail for all outbound notifications)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id   uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  type          text NOT NULL DEFAULT 'general'
    CHECK (type IN ('welcome', 'stamp', 'reward', 'reminder', 'promo', 'general')),
  channel       text NOT NULL DEFAULT 'sms'
    CHECK (channel IN ('sms', 'email', 'push')),
  recipient     text NOT NULL,
  message       text NOT NULL,
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'stubbed')),
  error_message text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_owner    ON public.notification_log(owner_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_customer ON public.notification_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type     ON public.notification_log(type);
CREATE INDEX IF NOT EXISTS idx_notification_log_created  ON public.notification_log(created_at DESC);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_log_select_own" ON public.notification_log
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "notification_log_insert_own" ON public.notification_log
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Note: notification_log is append-only; no update/delete policies needed.
