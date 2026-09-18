CREATE TABLE public.model_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  service_category TEXT,
  service_name TEXT NOT NULL,
  city TEXT,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  spots INTEGER NOT NULL DEFAULT 1,
  starts_on DATE,
  ends_on DATE,
  contact_phone TEXT,
  contact_email TEXT,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX model_calls_city_idx ON public.model_calls (city);
CREATE INDEX model_calls_provider_idx ON public.model_calls (provider_id);

GRANT SELECT ON public.model_calls TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_calls TO authenticated;
GRANT ALL ON public.model_calls TO service_role;

ALTER TABLE public.model_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active model calls are public" ON public.model_calls
  FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Owners read own model calls" ON public.model_calls
  FOR SELECT TO authenticated USING (provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert own model calls" ON public.model_calls
  FOR INSERT TO authenticated WITH CHECK (provider_id = auth.uid() AND public.is_provider_user(auth.uid()));
CREATE POLICY "Owners update own model calls" ON public.model_calls
  FOR UPDATE TO authenticated USING (provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners delete own model calls" ON public.model_calls
  FOR DELETE TO authenticated USING (provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER model_calls_updated_at BEFORE UPDATE ON public.model_calls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.salon_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL,
  client_user_id UUID,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  note TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX salon_clients_salon_phone_key ON public.salon_clients (salon_id, client_phone);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salon_clients TO authenticated;
GRANT ALL ON public.salon_clients TO service_role;

ALTER TABLE public.salon_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own client records" ON public.salon_clients
  FOR ALL TO authenticated USING (salon_id = auth.uid()) WITH CHECK (salon_id = auth.uid());

CREATE TRIGGER salon_clients_updated_at BEFORE UPDATE ON public.salon_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();