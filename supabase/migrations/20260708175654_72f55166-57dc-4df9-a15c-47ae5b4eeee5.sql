
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('client','salon','supplier','admin');
CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','cancelled','completed');

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'salon' THEN 2 WHEN 'supplier' THEN 3 ELSE 4 END LIMIT 1 $$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  owner_name TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  category TEXT,
  subscription_active BOOLEAN NOT NULL DEFAULT false,
  subscription_expires_at TIMESTAMPTZ,
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active salon/supplier profiles" ON public.profiles FOR SELECT TO anon, authenticated
USING (
  NOT suspended AND (
    subscription_active = true
    OR auth.uid() = id
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ SERVICES ============
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_mins INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view services" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Salon manages services" ON public.services FOR ALL TO authenticated
USING (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'));

-- ============ WORKING HOURS ============
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_closed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(salon_id, weekday)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.working_hours TO authenticated;
GRANT SELECT ON public.working_hours TO anon;
GRANT ALL ON public.working_hours TO service_role;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view working hours" ON public.working_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Salon manages hours" ON public.working_hours FOR ALL TO authenticated
USING (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'));

-- ============ TIME BLOCKS ============
CREATE TABLE public.time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_blocks TO authenticated;
GRANT SELECT ON public.time_blocks TO anon;
GRANT ALL ON public.time_blocks TO service_role;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view time blocks" ON public.time_blocks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Salon manages blocks" ON public.time_blocks FOR ALL TO authenticated
USING (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'));

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  appointment_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  duration_mins INT NOT NULL DEFAULT 60,
  status public.appointment_status NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.appointments(salon_id, appointment_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT ON public.appointments TO anon;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can book" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public sees slot occupancy" ON public.appointments FOR SELECT TO anon, authenticated
USING (
  status IN ('confirmed','pending')
);
CREATE POLICY "Salon manages own appts" ON public.appointments FOR UPDATE TO authenticated
USING (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Salon deletes own appts" ON public.appointments FOR DELETE TO authenticated
USING (auth.uid() = salon_id OR public.has_role(auth.uid(), 'admin'));

-- ============ B2B FEED ============
CREATE TABLE public.b2b_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  image_url TEXT,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.b2b_feed TO authenticated;
GRANT ALL ON public.b2b_feed TO service_role;
ALTER TABLE public.b2b_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "B2B members view feed" ON public.b2b_feed FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    (public.has_role(auth.uid(), 'salon') OR public.has_role(auth.uid(), 'supplier'))
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_active = true AND NOT p.suspended)
  )
);
CREATE POLICY "B2B members post" ON public.b2b_feed FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id AND
  (public.has_role(auth.uid(), 'salon') OR public.has_role(auth.uid(), 'supplier'))
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_active = true AND NOT p.suspended)
);
CREATE POLICY "Author or admin edits post" ON public.b2b_feed FOR UPDATE TO authenticated
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Author or admin deletes post" ON public.b2b_feed FOR DELETE TO authenticated
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- ============ B2B REPLIES ============
CREATE TABLE public.b2b_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.b2b_feed(id) ON DELETE CASCADE,
  replier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.b2b_replies TO authenticated;
GRANT ALL ON public.b2b_replies TO service_role;
ALTER TABLE public.b2b_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "B2B members view replies" ON public.b2b_replies FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    (public.has_role(auth.uid(), 'salon') OR public.has_role(auth.uid(), 'supplier'))
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_active = true AND NOT p.suspended)
  )
);
CREATE POLICY "B2B members reply" ON public.b2b_replies FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = replier_id AND
  (public.has_role(auth.uid(), 'salon') OR public.has_role(auth.uid(), 'supplier'))
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_active = true AND NOT p.suspended)
);
CREATE POLICY "Author or admin deletes reply" ON public.b2b_replies FOR DELETE TO authenticated
USING (auth.uid() = replier_id OR public.has_role(auth.uid(), 'admin'));

-- ============ SALON REVIEWS ============
CREATE TABLE public.salon_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating_stars INT NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
  text_comment TEXT,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.salon_reviews(salon_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salon_reviews TO authenticated;
GRANT SELECT, INSERT ON public.salon_reviews TO anon;
GRANT ALL ON public.salon_reviews TO service_role;
ALTER TABLE public.salon_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view approved reviews" ON public.salon_reviews FOR SELECT TO anon, authenticated USING (approved = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can write review" ON public.salon_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin manages reviews" ON public.salon_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes reviews" ON public.salon_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ DEMO PAYMENTS ============
CREATE TABLE public.demo_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  card_last4 TEXT,
  status TEXT NOT NULL DEFAULT 'succeeded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.demo_payments TO authenticated;
GRANT ALL ON public.demo_payments TO service_role;
ALTER TABLE public.demo_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.demo_payments FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own payments" ON public.demo_payments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'client');

  INSERT INTO public.profiles (id, email, business_name, owner_name, phone, city)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'owner_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_replies;
