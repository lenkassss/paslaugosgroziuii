CREATE OR REPLACE FUNCTION public.purchase_article_promotion(_article uuid, _plan text)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _days int;
  _cents int;
  _label text;
  _base timestamptz;
  _end timestamptz;
  _author uuid;
  _current timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Reikia prisijungti';
  END IF;

  SELECT author_id, promoted_until INTO _author, _current FROM public.articles WHERE id = _article;
  IF _author IS NULL THEN
    RAISE EXCEPTION 'Straipsnis nerastas';
  END IF;
  IF _author <> _uid AND NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Galite reklamuoti tik savo straipsnius';
  END IF;

  CASE _plan
    WHEN '1_day'   THEN _days := 1;  _cents := 299;  _label := 'Rekomenduojama';
    WHEN '3_days'  THEN _days := 3;  _cents := 449;  _label := 'Rekomenduojama';
    WHEN '1_week'  THEN _days := 7;  _cents := 699;  _label := 'Prikabinta';
    WHEN '2_weeks' THEN _days := 14; _cents := 1199; _label := 'Prikabinta';
    WHEN '1_month' THEN _days := 30; _cents := 1999; _label := 'VIP TOP';
    ELSE RAISE EXCEPTION 'Netinkamas planas';
  END CASE;

  _base := GREATEST(COALESCE(_current, now()), now());
  _end := _base + (_days || ' days')::interval;

  INSERT INTO public.highlight_purchases(user_id, target_kind, target_id, weeks, amount_cents,
                                         payment_status, starts_at, ends_at, plan_type)
  VALUES (_uid, 'article', _article, GREATEST(1, ceil(_days::numeric / 7))::int, _cents,
          'paid', now(), _end, _plan);

  UPDATE public.articles
     SET is_promoted = true,
         promoted_until = _end,
         promoted_label = _label
   WHERE id = _article;

  INSERT INTO public.notifications(user_id, type, payload)
  VALUES (_uid, 'promotion_active', jsonb_build_object(
    'article_id', _article, 'plan', _plan, 'ends_at', _end, 'amount_cents', _cents));

  RETURN _end;
END;
$function$;