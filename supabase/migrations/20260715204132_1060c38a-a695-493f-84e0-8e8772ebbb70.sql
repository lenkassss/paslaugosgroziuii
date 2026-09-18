
-- Plan type/tier columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS plan_tier text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.demo_payments
  ADD COLUMN IF NOT EXISTS plan_type text,
  ADD COLUMN IF NOT EXISTS plan_tier text,
  ADD COLUMN IF NOT EXISTS credit_applied_eur numeric NOT NULL DEFAULT 0;

-- Catalog nodes hierarchy
CREATE TABLE IF NOT EXISTS public.catalog_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.catalog_nodes(id) ON DELETE CASCADE,
  slug text NOT NULL,
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'category',
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, slug)
);

GRANT SELECT ON public.catalog_nodes TO anon, authenticated;
GRANT ALL ON public.catalog_nodes TO service_role;
ALTER TABLE public.catalog_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog readable by all"
  ON public.catalog_nodes FOR SELECT
  USING (is_active = true);

CREATE POLICY "admin manage catalog"
  ON public.catalog_nodes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_catalog_nodes_updated
  BEFORE UPDATE ON public.catalog_nodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed catalog tree
DO $$
DECLARE
  r_client uuid; r_cat uuid; r_salon uuid; r_master uuid; r_brand uuid;
  n uuid; m uuid;
