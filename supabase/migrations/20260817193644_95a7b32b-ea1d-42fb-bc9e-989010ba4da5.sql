CREATE POLICY "Staff manages own hours" ON public.working_hours FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.salon_staff st WHERE st.id = working_hours.staff_id AND st.user_id = auth.uid() AND st.is_active))
WITH CHECK (EXISTS (SELECT 1 FROM public.salon_staff st WHERE st.id = working_hours.staff_id AND st.user_id = auth.uid() AND st.is_active));

CREATE POLICY "Staff manages own time blocks" ON public.time_blocks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.salon_staff st WHERE st.id = time_blocks.staff_id AND st.user_id = auth.uid() AND st.is_active))
WITH CHECK (EXISTS (SELECT 1 FROM public.salon_staff st WHERE st.id = time_blocks.staff_id AND st.user_id = auth.uid() AND st.is_active));