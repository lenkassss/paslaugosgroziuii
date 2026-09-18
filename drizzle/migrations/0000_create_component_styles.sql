CREATE TABLE public.component_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  element_key text NOT NULL UNIQUE,
  styles jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.component_styles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.component_styles TO authenticated;
GRANT ALL ON public.component_styles TO service_role;

ALTER TABLE public.component_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "component styles readable by everyone"
ON public.component_styles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "super admins manage component styles"
ON public.component_styles FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));