CREATE TABLE public.lookbook_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  trend text NOT NULL,
  image_url text NOT NULL,
  master_name text,
  city text,
  price numeric,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_name text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lookbook_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lookbook_items TO authenticated;
GRANT ALL ON public.lookbook_items TO service_role;

ALTER TABLE public.lookbook_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lookbook_public_read_anon" ON public.lookbook_items
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "lookbook_public_read_auth" ON public.lookbook_items
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "lookbook_admin_insert" ON public.lookbook_items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "lookbook_admin_update" ON public.lookbook_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "lookbook_admin_delete" ON public.lookbook_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER lookbook_items_updated_at BEFORE UPDATE ON public.lookbook_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX lookbook_items_trend_idx ON public.lookbook_items (trend, sort_order);

INSERT INTO public.lookbook_items (title, trend, image_url, master_name, city, price, service_name, sort_order) VALUES
('Modernus prancūziškas manikiūras', 'nagai', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80', 'Aistė B.', 'Kaunas', 35, 'Manikiūras + gelinis lakavimas', 1),
('Minimalistinis chrome dizainas', 'nagai', 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=80', 'Rūta P.', 'Vilnius', 42, 'Gelinis lakavimas su dizainu', 2),
('Milky nude nagai', 'nagai', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=900&q=80', 'Simona K.', 'Klaipėda', 30, 'Manikiūras', 3),
('Šviesus balayage', 'plaukai', 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=900&q=80', 'Rita K.', 'Vilnius', 120, 'Balayage dažymas', 1),
('Sluoksniuotas kirpimas su ilgu kirpčiu', 'plaukai', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80', 'Eglė M.', 'Kaunas', 45, 'Kirpimas ir formavimas', 2),
('Šilkinis blizgus atkūrimas', 'plaukai', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=900&q=80', 'Gintarė S.', 'Šiauliai', 60, 'Plaukų atkūrimo procedūra', 3),
('Estetiškos lūpos', 'makiazas', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=900&q=80', 'Laura V.', 'Vilnius', 90, 'Permanentinis lūpų makiažas', 1),
('Švytintis vakarinis makiažas', 'makiazas', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80', 'Kamilė D.', 'Kaunas', 55, 'Vakarinis makiažas', 2),
('Natūralus nuotakos makiažas', 'makiazas', 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=900&q=80', 'Ieva R.', 'Panevėžys', 80, 'Nuotakos makiažas', 3),
('Antakių laminavimas', 'antakiai', 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=900&q=80', 'Justina A.', 'Vilnius', 40, 'Antakių laminavimas', 1),
('Pudriniai antakiai', 'antakiai', 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=900&q=80', 'Vaida L.', 'Klaipėda', 150, 'Permanentinis antakių makiažas', 2),
('Blakstienų 3D klasika', 'antakiai', 'https://images.unsplash.com/photo-1583001809873-a128495da465?w=900&q=80', 'Dovilė N.', 'Kaunas', 50, 'Blakstienų priauginimas', 3);