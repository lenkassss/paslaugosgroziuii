import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SCHOOL_TRIAL_MONTHS, TIER_PRICING } from "@/lib/access";
import { publicClient, slugify } from "@/lib/schools.server";

/** Viešas mokymų katalogas; valdymo veiksmai lieka apsaugoti autentifikacija ir RLS. */
export const listSchools = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    city: z.string().optional(),
    category: z.string().optional(),
    q: z.string().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data }) => {
    let q = publicClient().from("schools").select("id,slug,name,city,category,description,cover_url,logo_url,is_verified").eq("is_active", true);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.category) q = q.eq("category", data.category);
    if (data.q) q = q.ilike("name", `%${data.q.replace(/[%_]/g, "")}%`);
    const { data: rows, error } = await q.order("is_verified", { ascending: false }).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return { schools: rows ?? [] };
  });

export const getSchool = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: school, error } = await client.from("schools").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!school) throw new Error("Mokykla nerasta");
    const { data: courses } = await client.from("courses").select("*").eq("school_id", school.id)
      .eq("is_active", true).eq("status", "approved").order("starts_at", { ascending: true, nullsFirst: false });
    // Kiekvieniems mokymams paskaičiuojam laisvas vietas (be dalyvių duomenų).
    const withSeats = await Promise.all((courses ?? []).map(async (course) => {
      const { data: left } = await client.rpc("course_seats_left", { _course: course.id });
      return { ...course, seats_left: Number(left ?? course.seats) };
    }));
    return { school, courses: withSeats };
  });

export const upsertSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2).max(120),
    city: z.string().optional().default(""),
    address: z.string().optional().default(""),
    category: z.string().optional().default(""),
    description: z.string().optional().default(""),
    cover_url: z.string().optional().default(""),
    logo_url: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    email: z.string().optional().default(""),
    website: z.string().optional().default(""),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const base = {
      name: data.name, city: data.city || null, address: data.address || null,
      category: data.category || null, description: data.description || null,
      cover_url: data.cover_url || null, logo_url: data.logo_url || null,
      phone: data.phone || null, email: data.email || null, website: data.website || null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("schools").update(base).eq("id", data.id).eq("owner_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id, ok: true };
    }
    const { data: row, error } = await context.supabase.from("schools")
      .insert({ ...base, owner_id: context.userId, slug: `${slugify(data.name)}-${Math.random().toString(36).slice(2, 7)}` })
      .select("id, slug").maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id, slug: row?.slug, ok: true };
  });

export const listMySchool = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("schools").select("*").eq("owner_id", context.userId).maybeSingle();
    if (!data) return { school: null, courses: [] };
    const { data: courses } = await context.supabase.from("courses").select("*").eq("school_id", data.id).order("created_at", { ascending: false });
    return { school: data, courses: courses ?? [] };
  });

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    school_id: z.string().uuid(),
    title: z.string().min(2).max(160),
    category: z.string().optional().default(""),
    duration_hours: z.number().int().min(1).max(2000).default(8),
    price: z.number().min(0).default(0),
    starts_at: z.string().optional().nullable(),
    seats: z.number().int().min(1).max(500).default(12),
    description: z.string().optional().default(""),
    cover_url: z.string().optional().default(""),
    is_active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const base = {
      school_id: data.school_id,
      title: data.title, category: data.category || null,
      duration_hours: data.duration_hours, price: data.price,
      starts_at: data.starts_at || null, seats: data.seats,
      description: data.description || null, cover_url: data.cover_url || null,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await context.supabase.from("courses").update(base).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id, ok: true };
    }
    // Naujas kursas: 9,99 € už paskelbimą. Pirmus 6 narystės mėnesius – nemokamai.
    const { data: school } = await context.supabase
      .from("schools").select("created_at").eq("id", data.school_id).maybeSingle();
    const trialUntil = school?.created_at
      ? new Date(new Date(school.created_at).getTime() + SCHOOL_TRIAL_MONTHS * 30 * 86_400_000)
      : null;
    const inTrial = !!trialUntil && trialUntil.getTime() > Date.now();

    const { data: row, error } = await context.supabase
      .from("courses")
      .insert({
        ...base,
        amount_cents: TIER_PRICING.course.cents,
        payment_status: inTrial ? "paid" : "pending",
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id, ok: true, inTrial, amount_cents: inTrial ? 0 : TIER_PRICING.course.cents };
  });

