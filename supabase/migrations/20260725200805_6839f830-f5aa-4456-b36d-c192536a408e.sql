
-- 1) profiles: primary owner + first membership marker
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_primary_owner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_membership_at timestamptz;

UPDATE public.profiles SET is_primary_owner = true
 WHERE lower(email) = 'antanasgrebliu@gmail.com';

CREATE OR REPLACE FUNCTION public.enforce_primary_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.is_primary_owner := (lower(NEW.email) = 'antanasgrebliu@gmail.com');
    RETURN NEW;
  END IF;
  IF lower(COALESCE(NEW.email, OLD.email)) = 'antanasgrebliu@gmail.com' THEN
    NEW.is_primary_owner := true;
  ELSE
    -- non-owner emails cannot become primary owner
    IF NEW.is_primary_owner IS DISTINCT FROM OLD.is_primary_owner AND NEW.is_primary_owner = true THEN
      NEW.is_primary_owner := OLD.is_primary_owner;
    END IF;
  END IF;
  -- Immutable once true (except for owner-email row which stays true)
  IF OLD.is_primary_owner = true AND NEW.is_primary_owner = false
     AND lower(COALESCE(NEW.email, OLD.email)) = 'antanasgrebliu@gmail.com' THEN
    NEW.is_primary_owner := true;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_primary_owner ON public.profiles;
CREATE TRIGGER trg_enforce_primary_owner
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_primary_owner();

-- 2) rental_listings: add day/month/utilities fields
ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS price_per_day numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_per_month numeric(10,2),
  ADD COLUMN IF NOT EXISTS utilities_included boolean NOT NULL DEFAULT false;

-- 3) highlight_purchases: plan_type
ALTER TABLE public.highlight_purchases
  ADD COLUMN IF NOT EXISTS plan_type text
    CHECK (plan_type IS NULL OR plan_type IN ('1_week','1_month','3_months','trial'));

-- 4) catalog_nodes: is_global + seed
ALTER TABLE public.catalog_nodes
  ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;

INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, is_global, is_active)
VALUES
  (NULL, 'plaukai', 'Plaukai', 'category', 10, true, true),
  (NULL, 'nagai', 'Nagai', 'category', 20, true, true),
  (NULL, 'grozis', 'Grožis', 'category', 30, true, true),
  (NULL, 'masazas', 'Masažas', 'category', 40, true, true),
  (NULL, 'antakiai-blakstienos', 'Antakiai / blakstienos', 'category', 50, true, true)
ON CONFLICT (parent_id, slug) DO UPDATE SET is_global = EXCLUDED.is_global, label = EXCLUDED.label;

-- 5) products: replace public read with B2B-only read
DROP POLICY IF EXISTS "products public read active" ON public.products;
CREATE POLICY "products b2b read active" ON public.products
FOR SELECT TO authenticated
USING (
  (is_active = true AND (
     public.has_role(auth.uid(), 'salon') OR
     public.has_role(auth.uid(), 'supplier') OR
     public.has_role(auth.uid(), 'admin')
  ))
  OR auth.uid() = supplier_id
);

-- 6) auto first-week featured on first membership activation
CREATE OR REPLACE FUNCTION public.auto_first_week_featured()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.subscription_active IS DISTINCT FROM OLD.subscription_active
     AND NEW.subscription_active = true
     AND OLD.first_membership_at IS NULL THEN
    NEW.first_membership_at := now();
    NEW.is_featured := true;
    NEW.featured_until := GREATEST(COALESCE(NEW.featured_until, now()), now()) + interval '7 days';
    INSERT INTO public.highlight_purchases(user_id, target_kind, target_id, weeks, amount_cents, payment_status, starts_at, ends_at, plan_type)
    VALUES (NEW.id, 'profile', NEW.id, 1, 0, 'paid', now(), now() + interval '7 days', 'trial');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_first_week_featured ON public.profiles;
CREATE TRIGGER trg_auto_first_week_featured
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_first_week_featured();

-- 7) helper: expiring featured cleanup (called by cron/manual)
CREATE OR REPLACE FUNCTION public.expire_featured()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles
     SET is_featured = false
   WHERE is_featured = true
     AND featured_until IS NOT NULL
     AND featured_until < now();
$$;
