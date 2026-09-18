import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { earliestBookableMinute, localNow } from "@/lib/availability-time";
import { validateBookingSlot } from "@/lib/booking-validation.server";
import { MEMBERSHIP_PLANS } from "@/lib/access";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Explicit column allow-lists. Sensitive banking/tax/Stripe columns are never
 * selected through the public or user-scoped Data API — they are revoked at the
 * database level and only reachable with the server service role.
 */
export const PUBLIC_PROFILE_COLUMNS =
  "id, business_name, owner_name, city, address, lat, lng, phone, avatar_url, cover_url, bio, category, subscription_active, subscription_expires_at, suspended, created_at, updated_at, is_featured, featured_until, featured_priority, plan_type, plan_tier, gallery_urls, blocked_at, verification_status, verified_at, at_home_service, subscription_plan, subscription_billing, subscription_state, subscription_started_at, auto_renew, is_approved, payments_enabled, is_primary_owner, first_membership_at, shipping_config, business_description, accept_app_payments, accept_onsite_payments, cancellation_fee_percent, cancellation_window_mins, amenities, min_advance_mins, same_day_closed_on, membership_level" as const;

export const OWN_PROFILE_COLUMNS =
  "id, business_name, owner_name, city, address, lat, lng, phone, avatar_url, cover_url, bio, category, subscription_active, subscription_expires_at, suspended, created_at, updated_at, is_featured, featured_until, featured_priority, plan_type, plan_tier, gallery_urls, blocked_at, verification_status, verified_at, at_home_service, subscription_plan, subscription_billing, subscription_state, subscription_started_at, auto_renew, is_approved, payments_enabled, is_primary_owner, first_membership_at, shipping_config, business_description, accept_app_payments, accept_onsite_payments, cancellation_fee_percent, cancellation_window_mins, amenities, min_advance_mins, same_day_closed_on, membership_level, email, blocked_reason, verification_docs, rejection_reason, next_billing_at, wallet_balance, wallet_pending, accepted_terms_at, notify_bookings, notify_messages, notify_payments, notify_marketing, notify_email" as const;

// ------------- PUBLIC: search salons -------------
export const searchSalons = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    query: z.string().optional(),
    city: z.string().optional(),
    category: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    let q = s.from("profiles")
      .select("id, business_name, owner_name, city, address, lat, lng, phone, avatar_url, cover_url, bio, category, subscription_active, verification_status")
      .eq("subscription_active", true)
      .eq("suspended", false)
      .not("business_name", "is", null);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.category) q = q.eq("category", data.category);
    if (data.query) q = q.ilike("business_name", `%${data.query}%`);
    const { data: rows, error } = await q.limit(200);
    if (error) throw new Error(error.message);
    // filter to those that also have salon role
    if (!rows?.length) return { salons: [] };
    const ids = rows.map((r) => r.id);
    const { data: roles } = await s.from("user_roles").select("user_id, role").in("user_id", ids);
    const salonIds = new Set((roles ?? []).filter((r) => r.role === "salon").map((r) => r.user_id));
    return { salons: rows.filter((r) => salonIds.has(r.id)) };
  });

// ------------- PUBLIC: salon / author detail -------------
export const getSalonDetail = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const nowIso = new Date().toISOString();
    const [profile, services, hours, reviews, role, articles, posts, events, promos, followers, following, gallery] = await Promise.all([
      s.from("profiles").select(PUBLIC_PROFILE_COLUMNS).eq("id", data.id).maybeSingle(),
      s.from("services").select("*").eq("salon_id", data.id).order("category"),
      s.from("working_hours").select("*").eq("salon_id", data.id).order("weekday"),
      s.from("salon_reviews").select("*").eq("salon_id", data.id).eq("approved", true).order("created_at", { ascending: false }),
      s.from("user_roles").select("role").eq("user_id", data.id).maybeSingle(),
      s.from("articles").select("id, slug, title, subtitle, cover_url, category, excerpt, views, comment_count, published_at").eq("author_id", data.id).eq("status", "published").eq("kind", "article").order("published_at", { ascending: false }).limit(24),
      s.from("posts").select("*").eq("author_id", data.id).order("created_at", { ascending: false }).limit(20),
      s.from("articles").select("id, slug, title, cover_url, category, event_starts_at, event_location, published_at").eq("author_id", data.id).eq("status", "published").eq("kind", "event").gte("event_starts_at", nowIso).order("event_starts_at", { ascending: true }).limit(6),
      s.from("articles").select("id, slug, title, cover_url, category, promo_ends_at, published_at").eq("author_id", data.id).eq("status", "published").eq("kind", "promo").or(`promo_ends_at.gte.${nowIso},promo_ends_at.is.null`).order("published_at", { ascending: false }).limit(6),
      s.from("follows").select("id", { count: "exact", head: true }).eq("target_id", data.id),
      s.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", data.id),
      s.from("lookbook_items").select("id, title, image_url, service_name, price").eq("profile_id", data.id).eq("is_active", true).order("sort_order").limit(24),
    ]);
    if (profile.error || !profile.data) throw new Error("Profilis nerastas");
    return {
      profile: profile.data,
      services: services.data ?? [],
      hours: hours.data ?? [],
      reviews: reviews.data ?? [],
      role: (role.data?.role ?? "client") as "salon" | "supplier" | "admin" | "client",
      articles: articles.data ?? [],
      posts: posts.data ?? [],
      events: events.data ?? [],
      promos: promos.data ?? [],
      followerCount: followers.count ?? 0,
      followingCount: following.count ?? 0,
      gallery: gallery.data ?? [],
    };
  });

// ------------- AUTH: is following author -------------
export const getFollowState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ targetId: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase.from("follows").select("id").eq("follower_id", context.userId).eq("target_id", data.targetId).maybeSingle();
    return { following: !!row };
  });


// ------------- PUBLIC: get available slots (optional staffId) -------------
export const getAvailableSlots = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    salonId: z.string(),
    date: z.string(),
    duration: z.number().default(60),
    staffId: z.string().uuid().nullable().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const d = new Date(data.date + "T00:00:00");
    const weekday = d.getDay();

    // Staff-scoped working_hours first (if staffId), then salon default
    let hours: { start_time: string; end_time: string; is_closed: boolean } | null = null;
    if (data.staffId) {
      const r = await s.from("working_hours").select("start_time, end_time, is_closed").eq("salon_id", data.salonId).eq("staff_id", data.staffId).eq("weekday", weekday).maybeSingle();
      hours = r.data;
    }
    if (!hours) {
      const r = await s.from("working_hours").select("start_time, end_time, is_closed").eq("salon_id", data.salonId).is("staff_id", null).eq("weekday", weekday).maybeSingle();
      hours = r.data;
    }
    if (!hours || hours.is_closed) return { slots: [] };

    // Appointments & blocks (staff-scoped if given, else salon-wide)
    let apptQ = s.from("appointments").select("time_slot, duration_mins, staff_id").eq("salon_id", data.salonId).eq("appointment_date", data.date).in("status", ["pending", "confirmed"]);
    if (data.staffId) apptQ = apptQ.eq("staff_id", data.staffId);
    let blockQ = s.from("time_blocks").select("start_time, end_time, staff_id").eq("salon_id", data.salonId).eq("block_date", data.date);
    if (data.staffId) blockQ = blockQ.or(`staff_id.eq.${data.staffId},staff_id.is.null`);
    const [apptRes, blocksRes] = await Promise.all([apptQ, blockQ]);

    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const toStr = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const start = toMin(hours.start_time);
    const end = toMin(hours.end_time);
    const step = 30;
    const slots: { time: string; available: boolean }[] = [];
    const busyRanges: [number, number][] = [
      ...(apptRes.data ?? []).map((a) => [toMin(a.time_slot), toMin(a.time_slot) + (a.duration_mins ?? 60)] as [number, number]),
      ...(blocksRes.data ?? []).map((b) => [toMin(b.start_time), toMin(b.end_time)] as [number, number]),
    ];
    // Rezervacijų taisyklės: minimalus išankstinis laikas + „uždaryta šiandien“.
    const { data: rules } = await s.from("profiles")
      .select("min_advance_mins, same_day_closed_on")
      .eq("id", data.salonId)
      .maybeSingle();
    const earliest = earliestBookableMinute({
      date: data.date,
      minAdvanceMins: rules?.min_advance_mins ?? 60,
      sameDayClosedOn: rules?.same_day_closed_on ?? null,
    });
    if (earliest === null) return { slots: [] };
    for (let m = start; m + data.duration <= end; m += step) {
      const slotEnd = m + data.duration;
      const overlaps = busyRanges.some(([a, b]) => m < b && slotEnd > a);
      const past = m < earliest;
      slots.push({ time: toStr(m), available: !overlaps && !past });
    }
    return { slots };
  });

