UPDATE public.courses
SET status = 'approved',
    is_active = true,
    payment_status = 'paid',
    starts_at = CASE
      WHEN title ILIKE 'Kirpimo%' THEN now() + interval '30 days'
      WHEN title ILIKE 'Profesionalus makiažas%' THEN now() + interval '62 days'
      ELSE now() + interval '120 days'
    END,
    duration_hours = COALESCE(duration_hours, 16)
WHERE school_id = '2ae3cc40-51a1-4215-af3f-5901ad5a17b7';

INSERT INTO public.courses (school_id, title, category, description, price, duration_hours, seats, starts_at, status, is_active, payment_status)
VALUES
  ('2ae3cc40-51a1-4215-af3f-5901ad5a17b7', 'Plaukų spalvinimo technikos (balayage)', 'Plaukai', 'Praktinis vienos dienos seminaras: balayage, airtouch ir tonavimas. Su modeliais ir sertifikatu.', 250, 8, 12, now() + interval '45 days', 'approved', true, 'paid'),
  ('2ae3cc40-51a1-4215-af3f-5901ad5a17b7', 'Blakstienų priauginimas nuo nulio', 'Blakstienos', 'Kursas pradedantiesiems: klasika, 2D-3D, saugumas ir higiena. Įrankių rinkinys įskaičiuotas.', 420, 24, 8, now() + interval '90 days', 'approved', true, 'paid'),
  ('2ae3cc40-51a1-4215-af3f-5901ad5a17b7', 'Kosmetologo profesijos programa', 'Kosmetologija', 'Ilgesnė programa norintiems tapti grožio srities specialistu: teorija, praktika salone, baigimo diplomas.', 1290, 320, 16, now() + interval '210 days', 'approved', true, 'paid');