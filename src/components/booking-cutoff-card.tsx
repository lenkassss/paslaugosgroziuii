import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { Lock, Unlock, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { closeBookingsFrom, listBookingCutoffs, reopenBookings } from "@/lib/cutoff.functions";
import { localNow } from "@/lib/availability-time";

/** 07:00–22:00 kas 30 min. */
const TIMES = Array.from({ length: 31 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

/**
 * Realaus laiko registracijų uždarymas: pasirenkama diena (iš kalendoriaus)
 * ir laikas – nuo jo iki dienos galo naujos registracijos nebepriimamos.
 */
export function BookingCutoffCard({ date, staffId }: { date: Date; staffId?: string | null }) {
  const qc = useQueryClient();
  const dateStr = format(date, "yyyy-MM-dd");
  const listFn = useServerFn(listBookingCutoffs);
  const closeFn = useServerFn(closeBookingsFrom);
  const reopenFn = useServerFn(reopenBookings);

  const now = localNow();
  const defaultTime = useMemo(() => {
    if (dateStr !== now.date) return "09:00";
    const next = TIMES.find((t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m >= now.minutes;
    });
    return next ?? "22:00";
  }, [dateStr, now.date, now.minutes]);
  const [time, setTime] = useState(defaultTime);

  const q = useQuery({
    queryKey: ["booking-cutoffs", dateStr],
    queryFn: () => listFn({ data: { date: dateStr } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["booking-cutoffs", dateStr] });
    qc.invalidateQueries({ queryKey: ["salon-dashboard"] });
  };

  const close = useMutation({
    mutationFn: () => closeFn({ data: { date: dateStr, from_time: time, staff_id: staffId ?? null } }),
    onSuccess: () => { toast.success(`Registracijos uždarytos nuo ${time}`); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Nepavyko uždaryti"),
  });

  const reopen = useMutation({
    mutationFn: (blockId: string) => reopenFn({ data: { blockId } }),
    onSuccess: () => { toast.success("Registracijos vėl atidarytos"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Nepavyko atidaryti"),
  });

  const blocks = q.data?.blocks ?? [];

  return (
    <Card className="mt-4 p-4">
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-cyclamen" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Uždaryti registracijas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pasirinkta diena: <span className="font-medium capitalize">{format(date, "EEEE, MMMM d", { locale: lt })}</span>.
            Pasirink laiką — nuo jo iki dienos galo klientai nebegalės registruotis.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:flex sm:items-center">
        <div className="inline-flex min-w-0 items-center gap-1 rounded-lg border bg-secondary/40 p-0.5">
          <Clock className="ml-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="min-w-0 cursor-pointer bg-transparent px-2 py-2 text-sm font-medium outline-none"
            aria-label="Uždaryti nuo"
          >
            {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Button className="h-11" onClick={() => close.mutate()} disabled={close.isPending}>
          {close.isPending ? "Uždaroma…" : `Uždaryti nuo ${time}`}
        </Button>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => { setTime(defaultTime); close.mutate(); }}
          disabled={close.isPending || dateStr !== now.date}
        >
          Uždaryti likusią dieną
        </Button>
      </div>

      {blocks.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground">Uždaryti / užimti laikai šią dieną</p>
          {blocks.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border bg-secondary/30 px-3 py-2">
              <div className="min-w-0">
                <span className="text-sm font-medium">{String(b.start_time).slice(0, 5)}–{String(b.end_time).slice(0, 5)}</span>
                {b.reason && <Badge variant="secondary" className="ml-2 align-middle text-[10px]">{b.reason}</Badge>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 shrink-0"
                onClick={() => reopen.mutate(b.id)}
                disabled={reopen.isPending}
              >
                <Unlock className="mr-1 h-3.5 w-3.5" /> Atidaryti
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
