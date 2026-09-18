ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_discount_percent_check;

ALTER TABLE public.products
ADD CONSTRAINT products_discount_percent_check
CHECK (discount_percent IS NULL OR discount_percent BETWEEN 0 AND 90);