// ------------- PUBLIC: book appointment (guests allowed) -------------
// Both anonymous visitors and signed-in users can book. If a session cookie
// is present we associate the appointment with the user, otherwise it stays
// a guest booking. Verification status is displayed on the salon profile,
// but never blocks booking.
// ------------- PROTECTED: book appointment (auth required, approved salons only) -------------
export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    salonId: z.string().uuid(),
    serviceId: z.string().uuid().nullable(),
    serviceName: z.string(),
    duration: z.number(),
    clientName: z.string().min(2).max(100),
    clientPhone: z.string().min(5).max(30),
    clientEmail: z.string().email().optional().or(z.literal("")),
    date: z.string(),
    time: z.string(),
    notes: z.string().optional(),
    confirmationChannel: z.enum(["email", "sms", "both", "none"]).default("email"),
    staffId: z.string().uuid().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Enforce approval gate
    const { data: salon } = await supabaseAdmin.from("profiles")
      .select("id, business_name, address, city, is_approved, payments_enabled, subscription_active, membership_level").eq("id", data.salonId).maybeSingle();
    if (!salon) throw new Error("Salonas nerastas");
    if (!salon.is_approved) throw new Error("Salonas peržiūrimas administracijos – rezervacijos laikinai negalimos.");
    if (!salon.subscription_active || salon.membership_level !== "pro") {
      throw new Error("Šis profilis šiuo metu priima užklausas tik telefonu arba el. paštu.");
    }

    // Compute service price + deposit
    let servicePrice = 0;
    if (data.serviceId) {
      const { data: svc } = await supabaseAdmin.from("services").select("price, discount_price, discount_percent, discount_starts_at, discount_ends_at").eq("id", data.serviceId).maybeSingle();
      if (svc) {
        const now = new Date();
        const inRange = (!svc.discount_starts_at || new Date(svc.discount_starts_at) <= now) && (!svc.discount_ends_at || new Date(svc.discount_ends_at) >= now);
        if (inRange && svc.discount_price) servicePrice = Number(svc.discount_price);
        else if (inRange && svc.discount_percent) servicePrice = Number(svc.price) * (1 - Number(svc.discount_percent) / 100);
        else servicePrice = Number(svc.price);
      }
    }
    const deposit = servicePrice > 0 ? Math.max(2, Math.round(servicePrice * 0.20 * 100) / 100) : 0;

    // If staffId is null and salon has active staff, auto-pick the first free one
    let staffId = data.staffId ?? null;
    if (!staffId) {
      const { data: activeStaff } = await supabaseAdmin.from("salon_staff").select("id").eq("salon_id", data.salonId).eq("is_active", true).limit(20);
      if (activeStaff && activeStaff.length) {
        // simple pick: first staff without appointment overlap at that slot
        const { data: booked } = await supabaseAdmin.from("appointments")
          .select("staff_id, time_slot, duration_mins")
          .eq("salon_id", data.salonId).eq("appointment_date", data.date).in("status", ["pending", "confirmed"]);
        const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
        const wantStart = toMin(data.time);
        const wantEnd = wantStart + data.duration;
        const busyStaff = new Set(
          (booked ?? []).filter((b) => {
            const s = toMin(b.time_slot); const e = s + (b.duration_mins ?? 60);
            return wantStart < e && wantEnd > s;
          }).map((b) => b.staff_id).filter(Boolean),
        );
        const free = activeStaff.find((s) => !busyStaff.has(s.id));
        staffId = free?.id ?? null;
        if (!staffId) throw new Error("Šiuo metu nėra laisvos meistrės. Pasirinkite kitą laiką.");
      }
    }

    await validateBookingSlot(supabaseAdmin, {
      salonId: data.salonId,
      date: data.date,
      time: data.time,
      duration: data.duration,
      staffId,
    });

    const { data: row, error } = await supabaseAdmin.from("appointments").insert({
      salon_id: data.salonId,
      service_id: data.serviceId,
      service_name: data.serviceName,
      client_name: data.clientName,
      client_phone: data.clientPhone,
      client_email: data.clientEmail || null,
      client_user_id: context.userId,
      staff_id: staffId,
      appointment_date: data.date,
      time_slot: data.time,
      duration_mins: data.duration,
      status: "pending",
      notes: data.notes ?? null,
      confirmation_channel: data.confirmationChannel,
      deposit_amount: deposit,
      deposit_status: deposit > 0 ? "pending" : "none",
      platform_fee: 0.49,
      payment_status: "pending",
      service_price: servicePrice,
    }).select("id, cancel_token, deposit_amount").maybeSingle();
    if (error) throw new Error(error.message);

    // Patvirtinimo laiškas klientui (nekritinis – neblokuoja rezervacijos)
    const recipient = data.clientEmail || context.claims?.email || null;
    if (recipient && row?.id) {
      try {
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        await sendTemplateEmail("booking-confirmation", recipient, {
          idempotencyKey: `booking-confirmation-${row.id}`,
          templateData: {
            customerName: data.clientName,
            salonName: (salon as any).business_name ?? undefined,
            serviceName: data.serviceName,
            appointmentDate: data.date,
            timeSlot: data.time,
            address: [(salon as any).address, (salon as any).city].filter(Boolean).join(", ") || undefined,
            manageUrl: "https://testinispuslapis.online/dashboard/customer",
          },
        });
      } catch (e) {
        console.error("booking-confirmation email failed", e);
      }
    }

    return { appointment: row, paymentsEnabled: !!salon.payments_enabled };
  });


// ------------- SALON: reschedule / cancel / status -------------
export const rescheduleAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    date: z.string(),
    time: z.string(),
    duration: z.number().int().min(5).max(600).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: prev, error: readErr } = await context.supabase.from("appointments").select("id, salon_id, staff_id, appointment_date, time_slot, duration_mins").eq("id", data.id).maybeSingle();
    if (readErr || !prev) throw new Error("Vizitas nerastas");
    await validateBookingSlot(context.supabase, {
      salonId: prev.salon_id,
      staffId: prev.staff_id,
      date: data.date,
      time: data.time,
      duration: data.duration ?? prev.duration_mins,
      excludeAppointmentId: prev.id,
    });
    const { error } = await context.supabase.from("appointments").update({
      appointment_date: data.date,
      time_slot: data.time,
      duration_mins: data.duration ?? prev.duration_mins,
      status: "confirmed",
      rescheduled_from: { date: prev.appointment_date, time: prev.time_slot, duration: prev.duration_mins, at: new Date().toISOString() },
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    reason: z.string().max(300).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("appointments").update({
      status: "cancelled",
      cancellation_reason: data.reason ?? null,
      cancelled_by: "salon",
      cancelled_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("appointments").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- PUBLIC: token-based client access -------------
export const getAppointmentByToken = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const { data: rows, error } = await s.rpc("get_appointment_by_token", { _token: data.token });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error("Vizitas nerastas.");
    return { appointment: row };
  });

export const clientCancelAppointmentByToken = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().uuid(), reason: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const { data: ok, error } = await s.rpc("cancel_appointment_by_token", { _token: data.token, _reason: data.reason ?? undefined });
    if (error) throw new Error(error.message);
    return { ok: !!ok };
  });


