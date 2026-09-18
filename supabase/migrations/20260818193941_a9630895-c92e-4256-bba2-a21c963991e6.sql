ALTER TABLE public.highlight_purchases DROP CONSTRAINT IF EXISTS highlight_purchases_plan_type_check;
ALTER TABLE public.highlight_purchases ADD CONSTRAINT highlight_purchases_plan_type_check
  CHECK (plan_type IS NULL OR plan_type = ANY (ARRAY['1_day'::text, '3_days'::text, '1_week'::text, '1_month'::text, '3_months'::text, 'trial'::text]));