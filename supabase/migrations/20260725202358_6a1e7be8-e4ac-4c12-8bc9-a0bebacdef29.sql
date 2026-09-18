DROP POLICY IF EXISTS "Staff reads assigned appointment PII" ON public.appointments;
CREATE POLICY "Staff reads assigned appointment PII"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.salon_staff st
    WHERE st.id = appointments.staff_id
      AND st.user_id = auth.uid()
      AND st.is_active = true
  )
);

DROP POLICY IF EXISTS "Staff manages assigned appts" ON public.appointments;
CREATE POLICY "Staff manages assigned appts"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.salon_staff st
    WHERE st.id = appointments.staff_id
      AND st.user_id = auth.uid()
      AND st.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.salon_staff st
    WHERE st.id = appointments.staff_id
      AND st.user_id = auth.uid()
      AND st.is_active = true
  )
);