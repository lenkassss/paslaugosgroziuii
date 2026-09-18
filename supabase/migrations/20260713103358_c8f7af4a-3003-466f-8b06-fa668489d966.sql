
DO $$ BEGIN
  CREATE TYPE public.article_kind AS ENUM ('article', 'event', 'promo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS kind public.article_kind NOT NULL DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS event_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS event_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS event_location text,
  ADD COLUMN IF NOT EXISTS event_price_eur numeric(10,2),
  ADD COLUMN IF NOT EXISTS event_seats int,
  ADD COLUMN IF NOT EXISTS promo_discount_pct int,
  ADD COLUMN IF NOT EXISTS promo_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS promo_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS promo_service_ids uuid[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_articles_kind_published ON public.articles(kind, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_kind_event_start ON public.articles(kind, event_starts_at) WHERE kind = 'event';
CREATE INDEX IF NOT EXISTS idx_articles_kind_promo_end ON public.articles(kind, promo_ends_at) WHERE kind = 'promo';

-- Demo events + promos
INSERT INTO public.articles (author_id, slug, title, subtitle, excerpt, body_md, cover_url, category, kind, status, published_at, event_starts_at, event_ends_at, event_location, event_price_eur, event_seats)
SELECT p.id, 'seminaras-nagu-' || substr(md5(random()::text), 1, 5),
  'Seminaras: modernios nagų dailės technikos', 'Praktinis kursas nagų meistrams',
  'Vienos dienos intensyvas su tarptautine lektore. Naujausios gel-x, chrome ir aurora technikos.',
  E'## Ko išmoksite\n\n- Struktūrinis gelis ir formos korekcija\n- Chrome & aurora efektai\n- Kliento konsultavimas ir kainodara',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200', 'Mokymai', 'event', 'published', now() - interval '1 day',
  now() + interval '10 days', now() + interval '10 days 8 hours', 'Vilnius, Konstitucijos pr. 12', 189.00, 20
FROM public.profiles p WHERE p.business_name = 'Vilnius Beauty House' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (author_id, slug, title, subtitle, excerpt, body_md, cover_url, category, kind, status, published_at, event_starts_at, event_ends_at, event_location, event_price_eur, event_seats)
SELECT p.id, 'plauku-mokymai-' || substr(md5(random()::text), 1, 5),
  'Plaukų kolorizavimo meistriškumo klasė', 'Balayage, money piece ir šilti tonai 2026',
  'Dviejų dienų programa su modeliais. Riboti kviestiniai vardai.',
  E'Dviejų dienų intensyvas su praktika ant modelių. Skirta patyrusiems kirpėjams.',
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200', 'Mokymai', 'event', 'published', now() - interval '3 days',
  now() + interval '20 days', now() + interval '21 days', 'Kaunas, Laisvės al. 55', 349.00, 12
FROM public.profiles p WHERE p.business_name = 'Kaunas Nails Studio' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (author_id, slug, title, subtitle, excerpt, body_md, cover_url, category, kind, status, published_at, event_starts_at, event_ends_at, event_location, event_price_eur, event_seats)
SELECT p.id, 'blakstienu-lifting-' || substr(md5(random()::text), 1, 5),
  'Blakstienų lifting & botox seminaras', 'Su sertifikuota lektore iš Estijos',
  'Vienadienis kursas su praktika. Pilnas įrangos komplektas įskaičiuotas.',
  E'Įtraukta: teorija, praktika ant 2 modelių, starter kit, sertifikatas.',
  'https://images.unsplash.com/photo-1591019479261-1a103585c559?w=1200', 'Mokymai', 'event', 'published', now() - interval '4 days',
  now() + interval '32 days', now() + interval '32 days 9 hours', 'Klaipėda, Turgaus g. 8', 249.00, 8
FROM public.profiles p WHERE p.business_name = 'Klaipėda Hair Loft' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (author_id, slug, title, subtitle, excerpt, body_md, cover_url, category, kind, status, published_at, promo_discount_pct, promo_starts_at, promo_ends_at)
SELECT p.id, 'vasaros-akcija-' || substr(md5(random()::text), 1, 5),
  'Vasaros akcija: -25% visoms nagų procedūroms', 'Iki liepos pabaigos',
  'Užsisakyk bet kokią nagų procedūrą ir gauk -25% nuolaidą. Galioja darbo dienomis.',
  E'Užsisakyk online per platformą ir automatiškai pritaikysime nuolaidą.',
  'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=1200', 'Akcijos', 'promo', 'published', now() - interval '2 days',
  25, now(), now() + interval '18 days'
FROM public.profiles p WHERE p.business_name = 'Vilnius Beauty House' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (author_id, slug, title, subtitle, excerpt, body_md, cover_url, category, kind, status, published_at, promo_discount_pct, promo_starts_at, promo_ends_at)
SELECT p.id, 'antakiu-akcija-' || substr(md5(random()::text), 1, 5),
  '-30% antakių architektūrai naujoms klientėms', 'Pirmas kartas pas mus',
  'Ateik pirmą kartą – gauk 30% nuolaidą architektūrai + dovana korekcijos gairelė.',
  E'Rezervuok laiką per platformą ir mes automatiškai pritaikysime nuolaidą.',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200', 'Akcijos', 'promo', 'published', now() - interval '5 days',
  30, now() - interval '2 days', now() + interval '25 days'
FROM public.profiles p WHERE p.business_name = 'Panevėžys Brow Bar' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (author_id, slug, title, subtitle, excerpt, body_md, cover_url, category, kind, status, published_at, promo_discount_pct, promo_starts_at, promo_ends_at)
SELECT p.id, 'spa-vakaras-' || substr(md5(random()::text), 1, 5),
  'SPA vakaras dviems: -40% penktadieniais', 'Romantiškas ritualas',
  'Aromaterapija, masažas dviems ir šampanas. Tik penktadieniais 18:00-22:00.',
  E'Užsakyk bent 3 dienas iš anksto.',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200', 'Akcijos', 'promo', 'published', now() - interval '1 day',
  40, now(), now() + interval '30 days'
FROM public.profiles p WHERE p.business_name = 'Šiauliai SPA' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Demo working hours (Mon-Sat 09-19) for all seeded salons
INSERT INTO public.working_hours (salon_id, weekday, start_time, end_time, is_closed)
SELECT p.id, d, '09:00'::time, '19:00'::time, false
FROM public.profiles p
CROSS JOIN generate_series(1, 6) d
WHERE p.business_name IN ('Vilnius Beauty House','Kaunas Nails Studio','Klaipėda Hair Loft','Šiauliai SPA','Panevėžys Brow Bar')
ON CONFLICT (salon_id, weekday) DO NOTHING;

-- Demo services
INSERT INTO public.services (salon_id, name, category, price, duration_mins, description)
SELECT p.id, s.name, s.category, s.price, s.dur, s.descr
FROM public.profiles p
CROSS JOIN (VALUES
  ('Manikiūras klasikinis', 'Nagai', 25.00, 60, 'Klasikinis manikiūras su lakavimu'),
  ('Gelinis manikiūras', 'Nagai', 35.00, 90, 'Ilgai išliekantis gelinis dizainas'),
  ('Kirpimas moterims', 'Plaukai', 30.00, 45, 'Kirpimas + plovimas'),
  ('Antakių architektūra', 'Antakiai', 20.00, 30, 'Formavimas + dažymas'),
  ('SPA ritualas', 'SPA', 65.00, 120, 'Kūno masažas ir aromaterapija')
) AS s(name, category, price, dur, descr)
WHERE p.business_name IN ('Vilnius Beauty House','Kaunas Nails Studio','Klaipėda Hair Loft','Šiauliai SPA','Panevėžys Brow Bar')
  AND NOT EXISTS (SELECT 1 FROM public.services x WHERE x.salon_id = p.id AND x.name = s.name);
