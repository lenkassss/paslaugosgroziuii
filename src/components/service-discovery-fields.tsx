import { useMemo, useState } from "react";
import { MapPin, Shapes, Sparkles } from "lucide-react";
import { CitySelect } from "@/components/city-select";
import { Combobox } from "@/components/ui/combobox";
import {
  HAIR_AUDIENCES,
  SERVICE_CATEGORY_LABELS,
  matchesHairAudience,
  type HairAudience,
} from "@/lib/service-taxonomy";
import type { StandardService } from "@/lib/services.functions";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/use-language";
import { uiText } from "@/lib/ui-copy";


type ServiceDiscoveryFieldsProps = {
  city: string;
  category: string;
  serviceId: string;
  services: StandardService[];
  onCityChange: (city: string) => void;
  onCategoryChange: (category: string) => void;
  onServiceChange: (serviceId: string) => void;
  className?: string;
};

export function ServiceDiscoveryFields({
  city,
  category,
  serviceId,
  services,
  onCityChange,
  onCategoryChange,
  onServiceChange,
  className,
}: ServiceDiscoveryFieldsProps) {
  const { lang } = useLanguage();
  const copy = (value: string) => uiText(value, lang);
  const [audience, setAudience] = useState<HairAudience | "">("");
  const isHair = category === "Plaukai";
  const audiences = isHair ? HAIR_AUDIENCES : [];
  // Plaukams paslaugų sąrašas atsiveria tik pasirinkus, kam skirta paslauga.
  const serviceStepReady = !!category && (!isHair || !!audience);

  const serviceOptions = useMemo(() => {
    return services
      .filter((service) => service.category === category)
      // Plaukams: rodom pasirinktai auditorijai skirtas + visoms bendras paslaugas.
      .filter((service) => (isHair && audience ? matchesHairAudience(service.name, audience) : true))
      .map((service) => ({ value: service.id, label: service.name }));
  }, [audience, category, isHair, services]);


  const categoryOptions = SERVICE_CATEGORY_LABELS.map((label) => ({ value: label, label }));

  return (
    <div className={cn("grid gap-2 md:grid-cols-3", className)}>
      <DiscoveryField step="1" label={copy("Miestas (nebūtina)")} icon={MapPin} active={!!city}>
        <CitySelect
          value={city}
          onChange={onCityChange}
          placeholder={copy("Visi miestai")}
          className="h-12 rounded-xl border-0 bg-muted/70 px-3 shadow-none focus-visible:ring-cyclamen"
        />
      </DiscoveryField>

      <DiscoveryField step="2" label={copy("Kategorija")} icon={Shapes} active={!!category}>
        <Combobox
          options={categoryOptions}
          value={category}
          onChange={(next) => {
            onCategoryChange(next);
            onServiceChange("");
            setAudience("");
          }}
          placeholder={copy("Pasirinkite kategoriją")}
          searchPlaceholder={copy("Ieškoti kategorijos...")}
          className="h-12 rounded-xl border-0 bg-muted/70 px-3 shadow-none focus-visible:ring-cyclamen"
        />
      </DiscoveryField>

      {audiences.length > 0 && (
        <div className="animate-fade-in rounded-2xl border border-cyclamen/40 bg-cyclamen/5 p-2 md:col-span-3">
          <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {copy("Kam skirtas kirpimas ar procedūra?")}
          </div>
          <div data-drag-scroll className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {audiences.map((a) => {
            const on = audience === a.key;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => { setAudience(on ? "" : a.key); onServiceChange(""); }}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
                  on ? "border-cyclamen bg-cyclamen text-primary-foreground" : "border-border bg-background hover:border-cyclamen/60",
                )}
              >
                {a.label}
              </button>
            );
          })}
          </div>
        </div>
      )}
      <DiscoveryField step="3" label={copy("Paslauga")} icon={Sparkles} active={!!serviceId} disabled={!serviceStepReady}>
        <Combobox
          options={serviceOptions}
          value={serviceId}
          onChange={onServiceChange}
          placeholder={
            !category
              ? copy("Pirmiausia pasirinkite kategoriją")
              : !serviceStepReady
                ? copy("Pasirinkite, kam skirta paslauga")
                : `Pasirinkite: ${category}`
          }
          searchPlaceholder={copy("Ieškoti konkrečios paslaugos...")}
          emptyText={copy("Šioje kategorijoje paslaugų nerasta.")}
          disabled={!serviceStepReady}
          className="h-12 rounded-xl border-0 bg-muted/70 px-3 shadow-none focus-visible:ring-cyclamen"
        />
      </DiscoveryField>


    </div>
  );
}

function DiscoveryField({
  step,
  label,
  icon: Icon,
  active,
  disabled,
  children,
}: {
  step: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const copy = (value: string) => uiText(value, lang);
  return (
    <div className={cn(
      "min-w-0 rounded-2xl border bg-background p-2 transition-colors",
      active ? "border-cyclamen/50" : "border-border/70",
      disabled && "opacity-55",
    )}>
      <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase text-muted-foreground">
        <span className={cn("grid h-5 w-5 place-items-center rounded-full border text-[9px]", active && "border-cyclamen bg-cyclamen text-primary-foreground")}>{step}</span>
        <Icon className={cn("h-3 w-3", active && "text-cyclamen")} />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}