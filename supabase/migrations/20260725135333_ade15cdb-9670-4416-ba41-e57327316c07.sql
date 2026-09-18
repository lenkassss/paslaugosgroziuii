
CREATE TABLE public.rental_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  address TEXT,
  price NUMERIC(10,2) NOT NULL,
  price_period TEXT NOT NULL DEFAULT 'month' CHECK (price_period IN ('hour','day','month')),
  area_sqm NUMERIC(10,2),
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rental_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_listings TO authenticated;
GRANT ALL ON public.rental_listings TO service_role;

ALTER TABLE public.rental_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active rentals"
  ON public.rental_listings FOR SELECT
  USING (is_active = true OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners create rentals"
  ON public.rental_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND (public.has_role(auth.uid(),'salon') OR public.has_role(auth.uid(),'supplier') OR public.has_role(auth.uid(),'admin'))
  );

CREATE POLICY "Owners update own rentals"
  ON public.rental_listings FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners delete own rentals"
  ON public.rental_listings FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_rental_listings_updated_at
  BEFORE UPDATE ON public.rental_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX rental_listings_active_idx ON public.rental_listings(is_active, created_at DESC);
CREATE INDEX rental_listings_owner_idx ON public.rental_listings(owner_id);
