-- ============ PRODUCTS: dual pricing ============
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_retail NUMERIC,
  ADD COLUMN IF NOT EXISTS price_wholesale NUMERIC;

UPDATE public.products
   SET price_wholesale = COALESCE(price_wholesale, price),
       price_retail    = COALESCE(price_retail, ROUND(price * 1.30, 2))
 WHERE price_wholesale IS NULL OR price_retail IS NULL;

-- ============ SCHOOLS ============
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT,
  address TEXT,
  category TEXT,
  description TEXT,
  cover_url TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schools TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_select_all" ON public.schools FOR SELECT USING (is_active = true OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "schools_insert_own" ON public.schools FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "schools_update_own" ON public.schools FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "schools_delete_own" ON public.schools FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COURSES ============
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 8,
  price NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  seats INTEGER NOT NULL DEFAULT 12,
  description TEXT,
  cover_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select_all" ON public.courses FOR SELECT USING (is_active = true OR EXISTS(SELECT 1 FROM public.schools s WHERE s.id=school_id AND s.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "courses_insert_own_school" ON public.courses FOR INSERT TO authenticated WITH CHECK (EXISTS(SELECT 1 FROM public.schools s WHERE s.id=school_id AND s.owner_id=auth.uid()));
CREATE POLICY "courses_update_own_school" ON public.courses FOR UPDATE TO authenticated USING (EXISTS(SELECT 1 FROM public.schools s WHERE s.id=school_id AND s.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin')) WITH CHECK (EXISTS(SELECT 1 FROM public.schools s WHERE s.id=school_id AND s.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "courses_delete_own_school" ON public.courses FOR DELETE TO authenticated USING (EXISTS(SELECT 1 FROM public.schools s WHERE s.id=school_id AND s.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_courses_school ON public.courses(school_id);
CREATE INDEX IF NOT EXISTS idx_courses_starts_at ON public.courses(starts_at);

-- ============ COURSE REGISTRATIONS ============
CREATE TABLE IF NOT EXISTS public.course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  seats INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  amount_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_registrations TO authenticated;
GRANT ALL ON public.course_registrations TO service_role;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cregs_select_own_or_school" ON public.course_registrations FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.courses c JOIN public.schools s ON s.id=c.school_id WHERE c.id=course_id AND s.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cregs_insert_self" ON public.course_registrations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "cregs_update_school" ON public.course_registrations FOR UPDATE TO authenticated USING (EXISTS(SELECT 1 FROM public.courses c JOIN public.schools s ON s.id=c.school_id WHERE c.id=course_id AND s.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_cregs_updated BEFORE UPDATE ON public.course_registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ JOB LISTINGS ============
CREATE TABLE IF NOT EXISTS public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  salary_from NUMERIC,
  salary_to NUMERIC,
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT NOT NULL,
  requirements TEXT,
  benefits TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  applications_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_listings TO authenticated;
GRANT ALL ON public.job_listings TO service_role;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_select_public" ON public.job_listings FOR SELECT USING (is_active = true OR employer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "jobs_insert_own" ON public.job_listings FOR INSERT TO authenticated WITH CHECK (employer_id = auth.uid());
CREATE POLICY "jobs_update_own" ON public.job_listings FOR UPDATE TO authenticated USING (employer_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (employer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "jobs_delete_own" ON public.job_listings FOR DELETE TO authenticated USING (employer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.job_listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_jobs_city ON public.job_listings(city);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.job_listings(is_active, created_at DESC);

-- ============ JOB APPLICATIONS ============
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "japps_select_applicant_or_employer" ON public.job_applications FOR SELECT TO authenticated USING (applicant_id = auth.uid() OR EXISTS(SELECT 1 FROM public.job_listings j WHERE j.id=job_id AND j.employer_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "japps_insert_self" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "japps_update_employer" ON public.job_applications FOR UPDATE TO authenticated USING (EXISTS(SELECT 1 FROM public.job_listings j WHERE j.id=job_id AND j.employer_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_japps_updated BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FORUM ============
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_categories TO authenticated;
GRANT ALL ON public.forum_categories TO service_role;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fcats_select_all" ON public.forum_categories FOR SELECT USING (true);
CREATE POLICY "fcats_admin_write" ON public.forum_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_threads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_threads TO authenticated;
GRANT ALL ON public.forum_threads TO service_role;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fthreads_select_all" ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "fthreads_insert_self" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "fthreads_update_own_or_admin" ON public.forum_threads FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "fthreads_delete_own_or_admin" ON public.forum_threads FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_fthreads_updated BEFORE UPDATE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_fthreads_cat ON public.forum_threads(category_id, last_reply_at DESC);

CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_replies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_replies TO authenticated;
GRANT ALL ON public.forum_replies TO service_role;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "freplies_select_all" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "freplies_insert_self" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "freplies_update_own_or_admin" ON public.forum_replies FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "freplies_delete_own_or_admin" ON public.forum_replies FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_freplies_updated BEFORE UPDATE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_freplies_thread ON public.forum_replies(thread_id, created_at);

-- Reply counter trigger
CREATE OR REPLACE FUNCTION public.on_forum_reply_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_threads SET reply_count = reply_count + 1, last_reply_at = now() WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_freplies_count AFTER INSERT OR DELETE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.on_forum_reply_change();

-- Seed forum categories
INSERT INTO public.forum_categories (slug, label, description, sort_order) VALUES
  ('naujienos', 'Naujienos ir aktualijos', 'Bendros diskusijos apie grožio industriją', 1),
  ('meistres-klausia', 'Meistrės klausia', 'Meistrių patarimai, technikos, produktai', 2),
  ('salonu-valdymas', 'Salonų valdymas', 'Verslo klausimai: klientai, kainodara, meistrai', 3),
  ('tiekejai', 'Tiekėjai ir produktai', 'Rekomendacijos, atsiliepimai apie produktus', 4),
  ('renginiai', 'Renginiai ir mokymai', 'Būsimi renginiai, kursai, seminarai', 5)
ON CONFLICT (slug) DO NOTHING;

-- Role toggle helper: super_admin_set_role already exists; add admin-callable one that cannot grant super_admin/admin (only super_admin can escalate)
CREATE OR REPLACE FUNCTION public.admin_set_role(_target uuid, _role app_role, _grant boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Reikia administratoriaus teisių';
  END IF;
  IF _role IN ('admin','super_admin') AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Tik super administratorius gali keisti admin roles';
  END IF;
  IF _grant THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_target, _role) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
  END IF;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, meta)
    VALUES (auth.uid(), CASE WHEN _grant THEN 'role.grant' ELSE 'role.revoke' END,
            'user_role', _target::text, jsonb_build_object('role', _role::text));
END $$;