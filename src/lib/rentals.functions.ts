import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertB2B(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  const ok = roles.some((r) => r === "salon" || r === "staff" || r === "supplier" || r === "admin" || r === "super_admin");
  if (!ok) throw new Error("Patalpų nuoma prieinama tik salonams, meistrėms ir tiekėjams.");
}

export const listRentals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number; city?: string } | undefined) =>
    z.object({ limit: z.number().min(1).max(60).optional(), city: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertB2B(context.userId);
    let q = context.supabase
      .from("rental_listings")
      .select("id, title, description, city, address, price, price_period, price_per_day, price_per_month, utilities_included, area_sqm, amenities, images, contact_phone, contact_email, owner_id, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 24);
    if (data.city) q = q.eq("city", data.city);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const listMyRentals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rental_listings")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

const rentalInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(160),
  description: z.string().max(4000).optional(),
  city: z.string().max(80).optional(),
  address: z.string().max(240).optional(),
  price: z.number().min(0).max(100000),
  price_period: z.enum(["hour", "day", "month"]),
  price_per_day: z.number().min(0).max(100000).optional(),
  price_per_month: z.number().min(0).max(1000000).optional(),
  utilities_included: z.boolean().optional(),
  area_sqm: z.number().min(0).max(10000).optional(),
  amenities: z.array(z.string()).max(30).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  contact_phone: z.string().max(40).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const upsertRental = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rentalInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertB2B(context.userId);
    const payload = {
      ...data,
      owner_id: context.userId,
      contact_email: data.contact_email || null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("rental_listings").update(payload).eq("id", data.id).eq("owner_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("rental_listings").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteRental = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rental_listings").delete().eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Send inquiry to owner — persist to rental_inquiries + notification
export const sendRentalInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rental_id: string; message: string }) =>
    z.object({ rental_id: z.string().uuid(), message: z.string().min(3).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertB2B(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rental } = await supabaseAdmin.from("rental_listings").select("owner_id, title").eq("id", data.rental_id).maybeSingle();
    if (!rental) throw new Error("Skelbimas nerastas");
    if (rental.owner_id === context.userId) throw new Error("Negalima siųsti užklausos sau");

    const { data: inq, error } = await supabaseAdmin.from("rental_inquiries").insert({
      rental_id: data.rental_id,
      sender_id: context.userId,
      owner_id: rental.owner_id,
      message: data.message,
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: rental.owner_id,
      type: "rental_inquiry" as any,
      payload: {
        inquiry_id: inq?.id,
        rental_id: data.rental_id,
        rental_title: rental.title,
        actor_id: context.userId,
        excerpt: data.message.slice(0, 240),
      } as any,
    });
    return { ok: true, inquiry_id: inq?.id };
  });

// List inquiries received by the owner (or sent by the user)
export const listRentalInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { box?: "inbox" | "sent" } | undefined) =>
    z.object({ box: z.enum(["inbox", "sent"]).default("inbox") }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const filterCol = data.box === "sent" ? "sender_id" : "owner_id";
    const { data: rows, error } = await supabaseAdmin
      .from("rental_inquiries")
      .select("id, rental_id, sender_id, owner_id, message, status, created_at, rental_listings(title, city), sender:profiles!rental_inquiries_sender_id_fkey(business_name, owner_name, avatar_url, phone, email, city)")
      .eq(filterCol, context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const markInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "new" | "read" | "handled" | "archived" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "read", "handled", "archived"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rental_inquiries")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
