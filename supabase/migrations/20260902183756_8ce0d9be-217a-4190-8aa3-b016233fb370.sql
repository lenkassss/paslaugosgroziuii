GRANT SELECT ON public.courses TO anon;

CREATE POLICY "courses_public_read" ON public.courses
FOR SELECT TO anon
USING (is_active = true AND status = 'approved');

CREATE OR REPLACE FUNCTION public.course_seats_left(_course uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    COALESCE((SELECT c.seats FROM public.courses c WHERE c.id = _course), 0)
    - COALESCE((SELECT SUM(r.seats) FROM public.course_registrations r
                 WHERE r.course_id = _course AND r.payment_status <> 'cancelled'), 0),
    0)::int;
$$;

GRANT EXECUTE ON FUNCTION public.course_seats_left(uuid) TO anon, authenticated;