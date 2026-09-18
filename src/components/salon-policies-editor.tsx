import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSalonDashboard } from "@/lib/platform.functions";
import { updateSalonPolicies, updateBookingRules } from "@/lib/policies.functions";
import { MIN_ADVANCE_OPTIONS, localNow } from "@/lib/availability-time";
import { AMENITIES, CANCEL_FEES, CANCEL_WINDOWS } from "@/lib/amenities";
import {
  Car, Wifi, Coffee, Accessibility, PawPrint, CreditCard, Baby, Wind, Music, ShowerHead,
  Loader2, Save, ShieldCheck, Sparkle, CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  car: Car, wifi: Wifi, coffee: Coffee, accessibility: Accessibility, pawprint: PawPrint,
  "credit-card": CreditCard, baby: Baby, wind: Wind, music: Music, "shower-head": ShowerHead,
};

export function SalonPoliciesEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["salon-dashboard"], queryFn: () => getSalonDashboard({ data: undefined }) });
  const save = useServerFn(updateSalonPolicies);

  const [app, setApp] = useState(true);
  const [onsite, setOnsite] = useState(true);
  const [feePct, setFeePct] = useState(0);
  const [windowMins, setWindowMins] = useState(1440);
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    const p = data?.profile as Record<string, unknown> | undefined;
    if (!p) return;
    setApp(p['accept_app_payments'] !== false);
    setOnsite(p['accept_onsite_payments'] !== false);
    setFeePct(Number(p['cancellation_fee_percent'] ?? 0));
    setWindowMins(Number(p['cancellation_window_mins'] ?? 1440));
    setAmenities(Array.isArray(p['amenities']) ? (p['amenities'] as string[]) : []);
  }, [data]);

  const mut = useMutation({
    mutationFn: () => save({ data: {
      accept_app_payments: app,
      accept_onsite_payments: onsite,
      cancellation_fee_percent: feePct,
      cancellation_window_mins: windowMins,
      amenities,
    } }),
    onSuccess: () => {
      toast.success("Nustatymai išsaugoti");
      qc.invalidateQueries({ queryKey: ["salon-dashboard"] });
    },
    onError: (e) => toastError(e),
  });

  const toggleAmenity = (key: string) =>
    setAmenities((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg">Atsiskaitymo būdai</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Pasirink, kaip klientai gali sumokėti. Jei įjungtas tik apmokėjimas aplikacijoje — rezervacija patvirtinama tik po apmokėjimo.
        </p>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Apmokėjimas aplikacijoje (kortele)</div>
              <div className="text-[11px] text-muted-foreground">Demo Stripe režimas · testinė kortelė 4242 4242 4242 4242</div>
            </div>
            <Switch checked={app} onCheckedChange={setApp} />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Atsiskaitymas vietoje</div>
              <div className="text-[11px] text-muted-foreground">Grynais arba kortele salone po procedūros</div>
            </div>
            <Switch checked={onsite} onCheckedChange={setOnsite} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg">Atšaukimo politika</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Apsauga nuo neatvykimų: jei klientas atšaukia per nurodytą laiką iki vizito, nuskaitomas pasirinktas procentas nuo paslaugos kainos.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Kada taikomas mokestis</Label>
            <Select value={String(windowMins)} onValueChange={(v) => setWindowMins(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CANCEL_WINDOWS.map((w) => <SelectItem key={w.mins} value={String(w.mins)}>{w.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mokesčio dydis</Label>
            <Select value={String(feePct)} onValueChange={(v) => setFeePct(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CANCEL_FEES.map((f) => <SelectItem key={f} value={String(f)}>{f === 0 ? "Be mokesčio" : `${f}% nuo kainos`}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-secondary/50 p-3 text-[11px] text-muted-foreground">
          {feePct === 0 || windowMins === 0
            ? "Šiuo metu mokestis netaikomas — klientai gali atšaukti bet kada be pasekmių."
            : `Klientas, atšaukęs ${CANCEL_WINDOWS.find((w) => w.mins === windowMins)?.label.toLowerCase() ?? ""}, sumokės ${feePct}% nuo paslaugos kainos.`}
        </p>
      </Card>

      <BookingRulesCard />

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkle className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg">Patogumai</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Pažymėti patogumai rodomi tavo viešame profilyje prabangiomis žymomis.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AMENITIES.map((a) => {
            const Icon = ICONS[a.icon] ?? Sparkle;
            const on = amenities.includes(a.key);
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => toggleAmenity(a.key)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-95 ${on ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${on ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 text-sm break-words">{a.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={() => mut.mutate()} disabled={mut.isPending} size="lg" className="gradient-gold text-primary-foreground btn-press shadow-elegant">
          {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Išsaugoti nustatymus
        </Button>
      </div>
    </div>
  );
}

/**
 * Rezervacijų taisyklės: minimalus išankstinis laikas ir vieno paspaudimo
 * „uždaryti šiandienos grafiką" (automatiškai atsistato rytoj).
 */
function BookingRulesCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["salon-dashboard"], queryFn: () => getSalonDashboard({ data: undefined }) });
  const save = useServerFn(updateBookingRules);

  const [minAdvance, setMinAdvance] = useState(60);
  const [closedToday, setClosedToday] = useState(false);

  useEffect(() => {
    const p = data?.profile as Record<string, unknown> | undefined;
    if (!p) return;
    setMinAdvance(Number(p['min_advance_mins'] ?? 60));
    setClosedToday(String(p['same_day_closed_on'] ?? "") === localNow().date);
  }, [data]);

  const mut = useMutation({
    mutationFn: (next: { min_advance_mins: number; close_today: boolean }) => save({ data: next }),
    onSuccess: () => {
      toast.success("Rezervacijų taisyklės atnaujintos");
      qc.invalidateQueries({ queryKey: ["salon-dashboard"] });
    },
    onError: (e) => toastError(e),
  });

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg">Rezervacijų taisyklės</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Nurodyk, kiek laiko prieš vizitą klientai dar gali rezervuoti. Praėję laikai niekada nerodomi.
      </p>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Minimalus išankstinis laikas</Label>
          <Select
            value={String(minAdvance)}
            onValueChange={(v) => { setMinAdvance(Number(v)); mut.mutate({ min_advance_mins: Number(v), close_today: closedToday }); }}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MIN_ADVANCE_OPTIONS.map((o) => <SelectItem key={o.mins} value={String(o.mins)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">Uždaryti šiandienos grafiką</div>
            <div className="text-[11px] text-muted-foreground">
              Iškart nutraukia šiandienos registracijas. Rytoj grafikas atsidaro automatiškai.
            </div>
          </div>
          <Switch
            checked={closedToday}
            onCheckedChange={(v) => { setClosedToday(v); mut.mutate({ min_advance_mins: minAdvance, close_today: v }); }}
          />
        </div>
      </div>
    </Card>
  );
}
