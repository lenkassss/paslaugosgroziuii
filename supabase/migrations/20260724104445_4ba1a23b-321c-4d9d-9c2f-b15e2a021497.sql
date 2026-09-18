-- Apsaugoti super_admin rolę: tik super_admin gali suteikti/panaikinti kitą super_admin.
CREATE OR REPLACE FUNCTION public.protect_super_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _acting uuid := auth.uid();
BEGIN
  -- Leisti Postgres service_role (backend / migracijos) atlikti bet ką.
  IF _acting IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' AND OLD.role = 'super_admin' THEN
    IF NOT public.is_super_admin(_acting) THEN
      RAISE EXCEPTION 'Tik super administratorius gali panaikinti super administratoriaus rolę';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.role = 'super_admin' THEN
    IF NOT public.is_super_admin(_acting) THEN
      RAISE EXCEPTION 'Tik super administratorius gali priskirti super administratoriaus rolę';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (OLD.role = 'super_admin' OR NEW.role = 'super_admin') THEN
    IF NOT public.is_super_admin(_acting) THEN
      RAISE EXCEPTION 'Tik super administratorius gali keisti super administratoriaus rolę';
    END IF;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS protect_super_admin_role_trg ON public.user_roles;
CREATE TRIGGER protect_super_admin_role_trg
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_role();
