
CREATE OR REPLACE FUNCTION public.list_salon_ids()
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles WHERE role = 'salon';
$$;
GRANT EXECUTE ON FUNCTION public.list_salon_ids() TO anon, authenticated;

-- Extend new-user handler: salons get 7 days featured trial on signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _role public.app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'client');

  INSERT INTO public.profiles (id, email, business_name, owner_name, phone, city, is_featured, featured_until, first_membership_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'owner_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    CASE WHEN _role = 'salon' THEN true ELSE false END,
    CASE WHEN _role = 'salon' THEN now() + interval '7 days' ELSE NULL END,
    CASE WHEN _role = 'salon' THEN now() ELSE NULL END
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;

  IF _role = 'salon' THEN
    INSERT INTO public.highlight_purchases(user_id, target_kind, target_id, weeks, amount_cents, payment_status, starts_at, ends_at, plan_type)
    VALUES (NEW.id, 'profile', NEW.id, 1, 0, 'paid', now(), now() + interval '7 days', 'trial')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
