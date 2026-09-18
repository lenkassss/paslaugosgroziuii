ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'booking_confirmed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'booking_cancelled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'booking_reminder';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'promotion_active';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'promotion_expiring';

CREATE OR REPLACE FUNCTION public.enforce_article_promoted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.is_promoted IS DISTINCT FROM OLD.is_promoted
      OR NEW.promoted_until IS DISTINCT FROM OLD.promoted_until
      OR NEW.promoted_priority IS DISTINCT FROM OLD.promoted_priority)
  THEN
    IF public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    IF auth.uid() = OLD.author_id THEN
      -- owners cannot set their own priority
      NEW.promoted_priority := OLD.promoted_priority;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Straipsnio reklamavimą gali keisti tik admin arba autorius';
  END IF;
  RETURN NEW;
END;
$function$;

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
    WHEN '1_day'   THEN _days := 1;  _cents := 199;  _label := 'Rekomenduojama';
    WHEN '3_days'  THEN _days := 3;  _cents := 449;  _label := 'Rekomenduojama';
    WHEN '1_week'  THEN _days := 7;  _cents := 799;  _label := 'Prikabinta';
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

CREATE OR REPLACE FUNCTION public.expire_promoted_articles()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.articles
     SET is_promoted = false
   WHERE is_promoted = true
     AND promoted_until IS NOT NULL
     AND promoted_until < now();
$function$;

CREATE OR REPLACE FUNCTION public.notify_appointment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _salon text;
BEGIN
  IF NEW.client_user_id IS NULL OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  SELECT business_name INTO _salon FROM public.profiles WHERE id = NEW.salon_id;

  IF NEW.status = 'confirmed' THEN
    INSERT INTO public.notifications(user_id, type, payload)
    VALUES (NEW.client_user_id, 'booking_confirmed', jsonb_build_object(
      'appointment_id', NEW.id, 'salon_name', _salon, 'service_name', NEW.service_name,
      'appointment_date', NEW.appointment_date, 'time_slot', NEW.time_slot));
  ELSIF NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications(user_id, type, payload)
    VALUES (NEW.client_user_id, 'booking_cancelled', jsonb_build_object(
      'appointment_id', NEW.id, 'salon_name', _salon, 'service_name', NEW.service_name,
      'appointment_date', NEW.appointment_date, 'reason', NEW.cancellation_reason));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_appointment_status ON public.appointments;
CREATE TRIGGER trg_notify_appointment_status
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_status();