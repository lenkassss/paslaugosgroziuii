/**
 * Pranešimai administratoriams / super administratoriams.
 * Naudojama, kai pateikiama nauja anketa (skelbikas, skelbimas, tiekėjas, mokymai),
 * kad admin panelėje iškart matytume, ką reikia patvirtinti.
 */

export type AdminNotificationType =
  | "admin_classified_pending"
  | "admin_supplier_pending"
  | "admin_course_pending";

export async function notifyAdmins(type: AdminNotificationType, payload: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "super_admin"] as never);
    const ids = Array.from(new Set((admins ?? []).map((r) => r.user_id as string)));
    if (!ids.length) return;
    await supabaseAdmin
      .from("notifications")
      .insert(ids.map((user_id) => ({ user_id, type, payload: payload as never })));
  } catch {
    // Pranešimų klaida neturi sugriauti anketos pateikimo.
  }
}
