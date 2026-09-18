import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listModelCalls } from "@/lib/model-calls.functions";
import { SERVICE_CATEGORY_LABELS } from "@/lib/service-taxonomy";
import { CitySelect } from "@/components/city-select";
import { Combobox } from "@/components/ui/combobox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CalendarDays, Users, Phone, Mail } from "lucide-react";
import { useSection } from "@/lib/use-site-content";
import { SiteBlocks } from "@/components/site-blocks";

export const Route = createFileRoute("/ieskomi-modeliai")({
  component: ModelCallsPage,
  head: () => ({
    meta: [
      { title: "Ieškomi modeliai grožio procedūroms · PaslaugosGrožiui" },
      {
        name: "description",
        content: "Meistrai ir salonai ieško modelių procedūroms. Filtruok pagal paslaugą ir miestą, susisiek ir gauk procedūrą už mažesnę kainą.",
      },
      { property: "og:title", content: "Ieškomi modeliai · PaslaugosGrožiui" },
      { property: "og:description", content: "Modelių paieška grožio procedūroms pagal paslaugą ir miestą." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function euros(cents: number) {
  return cents > 0 ? `${(cents / 100).toFixed(2)} €` : "Nemokamai";
}

function ModelCallsPage() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["model-calls", city, category],
    queryFn: () =>
      listModelCalls({
        data: { ...(city ? { city } : {}), ...(category ? { category } : {}) },
      }),
    staleTime: 60_000,
  });
  const calls = data?.calls ?? [];
  const block = useSection("ieskomi-modeliai", "intro");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyclamen">Ieškomi modeliai</div>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{block?.title || "Tapk modeliu ir gauk procedūrą"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {block?.subtitle || "Meistrai ir salonai ieško modelių naujoms technikoms. Ieškok pagal paslaugą arba tiesiog pagal miestą."}
        </p>
      </div>

      <Card className="mb-8 grid gap-3 p-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Paslauga</div>
          <Combobox
            options={SERVICE_CATEGORY_LABELS.map((label) => ({ value: label, label }))}
            value={category}
            onChange={setCategory}
            placeholder="Visos paslaugos"
            searchPlaceholder="Ieškoti paslaugos..."
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Miestas</div>
          <CitySelect value={city} onChange={setCity} className="h-11 rounded-xl bg-background" />
        </div>
      </Card>


      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : calls.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8" />
          Pagal šiuos filtrus modelių paieškų nėra — pabandyk kitą paslaugą ar miestą.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {calls.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3 p-4 transition hover:border-cyclamen/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-display text-lg">{c.service_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.provider?.business_name || c.provider?.owner_name || "Grožio specialistas"}
                  </div>
                </div>
                <Badge className="shrink-0">{euros(c.price_cents)}</Badge>
              </div>

              {c.image_urls?.[0] && (
                <img src={c.image_urls[0]} alt={c.service_name} loading="lazy" className="h-36 w-full rounded-xl object-cover" />
              )}

              {c.description && <p className="line-clamp-3 text-sm text-muted-foreground">{c.description}</p>}

              <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {c.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {c.city}
                  </span>
                )}
                {c.starts_on && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {c.starts_on}
                    {c.ends_on ? ` – ${c.ends_on}` : ""}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {c.spots} viet.
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {c.contact_phone && (
                  <a
                    href={`tel:${c.contact_phone}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-cyclamen"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {c.contact_phone}
                  </a>
                )}
                {c.contact_email && (
                  <a
                    href={`mailto:${c.contact_email}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-cyclamen"
                  >
                    <Mail className="h-3.5 w-3.5" /> Rašyti
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <SiteBlocks page="ieskomi-modeliai" />
    </div>
  );
}
