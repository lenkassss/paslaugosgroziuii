-- 1. Public provider role lookup (salon / staff) without exposing user_roles
CREATE OR REPLACE FUNCTION public.list_provider_roles()
RETURNS TABLE(user_id uuid, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ur.user_id, ur.role::text
  FROM public.user_roles ur
  WHERE ur.role IN ('salon','staff');
$$;
GRANT EXECUTE ON FUNCTION public.list_provider_roles() TO anon, authenticated, service_role;

-- 2. Rich product detail fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS inci text,
  ADD COLUMN IF NOT EXISTS volume text,
  ADD COLUMN IF NOT EXISTS usage_instructions text,
  ADD COLUMN IF NOT EXISTS country_of_origin text;

-- 3. School / employer accreditation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS license_no text,
  ADD COLUMN IF NOT EXISTS business_description text;

-- 4. Full Lithuanian beauty services taxonomy
INSERT INTO public.standard_services (name, slug, category, sort_order, is_active)
SELECT v.name, v.slug, v.category, v.sort_order, true
FROM (VALUES
  ('Moterų kirpimas','moteru-kirpimas','Plaukai',10,true),
  ('Moterų dažymas','moteru-dazymas','Plaukai',11,true),
  ('Proginės šukuosenos','progines-sukuosenos','Plaukai',12,true),
  ('Plaukus atstatančios procedūros','plauku-atstatymas','Plaukai',13,true),
  ('Galvos SPA','galvos-spa','Plaukai',14,true),
  ('Garbanų procedūra','garbanu-procedura','Plaukai',15,true),
  ('Cheminis garbanojimas','cheminis-garbanojimas','Plaukai',16,true),
  ('Keratininis tiesinimas','keratininis-tiesinimas','Plaukai',17,true),
  ('Plaukų priauginimas kapsulėmis','priauginimas-kapsulemis','Plaukai',18,true),
  ('Plaukų priauginimas lipdukais','priauginimas-lipdukais','Plaukai',19,true),
  ('Kasyčių pinimas','kasyciu-pinimas','Plaukai',20,true),
  ('Vyrų kirpimas','vyru-kirpimas','Plaukai',21,true),
  ('Vyrų dažymas','vyru-dazymas','Plaukai',22,true),
  ('Barzdos kirpimas / tvarkymas','barzdos-kirpimas','Plaukai',23,true),
  ('Antakių dažymas','antakiu-dazymas','Antakiai / Blakstienos',30,true),
  ('Antakių laminavimas','antakiu-laminavimas','Antakiai / Blakstienos',31,true),
  ('Blakstienų dažymas','blakstienu-dazymas','Antakiai / Blakstienos',32,true),
  ('Blakstienų laminavimas','blakstienu-laminavimas','Antakiai / Blakstienos',33,true),
  ('Blakstienų priauginimas','blakstienu-priauginimas','Antakiai / Blakstienos',34,true),
  ('Lūpų permanentas','lupu-permanentas','Permanentinis makiažas',40,true),
  ('Antakių permanentas','antakiu-permanentas','Permanentinis makiažas',41,true),
  ('Akių apvadų permanentas','akiu-apvadu-permanentas','Permanentinis makiažas',42,true),
  ('Spenelių ryškinimas','speneliu-ryskinimas','Permanentinis makiažas',43,true),
  ('Lazerinis permanentinio makiažo šalinimas','permanento-salinimas','Permanentinis makiažas',44,true),
  ('Dieninis makiažas','dieninis-makiazas','Makiažas',50,true),
  ('Vakarinis makiažas','vakarinis-makiazas','Makiažas',51,true),
  ('Vestuvinis makiažas','vestuvinis-makiazas','Makiažas',52,true),
  ('Teminis makiažas','teminis-makiazas','Makiažas',53,true),
  ('Auskarų vėrimas į ausis','auskarai-ausys','Auskarų vėrimas',60,true),
  ('Auskarų vėrimas į nosį','auskarai-nosis','Auskarų vėrimas',61,true),
  ('Auskarų vėrimas į bambą','auskarai-bamba','Auskarų vėrimas',62,true),
  ('Auskarų vėrimas į lūpas','auskarai-lupos','Auskarų vėrimas',63,true),
  ('Higieninis manikiūras','higieninis-manikiuras','Nagai',70,true),
  ('Japoniškas manikiūras','japoniskas-manikiuras','Nagai',71,true),
  ('Gelinis lakavimas (rankų)','gelinis-lakavimas-ranku','Nagai',72,true),
  ('Manikiūras + gelinis lakavimas','manikiuras-gelinis','Nagai',73,true),
  ('Nagų priauginimas geliu','nagu-priauginimas-geliu','Nagai',74,true),
  ('Nagų priauginimas akrilu','nagu-priauginimas-akrilu','Nagai',75,true),
  ('Extra pedikiūras','extra-pedikiuras','Nagai',76,true),
  ('Pilnas pedikiūras','pilnas-pedikiuras','Nagai',77,true),
  ('Gydomasis pedikiūras','gydomasis-pedikiuras','Nagai',78,true)
) AS v(name, slug, category, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.standard_services ss
  WHERE lower(ss.name) = lower(v.name) OR ss.slug = v.slug
);