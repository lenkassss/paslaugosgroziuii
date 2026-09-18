
-- 1) Staff invitations table
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  invited_name TEXT,
  specialization TEXT,
  accepted_user_id UUID,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_invitations_salon_idx ON public.staff_invitations(salon_id);
CREATE INDEX IF NOT EXISTS staff_invitations_email_idx ON public.staff_invitations(lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_invitations TO authenticated;
GRANT ALL ON public.staff_invitations TO service_role;

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon owner manages own invites" ON public.staff_invitations;
CREATE POLICY "salon owner manages own invites"
  ON public.staff_invitations FOR ALL
  TO authenticated
  USING (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "invitee reads own pending invite" ON public.staff_invitations;
CREATE POLICY "invitee reads own pending invite"
  ON public.staff_invitations FOR SELECT
  TO authenticated
  USING (
    status = 'pending'
    AND lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  );

DROP TRIGGER IF EXISTS trg_staff_invitations_updated_at ON public.staff_invitations;
CREATE TRIGGER trg_staff_invitations_updated_at
  BEFORE UPDATE ON public.staff_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Prevent duplicate products per supplier by (case-insensitive) title
CREATE UNIQUE INDEX IF NOT EXISTS products_supplier_title_unique
  ON public.products(supplier_id, lower(title));

-- 3) Server-side accept-invite RPC (finds the salon_staff record and links user)
CREATE OR REPLACE FUNCTION public.accept_staff_invite(_token UUID)
RETURNS TABLE(salon_id UUID, salon_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _email TEXT := lower(COALESCE((auth.jwt() ->> 'email'), ''));
  _inv RECORD;
  _staff_id UUID;
  _name TEXT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Reikia prisijungti';
  END IF;

  SELECT * INTO _inv FROM public.staff_invitations
    WHERE token = _token AND status = 'pending' AND expires_at > now();
  IF _inv IS NULL THEN
    RAISE EXCEPTION 'Kvietimas nerastas arba nebegalioja';
  END IF;

  IF lower(_inv.email) <> _email THEN
    RAISE EXCEPTION 'Šis kvietimas skirtas kitam el. paštui';
  END IF;

  -- Ensure staff role
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'staff')
    ON CONFLICT DO NOTHING;

  -- Create or link salon_staff row
  SELECT id INTO _staff_id FROM public.salon_staff
    WHERE salon_id = _inv.salon_id AND user_id = _uid LIMIT 1;

  IF _staff_id IS NULL THEN
    SELECT COALESCE(business_name, owner_name, _inv.email) INTO _name FROM public.profiles WHERE id = _uid;
    INSERT INTO public.salon_staff(salon_id, user_id, staff_name, specialization, is_active)
      VALUES (_inv.salon_id, _uid, COALESCE(_inv.invited_name, _name, 'Meistrė'), _inv.specialization, true)
      RETURNING id INTO _staff_id;
  ELSE
    UPDATE public.salon_staff SET is_active = true WHERE id = _staff_id;
  END IF;

  UPDATE public.staff_invitations
    SET status = 'accepted', accepted_user_id = _uid, accepted_at = now()
    WHERE id = _inv.id;

  SELECT p.id, p.business_name INTO salon_id, salon_name FROM public.profiles p WHERE p.id = _inv.salon_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_staff_invite(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_staff_invite(UUID) TO authenticated;

-- 4) Peek at an invite by token (public - only exposes salon name + expected email masked)
CREATE OR REPLACE FUNCTION public.peek_staff_invite(_token UUID)
RETURNS TABLE(salon_name TEXT, email TEXT, expires_at TIMESTAMPTZ, status TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.business_name, i.email, i.expires_at, i.status
  FROM public.staff_invitations i
  JOIN public.profiles p ON p.id = i.salon_id
  WHERE i.token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.peek_staff_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peek_staff_invite(UUID) TO anon, authenticated;
