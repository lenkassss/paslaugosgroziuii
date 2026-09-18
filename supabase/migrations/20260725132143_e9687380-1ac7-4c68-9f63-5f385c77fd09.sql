
-- 1. Extend app_role enum with 'staff'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

-- 2. Profiles: approval + stripe connect
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS payments_enabled boolean NOT NULL DEFAULT false;

-- Backfill: verified salons are already approved
UPDATE public.profiles SET is_approved = true WHERE verification_status = 'verified';

-- Trigger to keep is_approved synced when verification passes
CREATE OR REPLACE FUNCTION public.sync_profile_approval()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS DISTINCT FROM 'verified') THEN
    NEW.is_approved := true;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_sync_approval ON public.profiles;
CREATE TRIGGER profiles_sync_approval BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_approval();

-- 3. salon_staff
CREATE TABLE IF NOT EXISTS public.salon_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_name text NOT NULL,
  specialization text,
  avatar_url text,
  bio text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS salon_staff_salon_idx ON public.salon_staff(salon_id);
CREATE INDEX IF NOT EXISTS salon_staff_user_idx ON public.salon_staff(user_id);

GRANT SELECT ON public.salon_staff TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salon_staff TO authenticated;
GRANT ALL ON public.salon_staff TO service_role;

ALTER TABLE public.salon_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active staff" ON public.salon_staff
  FOR SELECT USING (is_active = true OR auth.uid() = salon_id OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Salon owner manages staff" ON public.salon_staff
  FOR ALL TO authenticated
  USING (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update own row" ON public.salon_staff
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER salon_staff_updated_at BEFORE UPDATE ON public.salon_staff
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. appointments: staff + stripe
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.salon_staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

CREATE INDEX IF NOT EXISTS appointments_staff_idx ON public.appointments(staff_id, appointment_date);

-- 5. working_hours & time_blocks: staff scope
ALTER TABLE public.working_hours
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.salon_staff(id) ON DELETE CASCADE;

ALTER TABLE public.time_blocks
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.salon_staff(id) ON DELETE CASCADE;

-- Drop existing unique on (salon_id, weekday) — replace with composite that includes staff
ALTER TABLE public.working_hours DROP CONSTRAINT IF EXISTS working_hours_salon_id_weekday_key;
CREATE UNIQUE INDEX IF NOT EXISTS working_hours_scope_uidx
  ON public.working_hours(salon_id, COALESCE(staff_id, '00000000-0000-0000-0000-000000000000'::uuid), weekday);

-- 6. Admin function to approve a salon
CREATE OR REPLACE FUNCTION public.admin_set_salon_approved(_salon uuid, _approved boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Reikia administratoriaus teisių';
  END IF;
  UPDATE public.profiles SET is_approved = _approved WHERE id = _salon;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, meta)
    VALUES (auth.uid(), CASE WHEN _approved THEN 'salon.approve' ELSE 'salon.unapprove' END,
            'profile', _salon, '{}'::jsonb);
END $$;