/** Demo mokėjimas už mokymų paskelbimą (9,99 €). */
export const payForCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), card_last4: z.string().regex(/^\d{4}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("courses")
      .select("id, school_id, amount_cents, payment_status, schools!inner(owner_id)")
      .eq("id", data.id)
      .maybeSingle();
    const owner = (row as unknown as { schools?: { owner_id: string } } | null)?.schools?.owner_id;
    if (!row || owner !== context.userId) throw new Error("Kursas nerastas");
    if (row.payment_status === "paid") return { ok: true, alreadyPaid: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("demo_payments").insert({
      user_id: context.userId,
      amount: (row.amount_cents ?? TIER_PRICING.course.cents) / 100,
      card_last4: data.card_last4,
      status: "paid",
      kind: "course",
      target_id: row.id,
    });
    const { error } = await supabaseAdmin.from("courses").update({ payment_status: "paid" }).eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true, alreadyPaid: false };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const registerToCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    course_id: z.string().uuid(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().default(""),
    seats: z.number().int().min(1).max(10).default(1),
    note: z.string().optional().default(""),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Platformos mokestis: 0,49 € už registraciją (kaip vizitams ir renginiams).
    const PLATFORM_FEE_CENTS = 49;
    const { data: course, error: cErr } = await context.supabase
      .from("courses")
      .select("id, price, title, starts_at, seats, schools!inner(name, owner_id, city, address)")
      .eq("id", data.course_id)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!course) throw new Error("Mokymai nerasti");

    // Vietų kontrolė – neleidžiam registruotis virš talpos.
    const { data: left } = await context.supabase.rpc("course_seats_left", { _course: data.course_id });
    const seatsLeft = Number(left ?? 0);
    if (seatsLeft <= 0) throw new Error("Šiuose mokymuose laisvų vietų nebeliko");
    if (data.seats > seatsLeft) throw new Error(`Liko tik ${seatsLeft} laisvos vietos`);

    const amount_cents = Math.round(Number(course.price) * 100) * data.seats + PLATFORM_FEE_CENTS;

    const { error } = await context.supabase.from("course_registrations").insert({
      course_id: data.course_id, user_id: context.userId,
      name: data.name, email: data.email, phone: data.phone || null,
      seats: data.seats, note: data.note || null, payment_status: "pending",
      amount_cents,
    });
    if (error) throw new Error(error.message);

    const school = (course as unknown as { schools?: { name: string; owner_id: string; city: string | null; address: string | null } }).schools;

    // Patvirtinimo laiškas dalyviui PaslaugosGrožiui vardu.
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("booking-confirmation", data.email, {
        templateData: {
          clientName: data.name,
          salonName: school?.name ?? "Grožio mokykla",
          serviceName: course.title,
          appointmentDate: course.starts_at ? new Date(course.starts_at).toLocaleDateString("lt-LT") : "Data bus patikslinta",
          timeSlot: course.starts_at ? new Date(course.starts_at).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" }) : "",
          address: [school?.address, school?.city].filter(Boolean).join(", "),
        },
      });
    } catch {
      // Laiško nepavyko išsiųsti – registracija vis tiek užfiksuota.
    }

    // Pranešimas mokyklai apie naują registraciją.
    if (school?.owner_id) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("notifications").insert({
          user_id: school.owner_id,
          type: "system",
          payload: {
            title: "Nauja registracija į mokymus",
            course_id: course.id,
            course_title: course.title,
            name: data.name,
            seats: data.seats,
          },
        });
      } catch {
        // Pranešimas nekritinis.
      }
    }

    return { ok: true, amount_cents, seatsLeft: seatsLeft - data.seats };
  });

/* ------------------------------------------------------------------ */
/* Mokymų kalendorius (6 mėn.) ir registracijų valdymas mokykloms      */
/* ------------------------------------------------------------------ */

