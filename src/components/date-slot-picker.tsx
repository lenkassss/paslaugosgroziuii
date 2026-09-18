import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { MarketCalendar } from "@/components/market-calendar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

const pretty = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("lt-LT", { weekday: "short", day: "numeric", month: "long" });

/**
 * Hero search "Data / laikas" field.
 * Opens a full-month availability calendar (Booking.com style) — the user can either
 * pick an exact day + time, or just browse the whole month's free days and leave it empty.
 */
export function DateSlotPicker({
  date,
  time,
  onChange,
  city,
  category,
  serviceId,
  brandId,
  placeholder = "Bet kuri diena",
}: {
  date: string;
  time: string;
  onChange: (next: { date: string; time: string }) => void;
  city?: string;
  category?: string;
  serviceId?: string;
  brandId?: string;
  placeholder?: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const label = date ? `${pretty(date)}${time ? ` · ${time}` : ""}` : placeholder;

  const pick = (d: string, t?: string) => {
    onChange({ date: d, time: t ?? "" });
    if (t) setOpen(false);
  };

  const body = (
    <div className="w-full max-w-full space-y-3 overflow-hidden">
      <MarketCalendar city={city} category={category} serviceId={serviceId} brandId={brandId} compact onPick={pick} />
      {date && (
        <Button variant="outline" className="h-11 w-full rounded-xl active:scale-95" onClick={() => setOpen(false)}>
          Patvirtinti {label}
        </Button>
      )}
      {(date || time) && (
        <button
          type="button"
          onClick={() => onChange({ date: "", time: "" })}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          <X className="h-3 w-3" /> Išvalyti — rodyti visą mėnesį
        </button>
      )}
    </div>
  );

  const trigger = (
    <button
      type="button"
      onClick={() => isMobile && setOpen(true)}
      className="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-input bg-background px-3 text-left text-sm transition hover:border-primary/50 active:scale-[0.99]"
    >
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className={`truncate ${date ? "capitalize font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent
            className="max-h-[var(--sheet-max-height)] w-full max-w-full overflow-hidden rounded-t-3xl"
          >
            <DrawerHeader className="text-left">
              <DrawerTitle className="font-display text-xl">Kada tau patogu?</DrawerTitle>
              <DrawerDescription>
                Nieko nesirink — matysi visas mėnesio laisvas dienas. Arba pasirink konkrečią dieną ir laiką.
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{body}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-[min(94vw,26rem)] max-w-full overflow-hidden rounded-2xl p-3">
        {body}
      </PopoverContent>
    </Popover>
  );
}
