ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_until timestamptz,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referral_bonus_granted boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;

UPDATE public.profiles
SET referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

UPDATE public.profiles
SET free_until = COALESCE(free_until, created_at + interval '2 months')
WHERE free_until IS NULL;

CREATE OR REPLACE FUNCTION public.set_profile_trial_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substr(replace(NEW.id::text, '-', ''), 1, 8));
  END IF;
  IF NEW.free_until IS NULL THEN
    NEW.free_until := now() + interval '2 months';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profile_trial_defaults ON public.profiles;
CREATE TRIGGER set_profile_trial_defaults
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_profile_trial_defaults();

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  invited_user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter sees own referrals"
ON public.referrals FOR SELECT TO authenticated
USING (inviter_id = auth.uid() OR invited_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.register_referral(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inviter uuid;
  _count integer;
BEGIN
  IF auth.uid() IS NULL OR _code IS NULL OR length(trim(_code)) = 0 THEN
    RETURN false;
  END IF;

  SELECT id INTO _inviter FROM public.profiles WHERE referral_code = upper(trim(_code)) LIMIT 1;
  IF _inviter IS NULL OR _inviter = auth.uid() THEN
    RETURN false;
  END IF;

  INSERT INTO public.referrals (inviter_id, invited_user_id)
  VALUES (_inviter, auth.uid())
  ON CONFLICT (invited_user_id) DO NOTHING;

  SELECT count(*) INTO _count FROM public.referrals WHERE inviter_id = _inviter;

  IF _count >= 10 THEN
    UPDATE public.profiles
    SET free_until = GREATEST(COALESCE(free_until, now()), now()) + interval '1 month',
        referral_bonus_granted = true
    WHERE id = _inviter AND referral_bonus_granted = false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_referral(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_referral_status()
RETURNS TABLE(referral_code text, invited_count integer, free_until timestamptz, bonus_granted boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.referral_code,
         (SELECT count(*)::integer FROM public.referrals r WHERE r.inviter_id = p.id),
         p.free_until,
         p.referral_bonus_granted
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_referral_status() TO authenticated;