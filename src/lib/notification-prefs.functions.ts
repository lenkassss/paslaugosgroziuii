import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const prefsSchema = z.object({
  notify_bookings: z.boolean(),
  notify_messages: z.boolean(),
  notify_payments: z.boolean(),
  notify_marketing: z.boolean(),
  notify_email: z.boolean(),
});

export type NotificationPrefs = z.infer<typeof prefsSchema>;

export const getNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("notify_bookings, notify_messages, notify_payments, notify_marketing, notify_email, owner_name, phone, city, avatar_url, email")
      .eq("id", context.userId)
      .maybeSingle();

    const prefs: NotificationPrefs = {
      notify_bookings: data?.notify_bookings ?? true,
      notify_messages: data?.notify_messages ?? true,
      notify_payments: data?.notify_payments ?? true,
      notify_marketing: data?.notify_marketing ?? false,
      notify_email: data?.notify_email ?? true,
    };

    return {
      prefs,
      profile: {
        owner_name: data?.owner_name ?? "",
        phone: data?.phone ?? "",
        city: data?.city ?? "",
        avatar_url: data?.avatar_url ?? null,
        email: data?.email ?? "",
      },
    };
  });

export const updateNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => prefsSchema.partial().parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const registerPushDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ token: z.string().min(10).max(500), platform: z.enum(["ios", "android", "web"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_devices").upsert(
      {
        user_id: context.userId,
        token: data.token,
        platform: data.platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unregisterPushDevices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("push_devices").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const listPushDevices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("push_devices")
      .select("id, platform, created_at")
      .order("created_at", { ascending: false });
    return { devices: data ?? [] };
  });
