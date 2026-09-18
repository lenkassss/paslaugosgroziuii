import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { earliestBookableMinute } from "@/lib/availability-time";

type BookingRequest = {
  salonId: string;
  date: string;
  time: string;
  duration: number;
  staffId?: string | null;
  excludeAppointmentId?: string;
};

const minutes = (value: string) => {
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  return hour * 60 + minute;
};

export async function validateBookingSlot(
  client: SupabaseClient<Database>,
  request: BookingRequest,
) {
  const day = new Date(`${request.date}T12:00:00`).getDay();
  const [profileResult, staffResult] = await Promise.all([
    client
      .from("profiles")
      .select("min_advance_mins, same_day_closed_on, membership_level, subscription_active")
      .eq("id", request.salonId)
      .maybeSingle(),
    request.staffId
      ? client
          .from("salon_staff")
          .select("id")
          .eq("id", request.staffId)
          .eq("salon_id", request.salonId)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const profile = profileResult.data;
  if (!profile?.subscription_active || profile.membership_level !== "pro") {
    throw new Error("Rezervacijoms reikalinga aktyvi PRO narystė.");
  }
  if (request.staffId && !staffResult.data) throw new Error("Pasirinkta meistrė nebedirba šiame salone.");

  let hoursQuery = client
    .from("working_hours")
    .select("start_time, end_time, is_closed")
    .eq("salon_id", request.salonId)
    .eq("weekday", day);
  hoursQuery = request.staffId ? hoursQuery.eq("staff_id", request.staffId) : hoursQuery.is("staff_id", null);
  let hours = (await hoursQuery.maybeSingle()).data;
  if (!hours && request.staffId) {
    hours = (
      await client
        .from("working_hours")
        .select("start_time, end_time, is_closed")
        .eq("salon_id", request.salonId)
        .eq("weekday", day)
        .is("staff_id", null)
        .maybeSingle()
    ).data;
  }
  if (!hours || hours.is_closed) throw new Error("Pasirinktą dieną registracijos nepriimamos.");

  const start = minutes(request.time);
  const end = start + request.duration;
  const earliest = earliestBookableMinute({
    date: request.date,
    minAdvanceMins: profile.min_advance_mins ?? 60,
    sameDayClosedOn: profile.same_day_closed_on,
  });
  if (earliest === null || start < earliest) {
    throw new Error("Šis laikas jau praėjo arba liko per mažai laiko iki vizito.");
  }
  if (start < minutes(hours.start_time) || end > minutes(hours.end_time)) {
    throw new Error("Pasirinktas laikas nepatenka į darbo valandas.");
  }

  let appointmentsQuery = client
    .from("appointments")
    .select("id, time_slot, duration_mins, staff_id")
    .eq("salon_id", request.salonId)
    .eq("appointment_date", request.date)
    .in("status", ["pending", "confirmed"]);
  if (request.staffId) appointmentsQuery = appointmentsQuery.eq("staff_id", request.staffId);
  if (request.excludeAppointmentId) appointmentsQuery = appointmentsQuery.neq("id", request.excludeAppointmentId);

  let blocksQuery = client
    .from("time_blocks")
    .select("start_time, end_time, staff_id")
    .eq("salon_id", request.salonId)
    .eq("block_date", request.date);
  blocksQuery = request.staffId
    ? blocksQuery.or(`staff_id.eq.${request.staffId},staff_id.is.null`)
    : blocksQuery.is("staff_id", null);

  const [appointments, blocks] = await Promise.all([appointmentsQuery, blocksQuery]);
  const conflicts = [
    ...(appointments.data ?? []).map((item) => [minutes(item.time_slot), minutes(item.time_slot) + item.duration_mins]),
    ...(blocks.data ?? []).map((item) => [minutes(item.start_time), minutes(item.end_time)]),
  ].some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart);

  if (conflicts) throw new Error("Šį laiką ką tik užėmė arba uždarė salonas. Pasirinkite kitą laiką.");
  return { valid: true as const };
}