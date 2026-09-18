
-- has_role: super_admin implies admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (_role = 'admin' AND role = 'super_admin'))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

-- Profile blocking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS blocked_by uuid;

-- Service discounts
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS discount_percent int CHECK (discount_percent IS NULL OR (discount_percent BETWEEN 1 AND 90)),
  ADD COLUMN IF NOT EXISTS discount_price numeric,
  ADD COLUMN IF NOT EXISTS discount_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS discount_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS discount_label text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS services_active_discount_idx
  ON public.services (salon_id)
  WHERE discount_percent IS NOT NULL OR discount_price IS NOT NULL;

-- Article event pricing
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS event_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_currency text DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS event_paid_required boolean DEFAULT false;

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS amount_cents int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending','paid','refunded','failed')),
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_ref text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Highlight purchases (universal boost for €4.99/week)
CREATE TABLE IF NOT EXISTS public.highlight_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_kind text NOT NULL CHECK (target_kind IN ('article','service','profile')),
  target_id uuid NOT NULL,
  weeks int NOT NULL DEFAULT 1 CHECK (weeks BETWEEN 1 AND 52),
  amount_cents int NOT NULL DEFAULT 499,
  currency text NOT NULL DEFAULT 'EUR',
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_provider text,
  payment_ref text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.highlight_purchases TO authenticated;
GRANT ALL ON public.highlight_purchases TO service_role;
ALTER TABLE public.highlight_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hp select own or admin" ON public.highlight_purchases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "hp insert own" ON public.highlight_purchases
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND ends_at > starts_at);
CREATE POLICY "hp update admin" ON public.highlight_purchases
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.has_active_highlight(_kind text, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.highlight_purchases
    WHERE target_kind = _kind AND target_id = _target
      AND payment_status = 'paid' AND ends_at > now()
  )
$$;

-- SECURITY: appointments — restrict public PII exposure via safe view
DROP POLICY IF EXISTS "Public sees slot occupancy" ON public.appointments;

CREATE OR REPLACE VIEW public.public_appointment_slots
WITH (security_invoker = true) AS
SELECT id, salon_id, appointment_date, time_slot, duration_mins, status
FROM public.appointments
WHERE status IN ('confirmed','pending');
GRANT SELECT ON public.public_appointment_slots TO anon, authenticated;

-- keep a base policy so the view can read (security_invoker), but the view only projects safe columns
CREATE POLICY "Slot occupancy base access" ON public.appointments
  FOR SELECT TO anon, authenticated
  USING (status IN ('confirmed','pending'));

-- REVOKE PII columns from anon on base table (belt & suspenders)
REVOKE SELECT (client_name, client_phone, client_email, cancel_token) ON public.appointments FROM anon;
REVOKE SELECT (client_name, client_phone, client_email, cancel_token) ON public.appointments FROM authenticated;
-- authenticated owners get PII back through a fresh policy scoped to owner
GRANT SELECT (client_name, client_phone, client_email, cancel_token) ON public.appointments TO authenticated;

CREATE POLICY "Salon reads own appointment PII" ON public.appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = salon_id OR public.has_role(auth.uid(),'admin'));

-- SECURITY: profiles — public policy tightens, phone/email hidden from anon
DROP POLICY IF EXISTS "Public can view active salon/supplier profiles" ON public.profiles;
CREATE POLICY "Public view of active profiles" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (
    (COALESCE(suspended,false) = false AND blocked_at IS NULL AND subscription_active = true)
    OR auth.uid() = id
    OR public.has_role(auth.uid(),'admin')
  );
REVOKE SELECT (phone, email, owner_name) ON public.profiles FROM anon;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id, business_name, city, address, lat, lng, avatar_url, cover_url,
  bio, category, subscription_active, is_featured, featured_until,
  featured_priority, plan_type, plan_tier, gallery_urls, created_at
FROM public.profiles
WHERE COALESCE(suspended,false) = false
  AND blocked_at IS NULL;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Tighten "Anyone can book"
DROP POLICY IF EXISTS "Anyone can book" ON public.appointments;
CREATE POLICY "Anyone can book with valid target" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    salon_id IS NOT NULL
    AND appointment_date >= CURRENT_DATE
    AND status IN ('pending','confirmed')
  );

-- Lock down internal SECURITY DEFINER functions
ALTER FUNCTION public.set_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_comment_report() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_comment_delete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_comment_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_article_promoted() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_featured() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_comment_vote_counters() FROM anon, authenticated;

-- Admin helpers: block / unblock
CREATE OR REPLACE FUNCTION public.admin_block_user(_target uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Reikia administratoriaus teisių';
  END IF;
  UPDATE public.profiles
     SET blocked_at = now(), blocked_reason = COALESCE(_reason,'Pažeidė taisykles'), blocked_by = auth.uid()
   WHERE id = _target;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, meta)
    VALUES (auth.uid(),'user.block','profile',_target, jsonb_build_object('reason',_reason));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_block_user(uuid,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_block_user(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_unblock_user(_target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Reikia administratoriaus teisių';
  END IF;
  UPDATE public.profiles
     SET blocked_at = NULL, blocked_reason = NULL, blocked_by = NULL
   WHERE id = _target;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, meta)
    VALUES (auth.uid(),'user.unblock','profile',_target,'{}'::jsonb);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_unblock_user(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_unblock_user(uuid) TO authenticated;

-- Super admin: promote/demote roles
CREATE OR REPLACE FUNCTION public.super_admin_set_role(_target uuid, _role app_role, _grant boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Reikia super administratoriaus teisių';
  END IF;
  IF _grant THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_target, _role) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
  END IF;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, meta)
    VALUES (auth.uid(), CASE WHEN _grant THEN 'role.grant' ELSE 'role.revoke' END,
            'user_role', _target, jsonb_build_object('role',_role::text));
END $$;
REVOKE EXECUTE ON FUNCTION public.super_admin_set_role(uuid, app_role, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.super_admin_set_role(uuid, app_role, boolean) TO authenticated;