// ------------- PUBLIC: write review -------------
export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    salonId: z.string(),
    reviewerName: z.string().min(2).max(80),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const { error } = await s.from("salon_reviews").insert({
      salon_id: data.salonId,
      reviewer_name: data.reviewerName,
      rating_stars: data.rating,
      text_comment: data.comment ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- SALON: dashboard summary -------------
export const getSalonDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isStaff = (roles ?? []).some((r) => r.role === "staff") && !(roles ?? []).some((r) => r.role === "salon" || r.role === "admin" || r.role === "super_admin");
    const staff = isStaff
      ? await supabase.from("salon_staff").select("id, salon_id, staff_name, specialization, avatar_url, bio").eq("user_id", userId).eq("is_active", true).maybeSingle()
      : null;
    const staffRow = staff?.data ?? null;
    const salonId = staffRow?.salon_id ?? userId;
    const apptQuery = supabase.from("appointments").select("*").eq("salon_id", salonId).order("appointment_date", { ascending: false }).limit(50);
    const [profile, salonProfile, appts, services] = await Promise.all([
      supabase.from("profiles").select(OWN_PROFILE_COLUMNS).eq("id", userId).maybeSingle(),
      staffRow ? supabase.from("profiles").select("id, business_name, city, phone, avatar_url").eq("id", salonId).maybeSingle() : Promise.resolve({ data: null }),
      staffRow ? apptQuery.eq("staff_id", staffRow.id) : apptQuery,
      supabase.from("services").select("*").eq("salon_id", salonId),
    ]);
    return {
      profile: profile.data,
      salonProfile: salonProfile.data,
      staff: staffRow,
      appointments: appts.data ?? [],
      services: services.data ?? [],
    };
  });

// ------------- MEMBERSHIP: lightweight status for any business role -------------
export const getMyMembership = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("subscription_active, subscription_expires_at, plan_type, membership_level")
      .eq("id", context.userId)
      .maybeSingle();
    const active = !!data?.subscription_active;
    const level = (data?.membership_level ?? "basic") as string;
    return {
      active,
      level: active ? (level === "pro" ? "pro" : "basic") : "none",
      isPro: active && level === "pro",
      planType: (data?.plan_type ?? null) as "monthly" | "yearly" | null,
      expiresAt: data?.subscription_expires_at ?? null,
    };
  });

// ------------- SALON: update profile -------------
export const updateSalonProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    business_name: z.string().max(120).optional(),
    owner_name: z.string().max(120).optional(),
    city: z.string().max(80).optional(),
    address: z.string().max(200).optional(),
    phone: z.string().max(30).optional(),
    bio: z.string().max(2000).optional(),
    category: z.string().max(80).optional(),
    avatar_url: z.string().url().optional().or(z.literal("")),
    cover_url: z.string().url().optional().or(z.literal("")),
    gallery_urls: z.array(z.string().url()).max(30).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: staffRow } = await context.supabase
      .from("salon_staff")
      .select("id")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (staffRow) {
      const { error } = await context.supabase.from("salon_staff").update({
        staff_name: data.business_name,
        specialization: data.category,
        avatar_url: data.avatar_url || null,
        bio: data.bio,
      }).eq("id", staffRow.id);
      if (error) throw new Error(error.message);
      const { error: profileError } = await context.supabase.from("profiles").update({
        owner_name: data.owner_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        bio: data.bio,
        category: data.category,
      }).eq("id", context.userId);
      if (profileError) throw new Error(profileError.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- SALON: services CRUD -------------
export const upsertService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(120),
    category: z.string().min(1).max(60),
    description: z.string().max(500).optional(),
    price: z.number().min(0),
    duration_mins: z.number().int().min(5).max(600),
    discount_percent: z.number().int().min(1).max(90).nullable().optional(),
    discount_price: z.number().min(0).nullable().optional(),
    discount_starts_at: z.string().nullable().optional(),
    discount_ends_at: z.string().nullable().optional(),
    discount_label: z.string().max(60).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload = { ...rest, salon_id: context.userId };
    if (id) {
      const { error } = await context.supabase.from("services").update(payload).eq("id", id).eq("salon_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("services").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("services").delete().eq("id", data.id).eq("salon_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- SALON / STAFF: working hours -------------
export const getMyWorkingHours = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staffRow } = await supabase
      .from("salon_staff")
      .select("id, salon_id, staff_name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    const salonId = staffRow?.salon_id ?? userId;
    const q = supabase
      .from("working_hours")
      .select("weekday, start_time, end_time, is_closed")
      .eq("salon_id", salonId)
      .order("weekday");
    const { data: rows } = staffRow ? await q.eq("staff_id", staffRow.id) : await q.is("staff_id", null);
    return { hours: rows ?? [], scope: staffRow ? ("staff" as const) : ("salon" as const), staffName: staffRow?.staff_name ?? null };
  });

export const setWorkingHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    hours: z.array(z.object({
      weekday: z.number().int().min(0).max(6),
      start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/),
      end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/),
      is_closed: z.boolean(),
    }).superRefine((row, ctx) => {
      if (!row.is_closed && row.start_time.slice(0, 5) >= row.end_time.slice(0, 5)) {
        ctx.addIssue({ code: "custom", message: "Darbo dienos pabaiga turi būti vėlesnė už pradžią." });
      }
    })),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staffRow } = await supabase
      .from("salon_staff")
      .select("id, salon_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    const salonId = staffRow?.salon_id ?? userId;
    const del = supabase.from("working_hours").delete().eq("salon_id", salonId);
    if (staffRow) await del.eq("staff_id", staffRow.id);
    else await del.is("staff_id", null);
    const { error } = await supabase.from("working_hours").insert(
      data.hours.map((h) => ({ ...h, salon_id: salonId, staff_id: staffRow?.id ?? null })),
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- SALON: time blocks -------------
export const addTimeBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    block_date: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    reason: z.string().max(120).optional(),
    staff_id: z.string().uuid().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.start_time.slice(0, 5) >= data.end_time.slice(0, 5)) {
      throw new Error("Pabaigos laikas turi būti vėlesnis už pradžios laiką.");
    }
    const { data: staffRow } = await context.supabase.from("salon_staff")
      .select("id, salon_id").eq("user_id", context.userId).eq("is_active", true).maybeSingle();
    const salonId = staffRow?.salon_id ?? context.userId;
    const staffId = staffRow?.id ?? data.staff_id ?? null;
    const { error } = await context.supabase.from("time_blocks").insert({ ...data, salon_id: salonId, staff_id: staffId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- PRICING -------------
/**
 * Kainos visoms verslo rolėms vienodos: bazinė 4,99 €/mėn., PRO priedas +10 €/mėn.
 * Tiesos šaltinis — `src/lib/access.ts` (`MEMBERSHIP_PLANS`).
 */
export const PRICING = {
  master:   { monthly: MEMBERSHIP_PLANS.pro.monthly, yearly: MEMBERSHIP_PLANS.pro.yearly },
  salon:    { monthly: MEMBERSHIP_PLANS.pro.monthly, yearly: MEMBERSHIP_PLANS.pro.yearly },
  supplier: { monthly: MEMBERSHIP_PLANS.pro.monthly, yearly: MEMBERSHIP_PLANS.pro.yearly },
} as const;

/** Bazinis (informacinis) lygis — skelbimai, tiekėjai, renginiai, be online rezervacijų. */
export const STARTER_PRICING = { monthly: MEMBERSHIP_PLANS.basic.monthly, yearly: MEMBERSHIP_PLANS.basic.yearly } as const;


export type MembershipLevel = "starter" | "pro";
export type PlanTier = keyof typeof PRICING;
export type PlanType = "monthly" | "yearly";

function tierFromRole(role: string): PlanTier {
  if (role === "supplier") return "supplier";
  if (role === "salon") return "salon";
  return "master";
}

async function getCallerTier(supabase: import("@supabase/supabase-js").SupabaseClient<Database>, userId: string): Promise<PlanTier> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  return tierFromRole(data?.role ?? "salon");
}



// ------------- DEMO PAYMENT -------------
export const activateDemoMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    cardNumber: z.string(),
    cvc: z.string(),
    expiry: z.string(),
    plan_type: z.enum(["monthly", "yearly"]).default("monthly"),
    level: z.enum(["starter", "pro"]).default("pro"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const digits = data.cardNumber.replace(/\s/g, "");
    if (digits !== "4242424242424242") throw new Error("DEMO_INVALID_CARD");
    const last4 = digits.slice(-4);
    const tier = await getCallerTier(context.supabase, context.userId);
    const amount = data.level === "starter" ? STARTER_PRICING[data.plan_type] : PRICING[tier][data.plan_type];
    const expires = new Date();
    if (data.plan_type === "yearly") expires.setDate(expires.getDate() + 365);
    else expires.setDate(expires.getDate() + 30);
    const { error: updErr } = await context.supabase
      .from("profiles")
      .update({
        subscription_active: true,
        subscription_expires_at: expires.toISOString(),
        plan_type: data.plan_type,
        plan_tier: tier,
        membership_level: data.level,
      })
      .eq("id", context.userId);
    if (updErr) throw new Error(updErr.message);
    const { error: payErr } = await context.supabase.from("demo_payments").insert({
      user_id: context.userId,
      amount,
      card_last4: last4,
      status: "succeeded",
      plan_type: data.plan_type,
      plan_tier: tier,
    });
    if (payErr) throw new Error(payErr.message);
    return { ok: true, expires: expires.toISOString(), amount, plan_type: data.plan_type, tier, level: data.level };
  });

// ------------- UPGRADE monthly -> yearly with pro-rata credit -------------
export const upgradeMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tier = await getCallerTier(context.supabase, context.userId);
    const { data: prof } = await context.supabase.from("profiles").select("subscription_active, subscription_expires_at, plan_type").eq("id", context.userId).maybeSingle();
    if (!prof?.subscription_active || prof.plan_type === "yearly" || !prof.subscription_expires_at) {
      throw new Error("Nėra aktyvios mėnesinės narystės, kurią galima keisti į metinę.");
    }
    const daysLeft = Math.max(0, Math.ceil((new Date(prof.subscription_expires_at).getTime() - Date.now()) / 86400000));
    const credit = Math.min(PRICING[tier].monthly, PRICING[tier].monthly * (daysLeft / 30));
    const price = Math.max(0, +(PRICING[tier].yearly - credit).toFixed(2));
    const expires = new Date();
    expires.setDate(expires.getDate() + 365);
    await context.supabase.from("profiles").update({
      subscription_active: true,
      subscription_expires_at: expires.toISOString(),
      plan_type: "yearly",
      plan_tier: tier,
    }).eq("id", context.userId);
    await context.supabase.from("demo_payments").insert({
      user_id: context.userId,
      amount: price,
      card_last4: "4242",
      status: "succeeded",
      plan_type: "yearly",
      plan_tier: tier,
      credit_applied_eur: +credit.toFixed(2),
    });
    return { ok: true, price, credit: +credit.toFixed(2), expires: expires.toISOString() };
  });

