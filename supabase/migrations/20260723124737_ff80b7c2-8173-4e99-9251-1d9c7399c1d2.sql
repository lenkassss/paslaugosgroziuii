
-- ENUMS
DO $$ BEGIN CREATE TYPE public.verification_status AS ENUM ('unverified','pending','verified','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_status AS ENUM ('none','trial','active','past_due','cancelled','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.billing_cycle AS ENUM ('monthly','yearly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.deposit_status AS ENUM ('none','pending','paid','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('pending','paid','shipped','delivered','cancelled','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.supplier_request_status AS ENUM ('new','contacted','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_docs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS at_home_service boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS subscription_billing public.billing_cycle,
  ADD COLUMN IF NOT EXISTS subscription_state public.subscription_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_billing_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wallet_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_pending numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS deposit_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_status public.deposit_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS platform_fee numeric NOT NULL DEFAULT 0.49,
  ADD COLUMN IF NOT EXISTS payment_id uuid,
  ADD COLUMN IF NOT EXISTS client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS appointments_client_user_idx ON public.appointments(client_user_id);
CREATE INDEX IF NOT EXISTS appointments_deposit_status_idx ON public.appointments(deposit_status);

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS deposit_percent int NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS deposit_fixed numeric;

ALTER TABLE public.demo_payments
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS target_id uuid,
  ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS demo_payments_kind_idx ON public.demo_payments(kind);
CREATE INDEX IF NOT EXISTS demo_payments_user_idx ON public.demo_payments(user_id);

CREATE TABLE IF NOT EXISTS public.salon_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('deposit_in','fee_deducted','payout','refund','order_in','adjustment')),
  amount numeric NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  order_id uuid,
  payment_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salon_transactions TO authenticated;
GRANT ALL ON public.salon_transactions TO service_role;
ALTER TABLE public.salon_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon reads own tx" ON public.salon_transactions FOR SELECT TO authenticated USING (auth.uid() = salon_id OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS salon_transactions_salon_idx ON public.salon_transactions(salon_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.supplier_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  products_description text NOT NULL,
  status public.supplier_request_status NOT NULL DEFAULT 'new',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.supplier_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.supplier_requests TO authenticated;
GRANT ALL ON public.supplier_requests TO service_role;
ALTER TABLE public.supplier_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit supplier request" ON public.supplier_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin reads supplier requests" ON public.supplier_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin updates supplier requests" ON public.supplier_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text,
  brand text,
  stock int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  discount_percent int CHECK (discount_percent IS NULL OR (discount_percent BETWEEN 1 AND 90)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read active" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true OR auth.uid() = supplier_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "supplier manages own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = supplier_id) WITH CHECK (auth.uid() = supplier_id);
CREATE POLICY "admin manages products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS products_supplier_idx ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS products_active_idx ON public.products(is_active);
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0.49,
  total numeric NOT NULL DEFAULT 0,
  shipping_address jsonb,
  contact_phone text,
  contact_email text,
  payment_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buyer reads own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = supplier_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "buyer creates own order" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "supplier updates own order" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = supplier_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = supplier_id OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS orders_buyer_idx ON public.orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_supplier_idx ON public.orders(supplier_id, created_at DESC);
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  snapshot_title text NOT NULL,
  qty int NOT NULL CHECK (qty > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read items via own order" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.supplier_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "buyer inserts items on own order" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);

-- storage policies (buckets already exist)
DROP POLICY IF EXISTS "owner uploads own verification docs" ON storage.objects;
DROP POLICY IF EXISTS "owner reads own verification docs" ON storage.objects;
DROP POLICY IF EXISTS "admin reads verification docs" ON storage.objects;
CREATE POLICY "owner uploads own verification docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner reads own verification docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "admin reads verification docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification-docs' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "supplier uploads own product images" ON storage.objects;
DROP POLICY IF EXISTS "anyone reads product images" ON storage.objects;
CREATE POLICY "supplier uploads own product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "anyone reads product images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'products');

CREATE OR REPLACE FUNCTION public.auto_cancel_unpaid_appointments()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.appointments
     SET status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = 'system',
         cancellation_reason = 'Depozitas nesumokėtas per 15 min'
   WHERE status = 'pending'
     AND deposit_status <> 'paid'
     AND deposit_amount > 0
     AND created_at < now() - interval '15 minutes';
$$;
REVOKE EXECUTE ON FUNCTION public.auto_cancel_unpaid_appointments() FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.expire_stale_subscriptions()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles
     SET subscription_state = 'expired',
         subscription_active = false
   WHERE subscription_state IN ('trial','active','past_due')
     AND next_billing_at IS NOT NULL
     AND next_billing_at < now() - interval '3 days';
$$;
REVOKE EXECUTE ON FUNCTION public.expire_stale_subscriptions() FROM anon, authenticated;
