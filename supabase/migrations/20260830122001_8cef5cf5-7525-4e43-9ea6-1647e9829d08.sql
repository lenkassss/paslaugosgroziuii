CREATE TABLE public.service_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  suggestion text not null,
  note text,
  status text not null default 'new',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT ON public.service_suggestions TO authenticated;
GRANT ALL ON public.service_suggestions TO service_role;

ALTER TABLE public.service_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own suggestions" ON public.service_suggestions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own suggestions" ON public.service_suggestions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all suggestions" ON public.service_suggestions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));
CREATE POLICY "Admins update suggestions" ON public.service_suggestions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));