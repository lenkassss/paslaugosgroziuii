-- 1. Business-role helper
CREATE OR REPLACE FUNCTION public.is_business_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('salon','staff','supplier','school','employer','admin','super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_provider_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('salon','staff','admin','super_admin')
  )
$$;

-- 2. Notification types for admin alerts
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'admin_classified_pending';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'admin_supplier_pending';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'admin_course_pending';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'listing_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'listing_rejected';

-- 3. Classifieds: application + approval + payment fields
ALTER TABLE public.classified_listings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_approval',
  ADD COLUMN IF NOT EXISTS applicant_name text,
  ADD COLUMN IF NOT EXISTS person_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS social_links text,
  ADD COLUMN IF NOT EXISTS rejection_note text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS amount_cents integer NOT NULL DEFAULT 499;

-- existing rows stay live
UPDATE public.classified_listings SET status = 'approved', payment_status = 'paid'
 WHERE status = 'pending_approval' AND is_active = true;

CREATE INDEX IF NOT EXISTS classified_listings_status_idx ON public.classified_listings(status, is_active);

REVOKE SELECT ON public.classified_listings FROM anon;
DROP POLICY IF EXISTS "classifieds public read active" ON public.classified_listings;
DROP POLICY IF EXISTS "classifieds owner read own" ON public.classified_listings;
CREATE POLICY "classifieds business read approved" ON public.classified_listings
  FOR SELECT TO authenticated
  USING (is_active = true AND status = 'approved' AND public.is_business_user(auth.uid()));
CREATE POLICY "classifieds owner or admin read" ON public.classified_listings
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- owners must not self-approve
CREATE OR REPLACE FUNCTION public.guard_classified_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.status := OLD.status;
      NEW.payment_status := OLD.payment_status;
      NEW.approved_at := OLD.approved_at;
      NEW.approved_by := OLD.approved_by;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_classified_status ON public.classified_listings;
CREATE TRIGGER trg_guard_classified_status BEFORE UPDATE ON public.classified_listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_classified_status();

-- 4. Forum: providers only
REVOKE SELECT ON public.forum_threads FROM anon;
REVOKE SELECT ON public.forum_replies FROM anon;
REVOKE SELECT ON public.forum_categories FROM anon;
DROP POLICY IF EXISTS "forum_threads_select_all" ON public.forum_threads;
DROP POLICY IF EXISTS "fthreads_select_all" ON public.forum_threads;
DROP POLICY IF EXISTS "forum_replies_select_all" ON public.forum_replies;
DROP POLICY IF EXISTS "freplies_select_all" ON public.forum_replies;
CREATE POLICY "forum_threads_providers_read" ON public.forum_threads
  FOR SELECT TO authenticated USING (public.is_provider_user(auth.uid()));
CREATE POLICY "forum_replies_providers_read" ON public.forum_replies
  FOR SELECT TO authenticated USING (public.is_provider_user(auth.uid()));

-- 5. Supplier catalog: business users only
REVOKE SELECT ON public.products FROM anon;
DROP POLICY IF EXISTS "products public read" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "products read active" ON public.products;
CREATE POLICY "products business read" ON public.products
  FOR SELECT TO authenticated
  USING ((is_active = true AND public.is_business_user(auth.uid())) OR auth.uid() = supplier_id OR public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.supplier_requests ADD COLUMN IF NOT EXISTS company_code text;

-- 6. Courses: approval workflow, business-only visibility
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_approval',
  ADD COLUMN IF NOT EXISTS rejection_note text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS amount_cents integer NOT NULL DEFAULT 500;
UPDATE public.courses SET status = 'approved', payment_status = 'paid' WHERE is_active = true AND status = 'pending_approval';

REVOKE SELECT ON public.courses FROM anon;
DROP POLICY IF EXISTS "courses_select_all" ON public.courses;
CREATE POLICY "courses_business_read" ON public.courses
  FOR SELECT TO authenticated
  USING (
    (is_active = true AND status = 'approved' AND public.is_business_user(auth.uid()))
    OR EXISTS (SELECT 1 FROM public.schools s WHERE s.id = courses.school_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 7. Admin notification triggers
CREATE OR REPLACE FUNCTION public.notify_admins(_type public.notification_type, _payload jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications(user_id, type, payload)
  SELECT ur.user_id, _type, _payload
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_admin')
  GROUP BY ur.user_id;
$$;

CREATE OR REPLACE FUNCTION public.on_classified_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending_approval' THEN
    PERFORM public.notify_admins('admin_classified_pending', jsonb_build_object(
      'listing_id', NEW.id, 'title', NEW.title, 'category', NEW.category, 'owner_id', NEW.owner_id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_classified_submitted ON public.classified_listings;
CREATE TRIGGER trg_classified_submitted AFTER INSERT ON public.classified_listings
  FOR EACH ROW EXECUTE FUNCTION public.on_classified_submitted();

CREATE OR REPLACE FUNCTION public.on_supplier_request_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('admin_supplier_pending', jsonb_build_object(
    'request_id', NEW.id, 'company_name', NEW.company_name, 'email', NEW.email));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_supplier_request_submitted ON public.supplier_requests;
CREATE TRIGGER trg_supplier_request_submitted AFTER INSERT ON public.supplier_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_supplier_request_submitted();

CREATE OR REPLACE FUNCTION public.on_course_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending_approval' THEN
    PERFORM public.notify_admins('admin_course_pending', jsonb_build_object(
      'course_id', NEW.id, 'title', NEW.title, 'school_id', NEW.school_id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_course_submitted ON public.courses;
CREATE TRIGGER trg_course_submitted AFTER INSERT ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.on_course_submitted();
