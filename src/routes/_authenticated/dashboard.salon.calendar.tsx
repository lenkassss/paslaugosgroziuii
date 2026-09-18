import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProGate } from "@/components/pro-gate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSalonDashboard } from "@/lib/platform.functions";
import { listMyStaff } from "@/lib/staff.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { addDays, addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { lt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppointmentModal, type ApptRow } from "@/components/appointment-modal";
import { BookingCutoffCard } from "@/components/booking-cutoff-card";


export const Route = createFileRoute("/_authenticated/dashboard/salon/calendar")({
  component: CalendarPage,
});

type ViewMode = "day" | "week" | "month";
const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i); // 07-21
const SLOT_MIN = 15;

function CalendarPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<ViewMode>("day");
  const [anchor, setAnchor] = useState(new Date());
  const [selected, setSelected] = useState<ApptRow | null>(null);
  const [staffFilter, setStaffFilter] = useState<string>("all");

  const { data } = useQuery({
    queryKey: ["salon-dashboard"],
    queryFn: () => getSalonDashboard({ data: undefined }),
  });
  const isOwner = !data?.staff;
  const staffListFn = useServerFn(listMyStaff);
  const staffQ = useQuery({
    queryKey: ["my-staff"],
    queryFn: () => staffListFn(),
    enabled: isOwner,
  });

  useEffect(() => {
    if (!user) return;
    const salonId = data?.staff?.salon_id ?? user.id;
    const ch = supabase.channel("appts-" + salonId)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `salon_id=eq.${salonId}` }, () => {
        qc.invalidateQueries({ queryKey: ["salon-dashboard"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc, data?.staff?.salon_id]);

  const allAppts = (data?.appointments ?? []) as ApptRow[];
  const appts = useMemo(() => {
    if (!isOwner || staffFilter === "all") return allAppts;
    if (staffFilter === "unassigned") return allAppts.filter((a: any) => !a.staff_id);
    return allAppts.filter((a: any) => a.staff_id === staffFilter);
  }, [allAppts, isOwner, staffFilter]);

  const goPrev = () => setAnchor(view === "day" ? addDays(anchor, -1) : view === "week" ? addDays(anchor, -7) : addMonths(anchor, -1));
  const goNext = () => setAnchor(view === "day" ? addDays(anchor, 1) : view === "week" ? addDays(anchor, 7) : addMonths(anchor, 1));

  const title = view === "day"
    ? format(anchor, "EEEE, d MMMM y", { locale: lt })
    : view === "week"
      ? `${format(startOfWeek(anchor, { weekStartsOn: 1 }), "MMM d", { locale: lt })} – ${format(addDays(startOfWeek(anchor, { weekStartsOn: 1 }), 6), "MMM d, y", { locale: lt })}`
      : format(anchor, "LLLL y", { locale: lt });

  return (
    <DashboardShell>
      <ProGate feature="kalendorius">
      <div className="mb-5 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl">{data?.staff ? "Mano kalendorius" : "Kalendorius"}</h1>
          <div className="text-sm text-muted-foreground mt-1 capitalize">{title}</div>
        </div>
        <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {isOwner && (staffQ.data?.staff?.length ?? 0) > 0 && (
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-1 rounded-lg border bg-secondary/40 p-0.5 sm:inline-flex">
              <Users className="ml-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="min-w-0 bg-transparent px-2 py-2 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="all">Visos meistrės</option>
                <option value="unassigned">Nepriskirti</option>
                {(staffQ.data?.staff ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.staff_name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 rounded-lg border bg-secondary/40 p-0.5">
            {(["day","week","month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`min-h-10 px-3 py-1.5 text-xs rounded-md font-medium transition ${view === v ? "gradient-gold text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >{v === "day" ? "Diena" : v === "week" ? "Savaitė" : "Mėnuo"}</button>
            ))}
          </div>
          <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] gap-1 sm:inline-grid sm:grid-cols-[2.75rem_auto_2.75rem]">
            <Button variant="outline" size="icon" className="h-11 w-11" onClick={goPrev} aria-label="Ankstesnis laikotarpis"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" className="h-11" onClick={() => setAnchor(new Date())}>Šiandien</Button>
            <Button variant="outline" size="icon" className="h-11 w-11" onClick={goNext} aria-label="Kitas laikotarpis"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {view === "day" && (
        <DayStrip anchor={anchor} appts={allAppts} onPick={setAnchor} />
      )}

      {view === "week" && <WeekView anchor={anchor} appts={appts} onSelect={setSelected} onSelectDate={(date) => { setAnchor(date); setView("day"); }} />}
      {view === "day" && (
        <TeamDayGrid
          anchor={anchor}
          appts={appts}
          columns={
            isOwner
              ? (staffFilter === "all"
                  ? [
                      ...(staffQ.data?.staff ?? []).map((s: any) => ({ id: s.id as string, name: s.staff_name as string })),
                      { id: "unassigned", name: "Nepriskirti" },
                    ]
                  : staffFilter === "unassigned"
                    ? [{ id: "unassigned", name: "Nepriskirti" }]
                    : [{ id: staffFilter, name: (staffQ.data?.staff ?? []).find((s: any) => s.id === staffFilter)?.staff_name ?? "Meistrė" }])
              : [{ id: "__me", name: "Mano vizitai" }]
          }
          onSelect={setSelected}
        />
      )}
      {view === "month" && <MonthView anchor={anchor} appts={appts} onSelectDate={(d) => { setAnchor(d); setView("day"); }} />}

      <BookingCutoffCard date={anchor} staffId={isOwner && staffFilter !== "all" && staffFilter !== "unassigned" ? staffFilter : null} />

      <AppointmentModal appt={selected} open={!!selected} onClose={() => setSelected(null)} />

      </ProGate>
    </DashboardShell>
  );
}

function toMin(t: string) { const [h,m] = t.split(":").map(Number); return h*60+m; }

function ApptChip({ a, onClick, compact = false }: { a: ApptRow; onClick: () => void; compact?: boolean }) {
  const cancelled = a.status === "cancelled";
  const completed = a.status === "completed";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full text-left rounded-md px-2 py-1 shadow-sm text-[11px] leading-tight truncate transition hover:scale-[1.02] hover:shadow-md ${
        cancelled ? "bg-destructive/20 text-destructive line-through" :
        completed ? "bg-secondary text-muted-foreground" :
        "gradient-gold text-primary-foreground"
      }`}
      title={`${a.time_slot.slice(0,5)} · ${a.client_name} · ${a.service_name}`}
    >
      <div className="font-semibold">{a.time_slot.slice(0,5)} {!compact && `· ${a.duration_mins}min`}</div>
      <div className="truncate">{a.client_name}</div>
      {!compact && <div className="truncate opacity-90">{a.service_name}</div>}
    </button>
  );
}

function MobileAgenda({ days, appts, onSelect, onSelectDate }: { days: Date[]; appts: ApptRow[]; onSelect: (a: ApptRow) => void; onSelectDate: (date: Date) => void }) {
  const today = new Date();
  const byDay = useMemo(() => {
    const map: Record<string, ApptRow[]> = {};
    for (const appointment of appts) (map[appointment.appointment_date] ??= []).push(appointment);
    return map;
  }, [appts]);

  return (
    <div className="space-y-3 md:hidden">
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = (byDay[key] ?? []).filter((appointment) => appointment.status !== "cancelled").length;
          return (
            <Button key={key} variant={isSameDay(day, today) ? "default" : "outline"} onClick={() => onSelectDate(day)} className="h-auto w-[4.35rem] shrink-0 snap-start flex-col gap-0.5 rounded-xl px-2 py-2.5">
              <span className="text-[10px] uppercase opacity-70">{format(day, "EEE", { locale: lt })}</span>
              <span className="font-display text-lg leading-none">{format(day, "d")}</span>
              <span className="text-[10px] opacity-70">{count ? `${count} viz.` : "Laisva"}</span>
            </Button>
          );
        })}
      </div>
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const items = (byDay[key] ?? []).sort((a, b) => a.time_slot.localeCompare(b.time_slot));
        if (!items.length) return null;
        return (
          <Card key={key} className="overflow-hidden p-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 bg-secondary/40 px-4 py-3">
              <div className="min-w-0 truncate text-sm font-semibold capitalize">{format(day, "EEEE, MMMM d", { locale: lt })}</div>
              <Badge variant="secondary" className="shrink-0">{items.length}</Badge>
            </div>
            <div className="divide-y divide-border/60">
              {items.map((appointment) => (
                <Button key={appointment.id} variant="ghost" onClick={() => onSelect(appointment)} className="grid h-auto w-full grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-none px-4 py-3 text-left">
                  <span className="font-display text-lg">{appointment.time_slot.slice(0, 5)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{appointment.client_name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{appointment.service_name} · {appointment.duration_mins} min</span>
                  </span>
                  <Badge variant={appointment.status === "cancelled" ? "destructive" : appointment.status === "completed" ? "secondary" : "default"} className="shrink-0 text-[9px]">
                    {appointment.status === "confirmed" ? "OK" : appointment.status === "cancelled" ? "ATŠ" : appointment.status === "completed" ? "✓" : appointment.status}
                  </Badge>
                </Button>
              ))}
            </div>
          </Card>
        );
      })}
      {!days.some((day) => (byDay[format(day, "yyyy-MM-dd")] ?? []).length > 0) && (
        <Card className="p-8 text-center text-sm text-muted-foreground">Šiuo laikotarpiu vizitų nėra.</Card>
      )}
    </div>
  );
}

function WeekView({ anchor, appts, onSelect, onSelectDate }: { anchor: Date; appts: ApptRow[]; onSelect: (a: ApptRow) => void; onSelectDate: (date: Date) => void }) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  const startMin = HOURS[0]*60;

  const byDay = useMemo(() => {
    const map: Record<string, ApptRow[]> = {};
    for (const a of appts) (map[a.appointment_date] ??= []).push(a);
    return map;
  }, [appts]);

  return (
    <>
      <MobileAgenda days={days} appts={appts} onSelect={onSelect} onSelectDate={onSelectDate} />
      <Card className="hidden overflow-hidden md:block">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-secondary/40 sticky top-0 z-10">
            <div />
            {days.map((d) => {
              const isToday = isSameDay(d, now);
              const weekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={d.toISOString()} className={`p-2 text-center border-l ${weekend ? "bg-secondary/60" : ""}`}>
                  <div className="text-[10px] text-muted-foreground uppercase">{format(d, "EEE", { locale: lt })}</div>
                  <div className={`font-display text-lg ${isToday ? "text-primary font-bold" : ""}`}>{format(d, "d")}</div>
                </div>
              );
            })}
          </div>
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} className="grid grid-cols-[60px_repeat(7,1fr)] border-b h-[72px]">
                <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 -mt-2">{h}:00</div>
                {days.map((d) => {
                  const key = format(d, "yyyy-MM-dd");
                  const items = (byDay[key] ?? []).filter((a) => Math.floor(toMin(a.time_slot)/60) === h);
                  const weekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={key + h} className={`border-l relative ${weekend ? "bg-secondary/20" : ""}`}>
                      {[15,30,45].map((m) => (
                        <div key={m} className="absolute left-0 right-0 border-t border-border/30" style={{ top: (m/60)*72 }} />
                      ))}
                      <div className="p-0.5 space-y-0.5 relative z-[1]">
                        {items.map((a) => (
                          <ApptChip key={a.id} a={a} onClick={() => onSelect(a)} compact />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {/* current time line */}
            {days.some((d) => isSameDay(d, now)) && nowMin >= startMin && nowMin <= (HOURS[HOURS.length-1]+1)*60 && (
              <div className="absolute left-[60px] right-0 pointer-events-none z-[2]" style={{ top: (nowMin - startMin) * (72/60) }}>
                <div className="h-0.5 bg-destructive relative">
                  <div className="absolute -left-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </Card>
    </>
  );
}

/** Savaitės dienų juosta (kaip Treatwell) – greitas dienos pasirinkimas. */
function DayStrip({ anchor, appts, onPick }: { anchor: Date; appts: ApptRow[]; onPick: (d: Date) => void }) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of appts) if (a.status !== "cancelled") map[a.appointment_date] = (map[a.appointment_date] ?? 0) + 1;
    return map;
  }, [appts]);

  return (
    <div className="mb-3 grid grid-cols-7 gap-1 rounded-2xl border bg-secondary/30 p-1.5">
      {days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const on = isSameDay(d, anchor);
        const isToday = isSameDay(d, today);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPick(d)}
            className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition ${
              on ? "gradient-gold text-primary-foreground shadow" : "hover:bg-background"
            }`}
          >
            <span className="text-[10px] uppercase opacity-70">{format(d, "EEEEE", { locale: lt })}</span>
            <span className={`font-display text-base leading-none ${!on && isToday ? "text-primary" : ""}`}>{format(d, "d")}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${counts[key] ? (on ? "bg-primary-foreground" : "bg-primary") : "bg-transparent"}`} />
          </button>
        );
      })}
    </div>
  );
}

/** Dienos tinklelis su meistrių stulpeliais – vizitai išdėstyti pagal laiką. */
function TeamDayGrid({
  anchor, appts, columns, onSelect,
}: {
  anchor: Date;
  appts: ApptRow[];
  columns: Array<{ id: string; name: string }>;
  onSelect: (a: ApptRow) => void;
}) {
  const key = format(anchor, "yyyy-MM-dd");
  const list = useMemo(
    () => appts.filter((a) => a.appointment_date === key).sort((a, b) => a.time_slot.localeCompare(b.time_slot)),
    [appts, key],
  );
  const now = new Date();
  const isToday = isSameDay(anchor, now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Dienos rėžis: nuo ankstyviausio iki vėliausio vizito, bet ne mažiau nei 8–20.
  const bounds = useMemo(() => {
    let from = 8 * 60;
    let to = 20 * 60;
    for (const a of list) {
      from = Math.min(from, toMin(a.time_slot));
      to = Math.max(to, toMin(a.time_slot) + (a.duration_mins || 60));
    }
    return { fromH: Math.max(0, Math.floor(from / 60)), toH: Math.min(24, Math.ceil(to / 60)) };
  }, [list]);
  const hours = Array.from({ length: bounds.toH - bounds.fromH }, (_, i) => bounds.fromH + i);
  const startMin = bounds.fromH * 60;
  const HOUR_PX = 68;
  const perMin = HOUR_PX / 60;
  const cols = columns.length ? columns : [{ id: "__me", name: "Vizitai" }];

  const colAppts = (colId: string) =>
    list.filter((a: any) =>
      colId === "__me" ? true : colId === "unassigned" ? !a.staff_id : a.staff_id === colId,
    );

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <div style={{ minWidth: cols.length > 1 ? 56 + cols.length * 150 : undefined }}>
          {/* Stulpelių antraštės */}
          <div
            className="sticky top-0 z-20 grid border-b bg-background/95 backdrop-blur"
            style={{ gridTemplateColumns: `56px repeat(${cols.length}, minmax(0,1fr))` }}
          >
            <div className="border-r py-2 text-center text-[10px] uppercase text-muted-foreground">Laikas</div>
            {cols.map((c) => (
              <div key={c.id} className="min-w-0 border-r px-2 py-2 last:border-r-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full gradient-gold text-[11px] font-semibold text-primary-foreground">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate text-xs font-semibold">{c.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tinklelis */}
          <div className="relative" style={{ height: hours.length * HOUR_PX }}>
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-border/70" style={{ top: i * HOUR_PX, height: HOUR_PX }}>
                <div className="absolute left-0 top-0 w-[56px] pr-2 pt-1 text-right text-[10px] text-muted-foreground">{String(h).padStart(2, "0")}:00</div>
                <div className="absolute left-[56px] right-0 border-t border-dashed border-border/40" style={{ top: HOUR_PX / 2 }} />
              </div>
            ))}
            <div
              className="absolute inset-y-0 left-0 right-0 grid"
              style={{ gridTemplateColumns: `56px repeat(${cols.length}, minmax(0,1fr))` }}
            >
              <div className="border-r border-border/70" />
              {cols.map((c) => (
                <div key={c.id} className="relative border-r border-border/70 last:border-r-0">
                  {colAppts(c.id).map((a) => {
                    const top = (toMin(a.time_slot) - startMin) * perMin;
                    const height = Math.max((a.duration_mins || 60) * perMin - 2, 26);
                    const cancelled = a.status === "cancelled";
                    const completed = a.status === "completed";
                    return (
                      <button
                        key={a.id}
                        onClick={() => onSelect(a)}
                        style={{ top, height }}
                        className={`absolute left-1 right-1 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left shadow-sm transition hover:shadow-md ${
                          cancelled
                            ? "border-destructive bg-destructive/15 text-destructive line-through"
                            : completed
                              ? "border-border bg-secondary text-muted-foreground"
                              : "border-primary bg-primary/10 text-foreground"
                        }`}
                      >
                        <div className="truncate text-[11px] font-semibold">{a.time_slot.slice(0, 5)} · {a.client_name}</div>
                        <div className="truncate text-[10px] opacity-80">{a.service_name}</div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            {isToday && nowMin >= startMin && nowMin <= bounds.toH * 60 && (
              <div className="pointer-events-none absolute left-[56px] right-0 z-10" style={{ top: (nowMin - startMin) * perMin }}>
                <div className="relative h-0.5 bg-destructive">
                  <span className="absolute -left-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {list.length === 0 && (
        <div className="border-t p-6 text-center text-sm text-muted-foreground">Šią dieną vizitų nėra.</div>
      )}
    </Card>
  );
}

function MonthView({ anchor, appts, onSelectDate }: { anchor: Date; appts: ApptRow[]; onSelectDate: (d: Date) => void }) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = startOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 7;
  const cells = Array.from({ length: totalDays }, (_, i) => addDays(start, i));
  const now = new Date();
  const byDay = useMemo(() => {
    const map: Record<string, ApptRow[]> = {};
    for (const a of appts) (map[a.appointment_date] ??= []).push(a);
    return map;
  }, [appts]);

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-secondary/40 text-center text-[11px] uppercase text-muted-foreground">
        {["Pr","An","Tr","Kt","Pn","Št","Sk"].map((d) => <div key={d} className="p-2 border-l first:border-l-0">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const items = byDay[key] ?? [];
          const inMonth = isSameMonth(d, anchor);
          const isToday = isSameDay(d, now);
          const active = items.filter((a) => a.status !== "cancelled").length;
          return (
            <button
              key={key}
              onClick={() => onSelectDate(d)}
              className={`min-h-14 border-l border-t p-1.5 text-left transition hover:bg-secondary/40 sm:min-h-[76px] sm:p-2 md:min-h-[92px] ${!inMonth ? "opacity-40" : ""} ${isToday ? "bg-primary/5" : ""}`}
            >
              <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{format(d, "d")}</div>
              {active > 0 && (
                <div className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full gradient-gold px-1.5 text-[9px] text-primary-foreground sm:text-[10px]">
                  {active}<span className="hidden sm:inline">&nbsp;viz.</span>
                </div>
              )}
              <div className="mt-1 flex flex-wrap gap-0.5">
                {items.slice(0, 6).map((a) => (
                  <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${a.status === "cancelled" ? "bg-destructive/40" : "bg-primary"}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
