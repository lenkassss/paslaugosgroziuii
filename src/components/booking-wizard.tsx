import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PaymentCardPicker } from "@/components/payment-card-picker";
import { BookingCalendar } from "@/components/booking-calendar";
import { getAvailableSlots, bookAppointment } from "@/lib/platform.functions";
import { payAppointmentInApp, attachGuaranteeCard } from "@/lib/policies.functions";
import { fmtMoney, initials } from "@/lib/utils";
import { useAutoTranslate } from "@/lib/use-auto-translate";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, CreditCard, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

type Service = { id: string; name: string; price: number | string; duration_mins: number; category: string };
type Staff = { id: string; staff_name: string; specialization?: string | null; avatar_url?: string | null };

export function BookingWizard({
  open,
  onOpenChange,
  salonId,
  salonName,
  services,
  staff,
  acceptApp,
  acceptOnsite,
  feePercent,
  windowMins,
  onSuccess,
  initialServiceId,
  initialStaffId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  salonId: string;
  salonName: string;
  services: Service[];
  staff: Staff[];
  acceptApp: boolean;
  acceptOnsite: boolean;
  feePercent: number;
  windowMins: number;
  onSuccess: () => void;
  initialServiceId?: string | null;
  initialStaffId?: string | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(services[0]?.id ?? null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string | null>(null);
  const [payMode, setPayMode] = useState<"app" | "onsite">(acceptApp ? "app" : "onsite");
  const [cardId, setCardId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open) {
      setServiceId(initialServiceId ?? services[0]?.id ?? null);
      setStaffId(initialStaffId ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialServiceId, initialStaffId]);

  const service = services.find((s) => s.id === serviceId) ?? services[0] ?? null;
  const duration = service?.duration_mins ?? 60;
  const serviceNames = useAutoTranslate(services.map((s) => s.name));

  const { data: slotData, isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", salonId, date, duration, staffId],
    queryFn: () => getAvailableSlots({ data: { salonId, date, duration, staffId } }),
    enabled: open && step >= 1,
    // Praėję laikai turi išnykti realiu laiku, todėl atnaujiname kas minutę.
    staleTime: 15_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const book = useServerFn(bookAppointment);
  const payFn = useServerFn(payAppointmentInApp);
  const guaranteeFn = useServerFn(attachGuaranteeCard);

  const bookMut = useMutation({
    mutationFn: async () => {
      const res = await book({
        data: {
          salonId,
          serviceId: service!.id,
          serviceName: service!.name,
          duration: service!.duration_mins,
          clientName: name,
          clientPhone: phone,
          clientEmail: email || undefined,
          date,
          time: time!,
          confirmationChannel: email ? "email" : "sms",
          staffId,
        },
      });
      const apptId = res?.appointment?.id;
      if (apptId) {
        try {
          if (payMode === "app" && acceptApp) await payFn({ data: { appointmentId: apptId, ...(cardId ? { cardId } : {}) } });
          else if (feePercent > 0 && windowMins > 0 && cardId) await guaranteeFn({ data: { appointmentId: apptId, cardId } });
        } catch (e) {
          const msg = (e as Error).message;
          toast.error(msg === "NO_CARD" ? t("booking.payFailed") : msg);
        }
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slots"] });
      reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (e) => toastError(e),
  });

  function reset() {
    setStep(0);
    setTime(null);
    setName("");
    setPhone("");
    setEmail("");
  }

  const stepTitles = [t("booking.step1"), t("booking.step2"), t("booking.step3")];
  const canNext = useMemo(() => {
    if (step === 0) return !!service;
    if (step === 1) return !!time;
    return !!name.trim() && phone.trim().length >= 6;
  }, [step, service, time, name, phone]);

  const progress = ((step + 1) / 3) * 100;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
      className="sm:max-w-xl"
      title={
        <span className="block">
          <span className="block truncate text-base font-semibold sm:text-lg">{salonName}</span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            {t("booking.stepOf", { current: step + 1, total: 3 })} · {stepTitles[step]}
          </span>
        </span>
      }
      footer={
        <div className="grid w-full grid-cols-[auto_1fr] items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl"
            aria-label={t("booking.back")}
            disabled={step === 0 || bookMut.isPending}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {step < 2 ? (
            <Button
              disabled={!canNext}
              onClick={() => setStep((s) => Math.min(2, s + 1))}
              className="h-12 w-full rounded-2xl gradient-gold text-primary-foreground"
            >
              {t("booking.next")} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              disabled={!canNext || bookMut.isPending}
              onClick={() => bookMut.mutate()}
              className="h-12 w-full rounded-2xl gradient-gold text-primary-foreground"
            >
              {bookMut.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
              {t("salon.confirm")}
            </Button>
          )}
        </div>
      }
    >
      {/* Progress bar */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 bg-background/85 px-4 pb-3 backdrop-blur-xl">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full gradient-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-full space-y-4 overflow-x-clip pb-1">
        {/* STEP 1 — service */}
        {step === 0 && (
          <div className="space-y-2">
            {services.map((s, i) => {
              const active = service?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setServiceId(s.id);
                    setTime(null);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                    active ? "border-primary bg-primary/5" : "border-border/70"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{serviceNames[i] ?? s.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {s.duration_mins} {t("salon.min")}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">{fmtMoney(Number(s.price))}</span>
                    {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </span>
                </button>
              );
            })}
            {services.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("booking.noServices")}</p>}

            {staff.length > 0 && (
              <div className="pt-2">
                <Label className="text-xs">{t("booking.staff")}</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setStaffId(null); setTime(null); }}
                    className={`rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${staffId === null ? "border-primary bg-primary/5" : "border-border/70"}`}
                  >
                    <span className="block text-sm font-medium">{t("booking.anyStaff")}</span>
                    <span className="block text-[11px] text-muted-foreground">{t("booking.anyStaffHint")}</span>
                  </button>
                  {staff.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setStaffId(m.id); setTime(null); }}
                      className={`flex items-center gap-2 rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${staffId === m.id ? "border-primary bg-primary/5" : "border-border/70"}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {m.avatar_url ? <AvatarImage src={m.avatar_url} /> : null}
                        <AvatarFallback className="bg-primary/20 text-[10px] text-primary">{initials(m.staff_name)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{m.staff_name}</span>
                        {m.specialization && <span className="block truncate text-[11px] text-muted-foreground">{m.specialization}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — date & time */}
        {step === 1 && (
          <BookingCalendar
            salonId={salonId}
            duration={duration}
            staffId={staffId}
            selectedDate={date}
            onSelectDate={(d) => { setDate(d); setTime(null); }}
          >
            <Label className="text-xs">{t("salon.selectSlot")}</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slotsLoading && Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton h-11 rounded-xl" />)}
              {!slotsLoading &&
                slotData?.slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setTime(s.time)}
                    className={`h-11 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-95
                      ${!s.available ? "cursor-not-allowed bg-destructive/10 text-destructive/60 line-through" : ""}
                      ${s.available && time === s.time ? "gradient-gold text-primary-foreground shadow-glow" : ""}
                      ${s.available && time !== s.time ? "border border-primary/30 bg-card/70 hover:border-primary" : ""}`}
                  >
                    {s.time}
                  </button>
                ))}
              {!slotsLoading && slotData && slotData.slots.length === 0 && (
                <p className="col-span-full py-4 text-center text-sm text-muted-foreground">{t("booking.closedDay")}</p>
              )}
            </div>
          </BookingCalendar>
        )}

        {/* STEP 3 — contacts & payment */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-medium">{service?.name}</span>
                <span className="shrink-0 font-semibold">{fmtMoney(Number(service?.price ?? 0))}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long" })} · {time} · {duration} {t("salon.min")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("salon.yourName")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">{t("salon.yourPhone")}</Label>
                <Input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("salon.yourEmail")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
            </div>

            <div className="rounded-2xl border p-3">
              <Label className="text-xs">{t("booking.payment")}</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!acceptApp}
                  onClick={() => setPayMode("app")}
                  className={`rounded-xl border p-3 text-left text-sm transition active:scale-95 disabled:opacity-40 ${payMode === "app" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <span className="flex items-center gap-1.5 font-medium"><CreditCard className="h-3.5 w-3.5" /> {t("booking.payCard")}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{t("booking.payCardHint")}</span>
                </button>
                <button
                  type="button"
                  disabled={!acceptOnsite}
                  onClick={() => setPayMode("onsite")}
                  className={`rounded-xl border p-3 text-left text-sm transition active:scale-95 disabled:opacity-40 ${payMode === "onsite" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <span className="flex items-center gap-1.5 font-medium"><Wallet className="h-3.5 w-3.5" /> {t("booking.payOnsite")}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{t("booking.payOnsiteHint")}</span>
                </button>
              </div>
              {(payMode === "app" || (feePercent > 0 && windowMins > 0)) && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] text-muted-foreground">
                    {payMode === "app"
                      ? t("booking.chargeNow", { amount: fmtMoney(Number(service?.price ?? 0)) })
                      : t("booking.guaranteeCard", { hours: Math.round(windowMins / 60), percent: feePercent })}
                  </p>
                  <PaymentCardPicker compact selectedId={cardId} onSelect={setCardId} />
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">{t("booking.reminderNote")}</p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