export type CalendarCourse = {
  id: string;
  title: string;
  category: string | null;
  city: string | null;
  price: number;
  duration_hours: number;
  seats: number;
  starts_at: string;
  cover_url: string | null;
  school_id: string;
  school_name: string;
  school_slug: string;
  /** `course` – mokyklos kursas, `event` – tiekėjo ar vadybos seminaras. */
  kind?: "course" | "event";
  /** Seminarams – straipsnio adresas registracijai. */
  article_slug?: string | null;
};


/** Viešas 6 mėnesių mokymų kalendorius visose mokyklose. */
export const listUpcomingCourses = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    months: z.number().int().min(1).max(12).optional().default(6),
    city: z.string().optional(),
    category: z.string().optional(),
    schoolId: z.string().uuid().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const client = publicClient();
    const from = new Date();
    const to = new Date(from.getTime() + data.months * 31 * 86_400_000);
    let query = client
      .from("courses")
      .select("id,title,category,price,duration_hours,seats,starts_at,cover_url,school_id,schools!inner(id,name,slug,city,is_active)")
      .eq("is_active", true)
      .eq("status", "approved")
      .not("starts_at", "is", null)
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at", { ascending: true })
      .limit(300);
    if (data.schoolId) query = query.eq("school_id", data.schoolId);
    if (data.category) query = query.eq("category", data.category);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const courses: CalendarCourse[] = (rows ?? [])
      .map((row) => {
        const school = (row as unknown as { schools: { name: string; slug: string; city: string | null; is_active: boolean } }).schools;
        return {
          id: row.id,
          title: row.title,
          category: row.category,
          city: school?.city ?? null,
          price: Number(row.price ?? 0),
          duration_hours: row.duration_hours,
          seats: row.seats,
          starts_at: String(row.starts_at),
          cover_url: row.cover_url,
          school_id: row.school_id,
          school_name: school?.name ?? "",
          school_slug: school?.slug ?? "",
        };
      })
      .filter((c) => (data.city ? (c.city ?? "").toLowerCase().includes(data.city.toLowerCase()) : true));
    return { courses };
  });

/** Kiek vietų liko konkrečiuose mokymuose (be registruotų asmenų duomenų). */
export const getCourseSeatsLeft = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const client = publicClient();
    const entries = await Promise.all(data.ids.map(async (id) => {
      const { data: left } = await client.rpc("course_seats_left", { _course: id });
      return [id, Number(left ?? 0)] as const;
    }));
    return { seatsLeft: Object.fromEntries(entries) as Record<string, number> };
  });

/** Mokyklos savininkui: visų jos mokymų registracijos. */
export const listCourseRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: school } = await context.supabase.from("schools").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!school) return { registrations: [], courses: [] };
    const { data: courses } = await context.supabase
      .from("courses").select("id,title,starts_at,seats,price").eq("school_id", school.id).order("starts_at", { ascending: true, nullsFirst: false });
    const ids = (courses ?? []).map((c) => c.id);
    if (!ids.length) return { registrations: [], courses: [] };
    const { data: regs, error } = await context.supabase
      .from("course_registrations")
      .select("id,course_id,name,email,phone,seats,note,payment_status,created_at")
      .in("course_id", ids)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { registrations: regs ?? [], courses: courses ?? [] };
  });