BEGIN
  INSERT INTO public.catalog_nodes (slug, label, kind, sort_order, icon)
  VALUES ('klientas','Klientas','audience',1,'user') RETURNING id INTO r_client;
  INSERT INTO public.catalog_nodes (slug, label, kind, sort_order, icon)
  VALUES ('kategorijos','Meistrams / Salonams / Tiekėjams','audience',2,'briefcase') RETURNING id INTO r_cat;
  INSERT INTO public.catalog_nodes (slug, label, kind, sort_order, icon)
  VALUES ('salonai','Salonai','audience',3,'store') RETURNING id INTO r_salon;
  INSERT INTO public.catalog_nodes (slug, label, kind, sort_order, icon)
  VALUES ('meistrai','Meistrai','audience',4,'scissors') RETURNING id INTO r_master;
  INSERT INTO public.catalog_nodes (slug, label, kind, sort_order, icon)
  VALUES ('prekiniai-zenklai','Prekiniai ženklai','audience',5,'tag') RETURNING id INTO r_brand;

  -- KLIENTAS: Plaukai
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'plaukai','Plaukai','category',1,'scissors') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'kirpimas','Kirpimas','subcategory',1),
    (n,'dazymas','Dažymas','subcategory',2),
    (n,'prauginimas','Prauginimas','subcategory',4),
    (n,'vaiku-kirpimas','Vaikų kirpimas','subcategory',6),
    (n,'vyru-kirpimai','Vyrų kirpimai / barzda','subcategory',7);
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'proceduros','Procedūros','subcategory',3) RETURNING id INTO m;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (m,'atstatancios','Atstatančios','service',1),
    (m,'garbanoms','Garbanoms','service',2);
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'sukuosenos','Šukuosenos','subcategory',5) RETURNING id INTO m;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (m,'progines','Proginės','service',1),
    (m,'kasytes','Kasytės','service',2);

  -- Blakstienos
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'blakstienos-antakiai','Blakstienos, antakiai','category',2,'eye') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'dazymas','Dažymas','subcategory',1),
    (n,'laminavimas','Laminavimas','subcategory',2),
    (n,'priauginimas','Priauginimas','subcategory',3);

  -- Makiazas
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'makiazas','Makiažas','category',3,'brush') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'dieninis','Dieninis','subcategory',1),
    (n,'vakarinis','Vakarinis','subcategory',2),
    (n,'vestuvinis','Vestuvinis','subcategory',3),
    (n,'pmu','PMU','subcategory',4);

  -- Kosmetologija
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'kosmetologija','Kosmetologija','category',4,'sparkles') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'proceduros','Procedūros','subcategory',1),
    (n,'veido-valymas','Veido valymas','subcategory',2),
    (n,'injekcijos','Injekcijos','subcategory',3);

  -- Masazas
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'masazas','Masažas','category',5,'hand') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'aparatinis','Aparatinis','subcategory',1),
    (n,'atpalaiduojamasis','Atpalaiduojamasis','subcategory',2),
    (n,'sporto','Sporto','subcategory',3),
    (n,'kubido','Kūbido','subcategory',4),
    (n,'stangrinantis','Stangrinantis','subcategory',5),
    (n,'anticeliulitinis','Anticeliulitinis','subcategory',6);

  -- Nagai
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'nagai','Nagai','category',6,'gem') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'manikiuras','Manikiūras','subcategory',1) RETURNING id INTO m;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (m,'gelinis','Gelinis','service',1),
    (m,'higieninis','Higieninis','service',2),
    (m,'japoniskas','Japoniškas','service',3),
    (m,'extra','Extra','service',4),
    (m,'priauginimas','Priauginimas','service',5);
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'pedikiuras','Pedikiūras','subcategory',2) RETURNING id INTO m;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (m,'gelinis','Gelinis','service',1),
    (m,'higieninis','Higieninis','service',2),
    (m,'pedologija','Pėdologija','service',3),
    (m,'japoniskas','Japoniškas','service',4);

  -- Depiliacija
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'depiliacija','Depiliacija','category',7,'wand') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'vaskas','Vaškas','subcategory',1),
    (n,'cukrus','Cukrus','subcategory',2),
    (n,'aparatine','Aparatinė (lazeris, IPL)','subcategory',3),
    (n,'vyru','Vyrų','subcategory',4);

  -- Įdegis
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'idegis','Įdegis','category',8,'sun') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'soliariumai','Soliariumai','subcategory',1) RETURNING id INTO m;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (m,'lempu-tipai','Lempų tipai','service',1);
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'savaiminis','Savaiminis (purškiamas)','subcategory',2);

  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'auskaru-verimas','Auskarų vėrimas','category',9,'circle-dot');
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_client,'tatuiruotes','Tatuiruotės','category',10,'pen-tool');

  -- KATEGORIJOS B2B
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_cat,'patalpos-ieskau','Patalpų ieškau','category',1,'search') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'salonas-nuoma','Salonas — nuoma','subcategory',1),
    (n,'salonas-pardavimai','Salonas — pardavimai','subcategory',2),
    (n,'salonas-pirkimai','Salonas — pirkimai','subcategory',3),
    (n,'kede','Kėdė (individuali vieta)','subcategory',4),
    (n,'kabinetas','Kabinetas','subcategory',5);

  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_cat,'patalpos-siulau','Patalpas siūlau','category',2,'building') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'salonas-nuoma','Salonas — nuoma','subcategory',1),
    (n,'salonas-pardavimai','Salonas — pardavimai','subcategory',2),
    (n,'salonas-pirkimai','Salonas — pirkimai','subcategory',3),
    (n,'kede','Kėdė','subcategory',4),
    (n,'kabinetas','Kabinetas','subcategory',5);

  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_cat,'iranga','Įranga','category',3,'wrench') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'nuoma','Nuoma','subcategory',1),
    (n,'pardavimai','Pardavimai','subcategory',2);
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'mokymai','Mokymai','subcategory',3) RETURNING id INTO m;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (m,'pagal-miesta','Pagal miestą','service',1),
    (m,'online','Online','service',2);

  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_cat,'tiekejai','Tiekėjai / Produkcija','category',4,'package') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (n,'pagal-preki-zenkla','Pagal prekinį ženklą','subcategory',90),
    (n,'pagal-imone','Pagal įmonę','subcategory',91);

  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order, icon)
  VALUES (r_cat,'mokymai','Mokymai','category',5,'graduation-cap') RETURNING id INTO n;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'pagal-miesta','Pagal miestą','subcategory',1) RETURNING id INTO m;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (m,'grupiniai','Grupiniai','service',1),
    (m,'individualus','Individualūs','service',2);
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'online','Online','subcategory',2) RETURNING id INTO m;
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES
    (m,'grupiniai','Grupiniai','service',1),
    (m,'individualus','Individualūs','service',2);
  INSERT INTO public.catalog_nodes (parent_id, slug, label, kind, sort_order) VALUES (n,'pagal-brando','Pagal brando pavadinimą','subcategory',3);
END $$;

-- Storage RLS policies
CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "covers public read" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "gallery public read" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "user manage own avatars"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user manage own covers"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user manage own gallery"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
