ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promoted_until timestamptz,
  ADD COLUMN IF NOT EXISTS promoted_label text,
  ADD COLUMN IF NOT EXISTS promoted_priority integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS articles_promoted_idx
  ON public.articles (is_promoted, promoted_until DESC NULLS LAST, promoted_priority DESC);