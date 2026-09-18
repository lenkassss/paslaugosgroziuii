import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DateSlotPicker } from "@/components/date-slot-picker";
import { Search, Calendar, ChevronDown } from "lucide-react";
import { MarketCalendar } from "@/components/market-calendar";
import { useTranslation } from "react-i18next";
import { listStandardServices } from "@/lib/services.functions";
import { ServiceDiscoveryFields } from "@/components/service-discovery-fields";
import { useLanguage } from "@/lib/use-language";
import { uiText } from "@/lib/ui-copy";


export function HeroSearchBar() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const nav = useNavigate();
  const [serviceId, setServiceId] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const brand = "";
  const [category, setCategory] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: serviceData } = useQuery({
    queryKey: ["standard-services"],
    queryFn: () => listStandardServices(),
    staleTime: 10 * 60 * 1000,
  });
  const submit = () => {
    nav({
      to: "/search",
      search: {
        q: "",
        city: city || "Visi",
        category: category || "Visos",
        service: "",
        serviceId,
        brandId: brand,
        date,
        from: time,
        to: time ? `${String(Number(time.slice(0, 2)) + 2).padStart(2, "0")}:00` : "",
        onlyAvailable: !!(serviceId || date || time),
      },
    });
  };

  return (
    <div className="w-full max-w-full animate-fade-in">
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        className="grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 text-left shadow-elegant backdrop-blur-2xl md:hidden"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Search className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{category || t("hero.f1ph")}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {[city || t("hero.f2ph"), date || t("hero.time_any"), time].filter(Boolean).join(" · ")}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-cyclamen transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
      </button>

      <div className={mobileOpen ? "mt-3 block animate-slide-up" : "hidden md:block"}>


      <div className="w-full max-w-full overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-elegant md:p-4">
        <ServiceDiscoveryFields
          city={city}
          category={category}
          serviceId={serviceId}
          services={serviceData?.services ?? []}
          onCityChange={setCity}
          onCategoryChange={setCategory}
          onServiceChange={setServiceId}
        />
        <div className="mt-3 grid gap-2.5 border-t border-border pt-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t("hero.f3")}</span>
            </div>
            {serviceId ? (
              /* Pasirinkus paslaugą – iškart parodom laisvų dienų kalendorių. */
              <MarketCalendar
                city={city && city !== "Visi" ? city : undefined}
                category={category || undefined}
                serviceId={serviceId}
                compact
                onPick={(d, tm) => { setDate(d); setTime(tm ?? ""); }}
              />
            ) : (
              <DateSlotPicker
                date={date}
                time={time}
                onChange={({ date: d, time: tm }) => { setDate(d); setTime(tm); }}
                city={city && city !== "Visi" ? city : undefined}
                category={category || undefined}
              />
            )}
          </div>


          <Button
            onClick={submit}
            className="h-11 w-full rounded-xl bg-primary px-8 text-primary-foreground btn-press hover:opacity-90 md:w-auto"
          >
            <Search className="mr-2 h-4 w-4" /> {t("hero.cta")}
          </Button>
        </div>
        <div className="mt-2 px-1 text-[11px] text-muted-foreground">
          {uiText("Ieškai konkretaus prekinio ženklo?", lang)}{" "}
          <Link to="/prekiniai-zenklai" className="font-medium text-cyclamen underline-offset-2 hover:underline">
            {uiText("Paieška pagal prekinį ženklą", lang)}
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