// ------------- STARTER -> PRO (pro-rata credit for remaining Starter days) -------------
export const upgradeToPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tier = await getCallerTier(context.supabase, context.userId);
    const { data: prof } = await context.supabase.from("profiles")
      .select("subscription_active, subscription_expires_at, plan_type, membership_level")
      .eq("id", context.userId).maybeSingle();
    if (!prof || prof.membership_level === "pro") {
      throw new Error("PRO narystė jau aktyvi.");
    }
    const planType = (prof.plan_type === "yearly" ? "yearly" : "monthly") as PlanType;
    const periodDays = planType === "yearly" ? 365 : 30;
    const daysLeft = prof.subscription_active && prof.subscription_expires_at
      ? Math.max(0, Math.ceil((new Date(prof.subscription_expires_at).getTime() - Date.now()) / 86400000))
      : 0;
    const starterPrice = STARTER_PRICING[planType];
    const credit = Math.min(starterPrice, starterPrice * (daysLeft / periodDays));
    const price = Math.max(0, +(PRICING[tier][planType] - credit).toFixed(2));
    const expires = new Date();
    expires.setDate(expires.getDate() + periodDays);
    const { error: updErr } = await context.supabase.from("profiles").update({
      subscription_active: true,
      subscription_expires_at: expires.toISOString(),
      plan_type: planType,
      plan_tier: tier,
      membership_level: "pro",
    }).eq("id", context.userId);
    if (updErr) throw new Error(updErr.message);
    await context.supabase.from("demo_payments").insert({
      user_id: context.userId,
      amount: price,
      card_last4: "4242",
      status: "succeeded",
      plan_type: planType,
      plan_tier: tier,
      credit_applied_eur: +credit.toFixed(2),
    });
    return { ok: true, price, credit: +credit.toFixed(2), daysLeft, expires: expires.toISOString() };
  });

// ------------- Preview upgrade price (no charge) -------------
export const previewUpgradePrice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tier = await getCallerTier(context.supabase, context.userId);
    const { data: prof } = await context.supabase.from("profiles").select("subscription_active, subscription_expires_at, plan_type").eq("id", context.userId).maybeSingle();
    if (!prof?.subscription_active || prof.plan_type === "yearly" || !prof.subscription_expires_at) {
      return { tier, canUpgrade: false, price: PRICING[tier].yearly, credit: 0, daysLeft: 0 };
    }
    const daysLeft = Math.max(0, Math.ceil((new Date(prof.subscription_expires_at).getTime() - Date.now()) / 86400000));
    const credit = Math.min(PRICING[tier].monthly, PRICING[tier].monthly * (daysLeft / 30));
    const price = Math.max(0, +(PRICING[tier].yearly - credit).toFixed(2));
    return { tier, canUpgrade: true, price, credit: +credit.toFixed(2), daysLeft };
  });


// ------------- B2B FEED -------------
export const getB2BFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: posts, error } = await context.supabase
      .from("b2b_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    if (!posts?.length) return { posts: [], authors: {}, replies: {} };

    const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
    const [authorsRes, rolesRes, repliesRes] = await Promise.all([
      context.supabase.from("profiles").select("id, business_name, avatar_url, phone, email").in("id", authorIds),
      context.supabase.from("user_roles").select("user_id, role").in("user_id", authorIds),
      context.supabase.from("b2b_replies").select("*").in("post_id", posts.map((p) => p.id)).order("created_at"),
    ]);
    const authors: Record<string, { business_name: string; avatar_url: string | null; phone: string | null; email: string | null; role: string }> = {};
    for (const a of authorsRes.data ?? []) {
      const r = rolesRes.data?.find((x) => x.user_id === a.id);
      authors[a.id] = {
        business_name: a.business_name ?? "—",
        avatar_url: a.avatar_url,
        phone: a.phone,
        email: a.email,
        role: r?.role ?? "salon",
      };
    }
    const replierIds = Array.from(new Set((repliesRes.data ?? []).map((r) => r.replier_id)));
    if (replierIds.length) {
      const { data: extra } = await context.supabase.from("profiles").select("id, business_name, avatar_url").in("id", replierIds);
      const { data: extraRoles } = await context.supabase.from("user_roles").select("user_id, role").in("user_id", replierIds);
      for (const a of extra ?? []) {
        if (!authors[a.id]) {
          const r = extraRoles?.find((x) => x.user_id === a.id);
          authors[a.id] = { business_name: a.business_name ?? "—", avatar_url: a.avatar_url, phone: null, email: null, role: r?.role ?? "supplier" };
        }
      }
    }
    const replies: Record<string, typeof repliesRes.data> = {};
    for (const r of repliesRes.data ?? []) {
      (replies[r.post_id] ??= []).push(r);
    }
    return { posts, authors, replies };
  });

