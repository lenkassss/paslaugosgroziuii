
-- Enums
DO $$ BEGIN
  CREATE TYPE public.comment_status AS ENUM ('visible','pending','hidden','deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('comment_reply','comment_on_article','comment_vote','comment_removed','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- article_comments
CREATE TABLE public.article_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.article_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) <= 2000),
  status public.comment_status NOT NULL DEFAULT 'visible',
  score integer NOT NULL DEFAULT 0,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  report_count integer NOT NULL DEFAULT 0,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX article_comments_article_idx ON public.article_comments(article_id, status, score DESC, created_at DESC);
CREATE INDEX article_comments_parent_idx ON public.article_comments(parent_id);
CREATE INDEX article_comments_user_idx ON public.article_comments(user_id);
GRANT SELECT ON public.article_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_comments TO authenticated;
GRANT ALL ON public.article_comments TO service_role;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible or own or admin can view" ON public.article_comments FOR SELECT
  USING (status = 'visible' OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated can insert own" ON public.article_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner edit within 15m or admin" ON public.article_comments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (user_id = auth.uid() AND created_at > now() - interval '15 minutes'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR user_id = auth.uid());
CREATE POLICY "Owner or admin delete" ON public.article_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- comment_votes
CREATE TABLE public.comment_votes (
  comment_id uuid NOT NULL REFERENCES public.article_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX comment_votes_user_idx ON public.comment_votes(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comment_votes TO authenticated;
GRANT ALL ON public.comment_votes TO service_role;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own votes visible" ON public.comment_votes FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Insert own vote" ON public.comment_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own vote" ON public.comment_votes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own vote" ON public.comment_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- comment_reports
CREATE TABLE public.comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.article_comments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comment_reports_status_idx ON public.comment_reports(status, created_at DESC);
CREATE INDEX comment_reports_comment_idx ON public.comment_reports(comment_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comment_reports TO authenticated;
GRANT ALL ON public.comment_reports TO service_role;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated create own report" ON public.comment_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admin view reports" ON public.comment_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR reporter_id = auth.uid());
CREATE POLICY "Admin update reports" ON public.comment_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.notification_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, read_at NULLS FIRST, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own notifications view" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Own notifications mark read" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- articles.comment_count
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

-- updated_at trigger
CREATE TRIGGER article_comments_set_updated_at BEFORE UPDATE ON public.article_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Vote counters trigger
CREATE OR REPLACE FUNCTION public.update_comment_vote_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _cid uuid;
  _up int;
  _dn int;
BEGIN
  _cid := COALESCE(NEW.comment_id, OLD.comment_id);
  SELECT
    COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END),0)
  INTO _up, _dn FROM public.comment_votes WHERE comment_id = _cid;
  UPDATE public.article_comments
     SET upvotes = _up, downvotes = _dn, score = _up - _dn
   WHERE id = _cid;
  RETURN NULL;
END $$;

CREATE TRIGGER comment_votes_counters
AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_vote_counters();

-- Reply/article counters + notification trigger
CREATE OR REPLACE FUNCTION public.on_comment_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _recipient uuid;
  _article_slug text;
  _article_title text;
BEGIN
  -- Increment counters
  UPDATE public.articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE public.article_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
    SELECT user_id INTO _recipient FROM public.article_comments WHERE id = NEW.parent_id;
  ELSE
    SELECT author_id, slug, title INTO _recipient, _article_slug, _article_title
      FROM public.articles WHERE id = NEW.article_id;
  END IF;

  IF _article_slug IS NULL THEN
    SELECT slug, title INTO _article_slug, _article_title FROM public.articles WHERE id = NEW.article_id;
  END IF;

  IF _recipient IS NOT NULL AND _recipient <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      _recipient,
      CASE WHEN NEW.parent_id IS NOT NULL THEN 'comment_reply'::public.notification_type
           ELSE 'comment_on_article'::public.notification_type END,
      jsonb_build_object(
        'comment_id', NEW.id,
        'article_id', NEW.article_id,
        'article_slug', _article_slug,
        'article_title', _article_title,
        'actor_id', NEW.user_id,
        'excerpt', left(NEW.body, 140)
      )
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER article_comments_after_insert
AFTER INSERT ON public.article_comments
FOR EACH ROW EXECUTE FUNCTION public.on_comment_insert();

CREATE OR REPLACE FUNCTION public.on_comment_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.articles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.article_id;
  IF OLD.parent_id IS NOT NULL THEN
    UPDATE public.article_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_id;
  END IF;
  RETURN OLD;
END $$;

CREATE TRIGGER article_comments_after_delete
AFTER DELETE ON public.article_comments
FOR EACH ROW EXECUTE FUNCTION public.on_comment_delete();

-- Report → auto-pending after 3
CREATE OR REPLACE FUNCTION public.on_comment_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _count int;
BEGIN
  UPDATE public.article_comments SET report_count = report_count + 1 WHERE id = NEW.comment_id
    RETURNING report_count INTO _count;
  IF _count >= 3 THEN
    UPDATE public.article_comments SET status = 'pending' WHERE id = NEW.comment_id AND status = 'visible';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER comment_reports_after_insert
AFTER INSERT ON public.comment_reports
FOR EACH ROW EXECUTE FUNCTION public.on_comment_report();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.article_comments;
