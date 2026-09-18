
-- 1. ad_slots extensions
ALTER TABLE public.ad_slots
  ADD COLUMN IF NOT EXISTS placements text[] NOT NULL DEFAULT ARRAY['home_feed'],
  ADD COLUMN IF NOT EXISTS priority int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency int NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS target_category text,
  ADD COLUMN IF NOT EXISTS target_city text;

-- Migrate legacy `placement` column into `placements[]`
UPDATE public.ad_slots
SET placements = ARRAY[CASE placement
  WHEN 'feed' THEN 'home_feed'
  WHEN 'sidebar' THEN 'home_sidebar'
  ELSE placement
END]
WHERE placements = ARRAY['home_feed'] AND placement IS NOT NULL;

CREATE INDEX IF NOT EXISTS ad_slots_active_priority_idx
  ON public.ad_slots (is_active, priority DESC)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS ad_slots_placements_gin
  ON public.ad_slots USING GIN (placements);

-- 2. profiles featured columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz,
  ADD COLUMN IF NOT EXISTS featured_priority int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_featured_idx
  ON public.profiles (is_featured, featured_priority DESC)
  WHERE is_featured;

-- Enforce: only admins can bump featured_priority; owners can only toggle
-- is_featured when subscription_active is true. Handled at trigger level to
-- avoid rewriting all existing profile UPDATE policies.
CREATE OR REPLACE FUNCTION public.enforce_profile_featured()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_featured IS DISTINCT FROM OLD.is_featured
     OR NEW.featured_until IS DISTINCT FROM OLD.featured_until
     OR NEW.featured_priority IS DISTINCT FROM OLD.featured_priority
  THEN
    -- Admins may change anything
    IF public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    -- Owner path: must be own row + subscription_active
    IF auth.uid() = NEW.id AND COALESCE(NEW.subscription_active, false) THEN
      -- Owners cannot set priority
      NEW.featured_priority := OLD.featured_priority;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Reklamavimą gali įjungti tik admin arba savininkas su aktyvia prenumerata';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_featured_trg ON public.profiles;
CREATE TRIGGER enforce_profile_featured_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_featured();

-- 3. articles promoted columns
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promoted_until timestamptz;

CREATE INDEX IF NOT EXISTS articles_promoted_idx
  ON public.articles (is_promoted, published_at DESC)
  WHERE is_promoted;

CREATE OR REPLACE FUNCTION public.enforce_article_promoted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.is_promoted IS DISTINCT FROM OLD.is_promoted
      OR NEW.promoted_until IS DISTINCT FROM OLD.promoted_until)
     AND NOT public.has_role(auth.uid(), 'admin')
  THEN
    RAISE EXCEPTION 'Straipsnio reklamavimą gali keisti tik admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_article_promoted_trg ON public.articles;
CREATE TRIGGER enforce_article_promoted_trg
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.enforce_article_promoted();

-- 4. Atomic counters
CREATE OR REPLACE FUNCTION public.bump_ad_impression(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ad_slots SET impressions = impressions + 1 WHERE id = _id;
$$;

CREATE OR REPLACE FUNCTION public.bump_ad_click(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ad_slots SET clicks = clicks + 1 WHERE id = _id;
$$;

GRANT EXECUTE ON FUNCTION public.bump_ad_impression(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_ad_click(uuid) TO anon, authenticated;