export const createB2BPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    content: z.string().min(1).max(2000),
    imageUrl: z.string().url().optional().or(z.literal("")),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("b2b_feed").insert({
      author_id: context.userId,
      content_text: data.content,
      image_url: data.imageUrl || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const replyB2B = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    postId: z.string(),
    message: z.string().min(1).max(1000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("b2b_replies").insert({
      post_id: data.postId,
      replier_id: context.userId,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- ADMIN -------------
async function assertAdmin(context: { supabase: ReturnType<typeof publicClient>; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [users, active, posts, payments] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role"),
      supabaseAdmin.from("profiles").select("id").eq("subscription_active", true).eq("suspended", false),
      supabaseAdmin.from("b2b_feed").select("id, created_at"),
      supabaseAdmin.from("demo_payments").select("amount, created_at").eq("status", "succeeded"),
    ]);
    const roleCounts: Record<string, number> = { client: 0, salon: 0, supplier: 0, admin: 0 };
    for (const r of users.data ?? []) roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const mtdRevenue = (payments.data ?? []).filter((p) => new Date(p.created_at) >= monthStart).reduce((a, b) => a + Number(b.amount), 0);
    // last 12 months revenue
    const buckets: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
      buckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    for (const p of payments.data ?? []) {
      const d = new Date(p.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (k in buckets) buckets[k] += Number(p.amount);
    }
    return {
      roleCounts,
      activeMembers: active.data?.length ?? 0,
      pendingPosts: posts.data?.length ?? 0,
      mtdRevenue,
      revenueChart: Object.entries(buckets).map(([k, v]) => ({ month: k, revenue: v })),
    };
  });

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profiles, roles] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    const roleMap: Record<string, string> = {};
    for (const r of roles.data ?? []) roleMap[r.user_id] = r.role;
    return {
      users: (profiles.data ?? []).map((p) => ({ ...p, role: roleMap[p.id] ?? "client" })),
    };
  });

export const adminToggleSuspend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string(), suspend: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ suspended: data.suspend }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGrantVip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string(), grant: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
    const { error } = await supabaseAdmin.from("profiles").update({
      subscription_active: data.grant,
      subscription_expires_at: data.grant ? expires.toISOString() : null,
    }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminChangeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string(),
    role: z.enum(["client", "staff", "salon", "supplier", "admin"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [posts, reviews] = await Promise.all([
      supabaseAdmin.from("b2b_feed").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("salon_reviews").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const authorIds = Array.from(new Set([...(posts.data ?? []).map((p) => p.author_id), ...(reviews.data ?? []).map((r) => r.salon_id)]));
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, business_name").in("id", authorIds);
    const nameMap: Record<string, string> = {};
    for (const p of profiles ?? []) nameMap[p.id] = p.business_name ?? p.id.slice(0, 8);
    return {
      posts: (posts.data ?? []).map((p) => ({ ...p, author_name: nameMap[p.author_id] })),
      reviews: (reviews.data ?? []).map((r) => ({ ...r, salon_name: nameMap[r.salon_id] })),
    };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("b2b_feed").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("salon_reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- BOOTSTRAP DEMO USERS -------------
/**
 * Demo sėklos funkcija. Griežtai administratoriams: ji naudoja service-role
 * teises, keičia paskyrų slaptažodžius ir perrašo demo duomenis, todėl
 * niekada negali būti vieša.
 */
export const bootstrapDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const users = [
      { email: "admin@demo.lt", role: "admin" as const, business_name: "Platformos administratorius", city: "Vilnius", lat: 54.6872, lng: 25.2797, category: "admin", password: "Demo1234!" },
      { email: "vilnius.beauty@demo.lt", role: "salon" as const, business_name: "Vilnius Beauty House", owner_name: "Rita Kaminskienė", city: "Vilnius", address: "Gedimino pr. 15, Vilnius", lat: 54.6872, lng: 25.2797, phone: "+37060011122", bio: "Prabangus grožio salonas Vilniaus centre. Manikiūras, kirpimas, makiažas.", category: "Salonas", cover_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200" },
      { email: "kaunas.nails@demo.lt", role: "salon" as const, business_name: "Kaunas Nails Studio", owner_name: "Aistė Baltrūnaitė", city: "Kaunas", address: "Laisvės al. 40, Kaunas", lat: 54.8985, lng: 23.9036, phone: "+37060022233", bio: "Modernus nagų studija Kaune – gelinis, akrilas, dizainas.", category: "Nagai", cover_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200" },
      { email: "klaipeda.hair@demo.lt", role: "salon" as const, business_name: "Klaipėda Hair Loft", owner_name: "Tomas Petrauskas", city: "Klaipėda", address: "Herkaus Manto g. 22, Klaipėda", lat: 55.7033, lng: 21.1443, phone: "+37060033344", bio: "Kirpykla ir barzdinė uostamiestyje.", category: "Kirpykla", cover_url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200" },
      { email: "siauliai.spa@demo.lt", role: "salon" as const, business_name: "Šiauliai SPA Retreat", owner_name: "Gintarė Vaitkevičienė", city: "Šiauliai", address: "Vilniaus g. 100, Šiauliai", lat: 55.9333, lng: 23.3167, phone: "+37060044455", bio: "SPA ir masažai su prabangos akcentu.", category: "SPA", cover_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200" },
      { email: "panevezys.brow@demo.lt", role: "salon" as const, business_name: "Panevėžys Brow Bar", owner_name: "Ieva Sabonienė", city: "Panevėžys", address: "Respublikos g. 30, Panevėžys", lat: 55.7333, lng: 24.3577, phone: "+37060055566", bio: "Antakių ir blakstienų meno studija.", category: "Antakiai", cover_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200" },
      { email: "supplier.cosmetics@demo.lt", role: "supplier" as const, business_name: "Baltic Beauty Supply", owner_name: "Marius Jankauskas", city: "Vilnius", phone: "+37060077788", bio: "Ekologiška kosmetika salonams. OPI, Essie, CND didmenine kaina.", category: "Kosmetika" },
      { email: "supplier.equipment@demo.lt", role: "supplier" as const, business_name: "SalonTech Equipment", owner_name: "Laura Kazlauskienė", city: "Kaunas", phone: "+37060088899", bio: "Salonų įranga: kėdės, sterilizatoriai, UV lempos.", category: "Įranga" },
      { email: "supplier.hair@demo.lt", role: "supplier" as const, business_name: "HairPro Distribution", owner_name: "Andrius Stankevičius", city: "Klaipėda", phone: "+37060099900", bio: "Profesionalūs plaukų priežiūros produktai.", category: "Plaukams" },
      /** Meistrė su PRO naryste – pilnai veikianti (registracijos + kalendorius). */
      { email: "meistre@demo.lt", role: "staff" as const, level: "pro" as const, business_name: "Inga Nails Meistrė", owner_name: "Inga Žukauskaitė", city: "Vilnius", phone: "+37063015429", bio: "Gelinių nagų ir manikiūro meistrė su asmeniniu kalendoriumi Vilnius Beauty House salone.", category: "Nagai" },
      /** Meistrė su bazine naryste – tik profilis, be internetinių registracijų. */
      { email: "meistre.bazine@demo.lt", role: "staff" as const, level: "basic" as const, business_name: "Rasa Brows Meistrė", owner_name: "Rasa Petraitytė", city: "Kaunas", phone: "+37063015430", bio: "Antakių meistrė. Bazinė narystė – profilis ir kontaktai, registracijos vyksta telefonu.", category: "Antakiai" },
      { email: "client@demo.lt", role: "client" as const, business_name: null, owner_name: "Jonė Klientaitė", city: "Vilnius" },
      { email: "mokykla@demo.lt", role: "school" as const, business_name: "PaslaugosGrožiui Academy", owner_name: "Rūta Mokytoja", city: "Vilnius", phone: "+37060010101", bio: "Grožio mokykla: nagų, kirpimo ir makiažo kursai su sertifikatais.", category: "Mokykla" },
      { email: "darbdavys@demo.lt", role: "employer" as const, business_name: "Beauty Group LT", owner_name: "Darius Darbdavys", city: "Kaunas", phone: "+37060020202", bio: "Salonų tinklas – nuolat ieškome meistrų.", category: "Darbdavys" },
      /** „Tik skelbikas“ – mato tik skelbimų skiltį. */
      { email: "skelbikas@demo.lt", role: "advertiser" as const, business_name: "Skelbikas Demo", owner_name: "Egidijus Skelbėjas", city: "Vilnius", phone: "+37060030303", bio: "Skelbiko demo paskyra – nuomoju kabinetą ir parduodu įrangą.", category: "Skelbimai" },
    ];

    const created: Record<string, string> = {};
    for (const u of users) {
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = existing?.users.find((x) => x.email === u.email);
      let id: string;
      if (found) {
        id = found.id;
        await supabaseAdmin.auth.admin.updateUserById(id, { password: (u as { password?: string }).password ?? "Demo1234!" });
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: (u as { password?: string }).password ?? "Demo1234!",
          email_confirm: true,
          user_metadata: {
            role: u.role,
            business_name: u.business_name,
            owner_name: u.owner_name,
            city: u.city,
            phone: (u as { phone?: string }).phone,
          },
        });
        if (error || !data.user) continue;
        id = data.user.id;
      }
      created[u.email] = id;
      // ensure role
      await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
      await supabaseAdmin.from("user_roles").insert({ user_id: id, role: u.role });
      // ensure profile with details
      const isActive = u.role === "salon" || u.role === "staff" || u.role === "supplier" || u.role === "advertiser";
      /** Narystės lygis: „pro“ atveria registracijas ir kalendorių, „basic“ – tik profilį. */
      const level = (u as { level?: "basic" | "pro" }).level ?? (u.role === "salon" ? "pro" : "basic");
      const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
      await supabaseAdmin.from("profiles").upsert({
        id,
        email: u.email,
        business_name: u.business_name,
        owner_name: u.owner_name,
        city: u.city,
        address: (u as { address?: string }).address,
        lat: (u as { lat?: number }).lat,
        lng: (u as { lng?: number }).lng,
        phone: (u as { phone?: string }).phone,
        bio: (u as { bio?: string }).bio,
        category: (u as { category?: string }).category,
        cover_url: (u as { cover_url?: string }).cover_url,
        subscription_active: isActive,
        subscription_expires_at: isActive ? expires.toISOString() : null,
        plan_tier: u.role === "staff" ? "master" : u.role,
        plan_type: "yearly",
        membership_level: level,
        is_approved: u.role === "salon" ? true : false,
        verification_status: u.role === "salon" ? "verified" : "unverified",
      });
    }

    // Skelbiko demo anketa — jau patvirtinta, su 3 skelbimų kreditais
    const advertiserId = created["skelbikas@demo.lt"];
    if (advertiserId) {
      await supabaseAdmin.from("advertiser_profiles").upsert(
        {
          user_id: advertiserId,
          person_type: "individual",
          full_name: "Egidijus Skelbėjas",
          email: "skelbikas@demo.lt",
          phone: "+37060030303",
          address: "Vilnius",
          intent: "Nuomoju kabinetą Vilniuje ir parduodu kosmetologinę įrangą.",
          status: "approved",
          listing_credits: 3,
          subscription_active: true,
        },
        { onConflict: "user_id" },
      );
    }

    // Seed services + working hours + reviews for salons
    const salonEmails = ["vilnius.beauty@demo.lt", "kaunas.nails@demo.lt", "klaipeda.hair@demo.lt", "siauliai.spa@demo.lt", "panevezys.brow@demo.lt"];
    const salonServices: Record<string, Array<{ name: string; category: string; price: number; duration_mins: number }>> = {
      "vilnius.beauty@demo.lt": [
        { name: "Klasikinis manikiūras", category: "Nagai", price: 25, duration_mins: 60 },
        { name: "Gelinis lakavimas", category: "Nagai", price: 35, duration_mins: 90 },
        { name: "Moteriškas kirpimas", category: "Plaukai", price: 40, duration_mins: 60 },
        { name: "Vakarinis makiažas", category: "Makiažas", price: 55, duration_mins: 60 },
      ],
      "kaunas.nails@demo.lt": [
        { name: "Akrilo nagai", category: "Nagai", price: 45, duration_mins: 120 },
        { name: "Nagų dizainas", category: "Nagai", price: 15, duration_mins: 30 },
        { name: "Pedikiūras", category: "Nagai", price: 30, duration_mins: 60 },
      ],
      "klaipeda.hair@demo.lt": [
        { name: "Vyriškas kirpimas", category: "Plaukai", price: 20, duration_mins: 45 },
        { name: "Barzdos formavimas", category: "Plaukai", price: 15, duration_mins: 30 },
        { name: "Plaukų dažymas", category: "Plaukai", price: 60, duration_mins: 120 },
      ],
      "siauliai.spa@demo.lt": [
        { name: "Klasikinis masažas", category: "SPA", price: 45, duration_mins: 60 },
        { name: "Aromaterapija", category: "SPA", price: 55, duration_mins: 90 },
        { name: "Veido procedūra", category: "SPA", price: 65, duration_mins: 60 },
      ],
      "panevezys.brow@demo.lt": [
        { name: "Antakių formavimas", category: "Antakiai", price: 18, duration_mins: 30 },
        { name: "Antakių dažymas", category: "Antakiai", price: 25, duration_mins: 45 },
        { name: "Blakstienų priauginimas", category: "Blakstienos", price: 60, duration_mins: 120 },
      ],
    };
    for (const em of salonEmails) {
      const id = created[em];
      if (!id) continue;
      await supabaseAdmin.from("services").delete().eq("salon_id", id);
      await supabaseAdmin.from("services").insert(salonServices[em].map((s) => ({ ...s, salon_id: id })));
      await supabaseAdmin.from("working_hours").delete().eq("salon_id", id);
      const hrs = [];
      for (let d = 1; d <= 5; d++) hrs.push({ salon_id: id, weekday: d, start_time: "09:00", end_time: "18:00", is_closed: false });
      hrs.push({ salon_id: id, weekday: 6, start_time: "10:00", end_time: "16:00", is_closed: false });
      hrs.push({ salon_id: id, weekday: 0, start_time: "10:00", end_time: "16:00", is_closed: true });
      await supabaseAdmin.from("working_hours").insert(hrs);
      // reviews
      await supabaseAdmin.from("salon_reviews").delete().eq("salon_id", id);
      await supabaseAdmin.from("salon_reviews").insert([
        { salon_id: id, reviewer_name: "Milda K.", rating_stars: 5, text_comment: "Puiki paslauga, meistrai profesionalūs!" },
        { salon_id: id, reviewer_name: "Rasa V.", rating_stars: 5, text_comment: "Rekomenduoju, ateisiu dar!" },
        { salon_id: id, reviewer_name: "Justė B.", rating_stars: 4, text_comment: "Gera atmosfera, tik reikėjo palaukti." },
      ]);
    }

    const staffUserId = created["meistre@demo.lt"];
    const mainSalonId = created["vilnius.beauty@demo.lt"];
    if (staffUserId && mainSalonId) {
      await supabaseAdmin.from("salon_staff").delete().eq("user_id", staffUserId);
      const { data: staffRow } = await supabaseAdmin.from("salon_staff").insert({
        salon_id: mainSalonId,
        user_id: staffUserId,
        staff_name: "Inga Žukauskaitė",
        specialization: "Gelinis lakavimas, manikiūras, nagų dizainas",
        bio: "Demo meistrė: mato tik savo priskirtus vizitus ir savo asmeninį kalendorių.",
        is_active: true,
      }).select("id").maybeSingle();

      if (staffRow?.id) {
        await supabaseAdmin.from("working_hours").delete().eq("salon_id", mainSalonId).eq("staff_id", staffRow.id);
        const staffHours = [];
        for (let d = 1; d <= 5; d++) staffHours.push({ salon_id: mainSalonId, staff_id: staffRow.id, weekday: d, start_time: "10:00", end_time: "19:00", is_closed: false });
        staffHours.push({ salon_id: mainSalonId, staff_id: staffRow.id, weekday: 6, start_time: "10:00", end_time: "15:00", is_closed: false });
        staffHours.push({ salon_id: mainSalonId, staff_id: staffRow.id, weekday: 0, start_time: "10:00", end_time: "15:00", is_closed: true });
        await supabaseAdmin.from("working_hours").insert(staffHours);

        const { data: serviceRows } = await supabaseAdmin
          .from("services")
          .select("id, name, duration_mins")
          .eq("salon_id", mainSalonId)
          .in("name", ["Klasikinis manikiūras", "Gelinis lakavimas", "Vakarinis makiažas"]);
        const serviceByName = new Map((serviceRows ?? []).map((s) => [s.name, s]));
        const nextDate = (offset: number) => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          while (d.getDay() === 0) d.setDate(d.getDate() + 1);
          return d.toISOString().slice(0, 10);
        };
        const demoAppts = [
          { name: "Gelinis lakavimas", client_name: "Agnė Petrauskaitė", client_phone: "+37061100001", client_email: "agne.demo@example.com", date: nextDate(1), time: "12:00", status: "confirmed" as const, notes: "Nori raudono prancūziško dizaino." },
          { name: "Klasikinis manikiūras", client_name: "Monika J.", client_phone: "+37061100002", client_email: "monika.demo@example.com", date: nextDate(2), time: "10:30", status: "pending" as const, notes: "Pirmas vizitas šiame salone." },
          { name: "Gelinis lakavimas", client_name: "Rūta V.", client_phone: "+37061100003", client_email: "ruta.demo@example.com", date: nextDate(3), time: "15:00", status: "confirmed" as const, notes: "Trumpi migdolo formos nagai." },
          { name: "Vakarinis makiažas", client_name: "Eglė S.", client_phone: "+37061100004", client_email: "egle.demo@example.com", date: nextDate(5), time: "17:00", status: "confirmed" as const, notes: "Reikia pasiruošti renginiui." },
        ];
        await supabaseAdmin.from("appointments").delete().eq("staff_id", staffRow.id);
        await supabaseAdmin.from("appointments").insert(demoAppts.map((a) => {
          const svc = serviceByName.get(a.name);
          return {
            salon_id: mainSalonId,
            staff_id: staffRow.id,
            service_id: svc?.id ?? null,
            service_name: a.name,
            duration_mins: svc?.duration_mins ?? 60,
            client_name: a.client_name,
            client_phone: a.client_phone,
            client_email: a.client_email,
            client_user_id: created["client@demo.lt"] ?? null,
            appointment_date: a.date,
            time_slot: a.time,
            status: a.status,
            notes: a.notes,
            confirmation_channel: "both",
            confirmation_sent_at: new Date().toISOString(),
            deposit_amount: 5,
            deposit_status: "paid",
            platform_fee: 0.49,
            payment_status: "paid",
          };
        }));
      }
    }

    // Seed B2B posts
    const salonId1 = created["vilnius.beauty@demo.lt"];
    const salonId2 = created["kaunas.nails@demo.lt"];
    const supId1 = created["supplier.cosmetics@demo.lt"];
    const supId2 = created["supplier.hair@demo.lt"];
    if (salonId1 && supId1) {
      await supabaseAdmin.from("b2b_feed").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { data: post1 } = await supabaseAdmin.from("b2b_feed").insert({
        author_id: salonId1,
        content_text: "Ieškau ekologiškų nagų lakų didmenine kaina. Prioritetas – vegan formuluotės. Ar kas turi pasiūlymų?",
      }).select().maybeSingle();
      const { data: post2 } = await supabaseAdmin.from("b2b_feed").insert({
        author_id: salonId2,
        content_text: "Reikia UV lempos naujam nagų kabinetui. Rekomendacijos?",
      }).select().maybeSingle();
      const { data: post3 } = await supabaseAdmin.from("b2b_feed").insert({
        author_id: supId1,
        content_text: "Šią savaitę -20% visai OPI kolekcijai salonams. Užsakymai iki penktadienio.",
      }).select().maybeSingle();
      if (post1) {
        await supabaseAdmin.from("b2b_replies").insert([
          { post_id: post1.id, replier_id: supId1, message: "Turime pilną OPI Nature Strong liniją – vegan ir 9-free. Parašyk el. paštu, atsiųsiu kainininką." },
          { post_id: post1.id, replier_id: supId2, message: "Mūsų asortimente CND Vinylux Bio, pigiau nei rinkos vidurkis." },
        ]);
      }
      if (post2 && supId2) {
        await supabaseAdmin.from("b2b_replies").insert({
          post_id: post2.id, replier_id: supId2, message: "SalonTech Pro-48W – geriausias kainos/kokybės santykis. Susisiek.",
        });
      }
    }

    // ---------- DEMO SHOP PRODUCTS ----------
    const productSeed: Record<string, Array<{ title: string; category: string; brand: string; wholesale: number; image: string; description: string }>> = {
      "supplier.cosmetics@demo.lt": [
        { title: "OPI Nature Strong gelinis lakas 15ml", category: "Nagams", brand: "OPI", wholesale: 9.9, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800", description: "Vegan formulė, 9-free, ilgaamžis blizgesys." },
        { title: "CND Vinylux bazė + viršus rinkinys", category: "Nagams", brand: "CND", wholesale: 18.5, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800", description: "Profesionalus rinkinys salonams." },
        { title: "Essie mini kolekcija (6 vnt.)", category: "Nagams", brand: "Essie", wholesale: 27.0, image: "https://images.unsplash.com/photo-1600428877878-1a0fd85beda8?w=800", description: "Sezoninė spalvų kolekcija." },
        { title: "Nagų dildžių rinkinys 50 vnt.", category: "Priedai", brand: "PaslaugosGrožiui Basics", wholesale: 12.0, image: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800", description: "Vienkartinės dildės 180/240 grit." },
      ],
      "supplier.equipment@demo.lt": [
        { title: "UV/LED lempa 48W Pro", category: "Įranga", brand: "SalonTech", wholesale: 45.0, image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800", description: "Greitas džiovinimas, taimeris, sensorius." },
        { title: "Sterilizatorius UV-C 10L", category: "Įranga", brand: "SalonTech", wholesale: 89.0, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800", description: "Instrumentų sterilizavimas pagal higienos normas." },
        { title: "Manikiūro kėdė Comfort", category: "Baldai", brand: "SalonTech", wholesale: 149.0, image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800", description: "Reguliuojamas aukštis, ergonomiška atrama." },
      ],
      "supplier.hair@demo.lt": [
        { title: "Plaukų kaukė Keratin Repair 1L", category: "Plaukams", brand: "HairPro", wholesale: 16.9, image: "https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800", description: "Intensyvus atkūrimas pažeistiems plaukams." },
        { title: "Profesionalus šampūnas 5L", category: "Plaukams", brand: "HairPro", wholesale: 24.0, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800", description: "Ekonomiška salono pakuotė." },
        { title: "Dažų paletė 12 atspalvių", category: "Plaukams", brand: "HairPro", wholesale: 55.0, image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800", description: "Amoniako neturintys dažai." },
      ],
    };
    for (const [em, list] of Object.entries(productSeed)) {
      const sid = created[em];
      if (!sid) continue;
      await supabaseAdmin.from("products").delete().eq("supplier_id", sid);
      await supabaseAdmin.from("products").insert(list.map((p, i) => ({
        supplier_id: sid,
        title: p.title,
        slug: `${p.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50)}-${i}${Math.random().toString(36).slice(2, 6)}`,
        description: p.description,
        price: p.wholesale,
        price_wholesale: p.wholesale,
        price_retail: Math.round(p.wholesale * 1.3 * 100) / 100,
        currency: "EUR",
        images: [p.image],
        category: p.category,
        brand: p.brand,
        stock: 25,
        discount_percent: 0,
        is_active: true,
      })));
    }

    // ---------- DEMO SCHOOL + COURSES ----------
    const schoolOwner = created["mokykla@demo.lt"];
    if (schoolOwner) {
      await supabaseAdmin.from("schools").delete().eq("owner_id", schoolOwner);
      const { data: school } = await supabaseAdmin.from("schools").insert({
        owner_id: schoolOwner,
        name: "PaslaugosGrožiui Academy",
        slug: "paslaugosgroziui-academy",
        city: "Vilnius",
        address: "Konstitucijos pr. 7, Vilnius",
        category: "Grožio mokykla",
        description: "Praktiniai grožio kursai su sertifikatu. Mažos grupės, individualus dėmesys.",
        cover_url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=1200",
        phone: "+37060010101",
        email: "mokykla@demo.lt",
        is_verified: true,
        is_active: true,
      }).select("id").maybeSingle();
      if (school?.id) {
        await supabaseAdmin.from("courses").insert([
          { school_id: school.id, title: "Manikiūro pagrindai (pradedantiesiems)", category: "Nagai", duration_hours: 40, price: 390, seats: 12, description: "Nuo higienos iki gelinio lakavimo. Baigus – sertifikatas.", cover_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800", is_active: true },
          { school_id: school.id, title: "Kirpimo meistriškumo kursas", category: "Plaukai", duration_hours: 60, price: 590, seats: 10, description: "Moderni kirpimo technika ir klientų aptarnavimas.", cover_url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800", is_active: true },
          { school_id: school.id, title: "Profesionalus makiažas", category: "Makiažas", duration_hours: 32, price: 340, seats: 14, description: "Dieninis, vakarinis ir vestuvinis makiažas.", cover_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800", is_active: true },
        ]);
      }
    }

    // ---------- DEMO JOBS ----------
    const employerId = created["darbdavys@demo.lt"];
    if (employerId) {
      await supabaseAdmin.from("job_listings").delete().eq("employer_id", employerId);
      await supabaseAdmin.from("job_listings").insert([
        { employer_id: employerId, title: "Nagų meistrė (Vilnius)", slug: `nagu-meistre-vilnius-${Math.random().toString(36).slice(2, 6)}`, city: "Vilnius", employment_type: "full_time", salary_from: 1200, salary_to: 1800, currency: "EUR", description: "Ieškome nagų meistrės į naują saloną Vilniaus centre. Pilnas klientų srautas.", requirements: "Min. 1 m. patirtis, sertifikatas.", benefits: "Lankstus grafikas, mokymai, priemonės.", contact_email: "darbdavys@demo.lt", is_active: true },
        { employer_id: employerId, title: "Kirpėjas / kirpėja (Kaunas)", slug: `kirpejas-kaunas-${Math.random().toString(36).slice(2, 6)}`, city: "Kaunas", employment_type: "part_time", salary_from: 900, salary_to: 1500, currency: "EUR", description: "Puse etato kirpykloje Laisvės alėjoje.", requirements: "Patirtis su vyriškais ir moteriškais kirpimais.", benefits: "Procentas nuo apyvartos.", contact_email: "darbdavys@demo.lt", is_active: true },
      ]);
    }

    // ---------- DEMO FORUM ----------
    const { data: cats } = await supabaseAdmin.from("forum_categories").select("id, slug").limit(1);
    const catId = cats?.[0]?.id;
    if (catId && salonId1) {
      const { data: existingThreads } = await supabaseAdmin.from("forum_threads").select("id").limit(1);
      if (!existingThreads?.length) {
        await supabaseAdmin.from("forum_threads").insert([
          { category_id: catId, author_id: salonId1, title: "Kaip elgtis su klientais, kurie neatvyksta?", body: "Vis dažniau pasitaiko no-show. Ar imate depozitą? Kiek?" },
          { category_id: catId, author_id: salonId1, title: "Geriausi gelio brandai 2026", body: "Dalinkimės patirtimi – kas laiko ilgiausiai?" },
        ]);
      }
    }

    return { ok: true, count: Object.keys(created).length };
  });

// ------------- HIGHLIGHT BOOST (€4.99 / week) -------------
// Demo checkout: marks purchase paid immediately. When Stripe/Paddle is enabled,
// swap the `payment_status: 'paid'` for a `pending` + provider session URL redirect.
export const purchaseHighlight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    targetKind: z.enum(["article", "service", "profile"]),
    targetId: z.string().uuid(),
    weeks: z.number().int().min(1).max(52).default(1),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const amountCents = 499 * data.weeks;
    const starts = new Date();
    const ends = new Date(starts.getTime() + data.weeks * 7 * 24 * 3600 * 1000);
    const { data: row, error } = await context.supabase
      .from("highlight_purchases")
      .insert({
        user_id: context.userId,
        target_kind: data.targetKind,
        target_id: data.targetId,
        weeks: data.weeks,
        amount_cents: amountCents,
        currency: "EUR",
        payment_status: "paid", // TODO: switch to 'pending' + real provider session
        payment_provider: "demo",
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        paid_at: new Date().toISOString(),
      } as any)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, purchase: row, amountEur: amountCents / 100 };
  });

// ------------- PAID EVENT REGISTRATION -------------
// Demo checkout — marks registration paid immediately when event has a price.
export const payEventRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ registrationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: reg, error: rerr } = await context.supabase
      .from("event_registrations")
      .select("id, article_id, user_id, amount_cents")
      .eq("id", data.registrationId)
      .single();
    if (rerr || !reg) throw new Error("Registracija nerasta");
    if (reg.user_id && reg.user_id !== context.userId) throw new Error("Ne jūsų registracija");
    const { error } = await context.supabase
      .from("event_registrations")
      .update({
        payment_status: "paid",
        payment_provider: "demo",
        paid_at: new Date().toISOString(),
      } as any)
      .eq("id", reg.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ------------- PUBLIC: month availability overview (for the visual booking calendar) -------------
export type DayAvailability = { date: string; status: "closed" | "full" | "open" | "past"; freeCount: number };

export const getMonthAvailability = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    salonId: z.string(),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    duration: z.number().default(60),
    staffId: z.string().uuid().nullable().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const [yearStr, monthStr] = data.month.split("-");
    const year = Number(yearStr);
    const monthIdx = Number(monthStr) - 1;
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const first = `${data.month}-01`;
    const last = `${data.month}-${String(daysInMonth).padStart(2, "0")}`;

    const [hoursRes, apptRes, blocksRes] = await Promise.all([
      s.from("working_hours").select("weekday, start_time, end_time, is_closed, staff_id").eq("salon_id", data.salonId),
      s.from("appointments").select("appointment_date, time_slot, duration_mins, staff_id")
        .eq("salon_id", data.salonId).gte("appointment_date", first).lte("appointment_date", last)
        .in("status", ["pending", "confirmed"]),
      s.from("time_blocks").select("block_date, start_time, end_time, staff_id")
        .eq("salon_id", data.salonId).gte("block_date", first).lte("block_date", last),
    ]);

    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

    const hoursFor = (weekday: number) => {
      const rows = hoursRes.data ?? [];
      const staffRow = data.staffId ? rows.find((r) => r.weekday === weekday && r.staff_id === data.staffId) : null;
      return staffRow ?? rows.find((r) => r.weekday === weekday && r.staff_id === null) ?? null;
    };

    const busyByDate = new Map<string, Array<[number, number]>>();
    const push = (date: string, range: [number, number]) => {
      const arr = busyByDate.get(date) ?? [];
      arr.push(range);
      busyByDate.set(date, arr);
    };
    for (const a of apptRes.data ?? []) {
      if (data.staffId && a.staff_id && a.staff_id !== data.staffId) continue;
      push(a.appointment_date, [toMin(a.time_slot), toMin(a.time_slot) + (a.duration_mins ?? 60)]);
    }
    for (const b of blocksRes.data ?? []) {
      if (data.staffId && b.staff_id && b.staff_id !== data.staffId) continue;
      push(b.block_date, [toMin(b.start_time), toMin(b.end_time)]);
    }

    const { data: rules } = await s.from("profiles")
      .select("min_advance_mins, same_day_closed_on")
      .eq("id", data.salonId)
      .maybeSingle();
    const todayStr = localNow().date;
    const days: DayAvailability[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${data.month}-${String(d).padStart(2, "0")}`;
      if (date < todayStr) { days.push({ date, status: "past", freeCount: 0 }); continue; }
      const weekday = new Date(`${date}T00:00:00`).getDay();
      const hours = hoursFor(weekday);
      if (!hours || hours.is_closed) { days.push({ date, status: "closed", freeCount: 0 }); continue; }
      const busy = busyByDate.get(date) ?? [];
      const start = toMin(hours.start_time);
      const end = toMin(hours.end_time);
      const earliest = earliestBookableMinute({
        date,
        minAdvanceMins: rules?.min_advance_mins ?? 60,
        sameDayClosedOn: rules?.same_day_closed_on ?? null,
      });
      if (earliest === null) { days.push({ date, status: "closed", freeCount: 0 }); continue; }
      let free = 0;
      for (let m = start; m + data.duration <= end; m += 30) {
        if (m < earliest) continue;
        const slotEnd = m + data.duration;
        if (!busy.some(([a, b]) => m < b && slotEnd > a)) free++;
      }
      days.push({ date, status: free > 0 ? "open" : "full", freeCount: free });
    }

    return { month: data.month, days };
  });
