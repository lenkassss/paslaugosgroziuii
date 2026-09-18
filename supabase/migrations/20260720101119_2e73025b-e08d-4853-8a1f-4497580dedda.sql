
-- Confirmation channel + cancellation metadata + cancel token
DO $$ BEGIN
  CREATE TYPE public.confirmation_channel AS ENUM ('none','email','sms','both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmation_channel public.confirmation_channel NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS rescheduled_from jsonb,
  ADD COLUMN IF NOT EXISTS cancel_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS appointments_cancel_token_idx ON public.appointments(cancel_token);

-- Public token lookup helper (SECURITY DEFINER to bypass RLS with token check)
CREATE OR REPLACE FUNCTION public.get_appointment_by_token(_token uuid)
RETURNS TABLE (
  id uuid, salon_id uuid, service_name text, client_name text, client_phone text, client_email text,
  appointment_date date, time_slot time, duration_mins int, status public.appointment_status,
  confirmation_channel public.confirmation_channel, cancellation_reason text, cancelled_at timestamptz,
  business_name text, address text, city text, phone text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.salon_id, a.service_name, a.client_name, a.client_phone, a.client_email,
         a.appointment_date, a.time_slot, a.duration_mins, a.status,
         a.confirmation_channel, a.cancellation_reason, a.cancelled_at,
         p.business_name, p.address, p.city, p.phone
  FROM public.appointments a
  LEFT JOIN public.profiles p ON p.id = a.salon_id
  WHERE a.cancel_token = _token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(_token uuid, _reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _rows int;
BEGIN
  UPDATE public.appointments
    SET status = 'cancelled',
        cancellation_reason = COALESCE(_reason, 'Atšaukė klientas'),
        cancelled_by = 'client',
        cancelled_at = now()
    WHERE cancel_token = _token AND status <> 'cancelled';
  GET DIAGNOSTICS _rows = ROW_COUNT;
  RETURN _rows > 0;
END $$;

GRANT EXECUTE ON FUNCTION public.get_appointment_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_token(uuid, text) TO anon, authenticated;