/** Mokykla pažymi registraciją kaip apmokėtą / atšauktą. */
export const setRegistrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    payment_status: z.enum(["pending", "paid", "cancelled"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("course_registrations").update({ payment_status: data.payment_status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Vienas mokymų kalendorius verslui: mokyklų kursai + tiekėjų / vadybos seminarai
 * (`articles` su `kind = "event"`). Horizontas 3, 6 arba 12 mėn.
 */
export const listTrainingCalendar = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    months: z.number().int().min(1).max(12).optional().default(6),
    city: z.string().optional(),
    category: z.string().optional(),
    brandId: z.string().uuid().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const client = publicClient();
    const from = new Date();
    const to = new Date(from.getTime() + data.months * 31 * 86_400_000);

    /** Seminarai iš straipsnių. */
    let eventQuery = client
      .from("articles")
      .select("id, slug, title, category, cover_url, event_starts_at, event_ends_at, event_location, event_price, event_price_eur, event_seats, author_id")
      .eq("status", "published")
      .eq("kind", "event")
      .not("event_starts_at", "is", null)
      .gte("event_starts_at", from.toISOString())
      .lte("event_starts_at", to.toISOString())
      .order("event_starts_at", { ascending: true })
      .limit(300);
    if (data.category) eventQuery = eventQuery.ilike("category", `%${data.category}%`);

    let brandAuthorIds: string[] | null = null;
    if (data.brandId) {
      const { data: rows } = await client.from("provider_brands").select("profile_id").eq("brand_id", data.brandId).limit(5000);
      brandAuthorIds = Array.from(new Set((rows ?? []).map((r) => r.profile_id)));
      if (!brandAuthorIds.length) return { courses: [] as CalendarCourse[] };
      eventQuery = eventQuery.in("author_id", brandAuthorIds);
    }

    // Mokyklų kursai (prekinio ženklo filtras jiems netaikomas – ženklų kursai neturi).
    let courseQuery = client
      .from("courses")
      .select("id,title,category,price,duration_hours,seats,starts_at,cover_url,school_id,schools!inner(id,name,slug,city,is_active)")
      .eq("is_active", true)
      .eq("status", "approved")
      .not("starts_at", "is", null)
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at", { ascending: true })
      .limit(300);
    if (data.category) courseQuery = courseQuery.eq("category", data.category);

    const [courseRes, eventRes] = await Promise.all([
      data.brandId ? Promise.resolve({ data: [] as any[] }) : courseQuery,
      eventQuery,
    ]);

    const authorIds = Array.from(new Set(((eventRes as { data?: Array<{ author_id: string }> }).data ?? []).map((r) => r.author_id)));
    const authors = authorIds.length
      ? Object.fromEntries(
          ((await client.from("profiles").select("id, business_name, owner_name, city").in("id", authorIds)).data ?? [])
            .map((p) => [p.id, p]),
        )
      : {};

    const events: CalendarCourse[] = (((eventRes as { data?: any[] }).data) ?? []).map((row: any) => {
      const author = (authors as Record<string, { business_name: string | null; owner_name: string | null; city: string | null }>)[row.author_id];
      const hours = row.event_ends_at
        ? Math.max(1, Math.round((new Date(row.event_ends_at).getTime() - new Date(row.event_starts_at).getTime()) / 3_600_000))
        : 2;
      return {
        id: row.id,
        title: row.title,
        category: row.category ?? null,
        city: row.event_location ? String(row.event_location).split(",")[0]!.trim() : (author?.city ?? null),
        price: Number(row.event_price ?? row.event_price_eur ?? 0),
        duration_hours: hours,
        seats: Number(row.event_seats ?? 0),
        starts_at: String(row.event_starts_at),
        cover_url: row.cover_url ?? null,
        school_id: row.author_id,
        school_name: author?.business_name || author?.owner_name || "Seminaras",
        school_slug: "",
        kind: "event" as const,
        article_slug: row.slug,
      };
    }).filter((e: CalendarCourse) => (data.city ? (e.city ?? "").toLowerCase().includes(data.city.toLowerCase()) : true));

    const courses: CalendarCourse[] = (((courseRes as { data?: any[] }).data) ?? [])
      .map((row: any) => {
        const school = row.schools as { name: string; slug: string; city: string | null } | null;
        return {
          id: row.id,
          title: row.title,
          category: row.category ?? null,
          city: school?.city ?? null,
          price: Number(row.price ?? 0),
          duration_hours: row.duration_hours,
          seats: row.seats,
          starts_at: String(row.starts_at),
          cover_url: row.cover_url,
          school_id: row.school_id,
          school_name: school?.name ?? "",
          school_slug: school?.slug ?? "",
          kind: "course" as const,
          article_slug: null,
        } satisfies CalendarCourse;
      })
      .filter((c) => (data.city ? (c.city ?? "").toLowerCase().includes(data.city.toLowerCase()) : true));
    const all = [...courses, ...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return { courses: all };
  });
