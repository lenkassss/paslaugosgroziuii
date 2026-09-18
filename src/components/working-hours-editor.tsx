import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Copy, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { getMyWorkingHours, setWorkingHours } from "@/lib/platform.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toastError } from "@/lib/error-messages";

const DAYS = ["Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis", "Sekmadienis"];
const SHORT = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];

type Row = { weekday: number; start_time: string; end_time: string; is_closed: boolean };

/** Monday-first row index → DB weekday (0 = Sunday, JS getDay()). */
const dbWeekday = (i: number) => (i + 1) % 7;
const hhmm = (v?: string | null) => (v ? v.slice(0, 5) : "09:00");

function defaults(): Row[] {
  return Array.from({ length: 7 }, (_, i) => ({
    weekday: dbWeekday(i),
    start_time: "09:00",
    end_time: "18:00",
    is_closed: i >= 5,
  }));
}

/**
 * Luxury working-hours editor for salons and individual masters.
 * Salon owners edit the venue schedule; staff members edit their own.
 */
export function WorkingHoursEditor() {
  const qc = useQueryClient();
  const load = useServerFn(getMyWorkingHours);
  const save = useServerFn(setWorkingHours);
  const { data, isLoading } = useQuery({ queryKey: ["my-working-hours"], queryFn: () => load() });
  const [rows, setRows] = useState<Row[]>(defaults());

  useEffect(() => {
    if (!data) return;
    setRows(
      Array.from({ length: 7 }, (_, i) => {
        const wd = dbWeekday(i);
        const found = (data.hours ?? []).find((h: any) => h.weekday === wd);
        return found
          ? { weekday: wd, start_time: hhmm(found.start_time), end_time: hhmm(found.end_time), is_closed: !!found.is_closed }
          : { weekday: wd, start_time: "09:00", end_time: "18:00", is_closed: i >= 5 };
      }),
    );
  }, [data]);

  const patch = (i: number, next: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...next } : r)));

  const copyFirst = () => {
    const first = rows[0]!;
    setRows((prev) => prev.map((r, i) => (i === 0 ? r : { ...r, start_time: first.start_time, end_time: first.end_time })));
    toast.success("Pirmadienio laikas nukopijuotas");
  };

  const mutation = useMutation({
    mutationFn: () => {
      const invalid = rows.find((r) => !r.is_closed && r.start_time >= r.end_time);
      if (invalid) throw new Error("Darbo dienos pabaiga turi būti vėlesnė už pradžią.");
      return save({ data: { hours: rows.map((r) => ({ ...r, start_time: `${r.start_time}:00`, end_time: `${r.end_time}:00` })) } });
    },
    onSuccess: () => {
      toast.success("Darbo laikas išsaugotas");
      qc.invalidateQueries({ queryKey: ["my-working-hours"] });
      qc.invalidateQueries({ queryKey: ["salon-public"] });
      // Kortelės, paieška ir kalendorius rodo tą patį grafiką — atnaujinam iškart.
      qc.invalidateQueries({ queryKey: ["home"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: ["market-availability"] });
      qc.invalidateQueries({ queryKey: ["last-minute"] });
      qc.invalidateQueries({ queryKey: ["salon-calendar"] });

    },
    onError: (e: any) => toastError(e, "Nepavyko išsaugoti"),
  });

  const openDays = rows.filter((r) => !r.is_closed).length;

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-secondary/60 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
            <Clock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg leading-tight">Darbo laikas</h3>
            <p className="truncate text-[11px] text-muted-foreground">
              {data?.scope === "staff" ? "Tavo asmeninis grafikas" : "Salono grafikas"} · {openDays} d./sav.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl active:scale-95" onClick={copyFirst}>
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Kopijuoti
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Kraunama…
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {rows.map((r, i) => (
            <div
              key={r.weekday}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors sm:px-5 ${r.is_closed ? "bg-muted/30" : ""}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-card text-[11px] font-semibold uppercase">
                  {SHORT[i]}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{DAYS[i]}</div>
                  {r.is_closed ? (
                    <div className="text-[11px] font-medium text-destructive">Nedirbama</div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Input
                        type="time"
                        step={900}
                        value={r.start_time}
                        onChange={(e) => patch(i, { start_time: e.target.value })}
                        className="h-9 w-[6.5rem] min-w-0 rounded-lg px-2 text-xs"
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        step={900}
                        value={r.end_time}
                        onChange={(e) => patch(i, { end_time: e.target.value })}
                        className="h-9 w-[6.5rem] min-w-0 rounded-lg px-2 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
              <Switch checked={!r.is_closed} onCheckedChange={(v) => patch(i, { is_closed: !v })} aria-label={DAYS[i]} />
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border/60 bg-secondary/40 p-4 sm:p-5">
        <Button
          type="button"
          className="h-12 w-full active:scale-95"
          disabled={mutation.isPending || isLoading}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Išsaugoti darbo laiką
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Šis grafikas nustato, kokie laikai bus rodomi klientams rezervuojant.
        </p>
      </div>
    </Card>
  );
}
