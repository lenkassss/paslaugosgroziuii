import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { listLookbook, type LookbookItem } from "@/lib/lookbook.functions";
import { useTranslation } from "react-i18next";

const TABS = ["all", "nagai", "plaukai", "makiazas", "antakiai"] as const;

export function LookbookGrid() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["lookbook"],
    queryFn: () => listLookbook(),
    staleTime: 5 * 60 * 1000,
  });

  const items = (data?.items ?? []).filter((i) => tab === "all" || i.trend === tab);
  if (!isLoading && (data?.items ?? []).length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-4">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
          <Camera className="h-3.5 w-3.5 shrink-0" /> {t("look.eyebrow")}
        </div>
        <h2 className="mt-1 font-display text-xl sm:text-2xl md:text-3xl">{t("look.title")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("look.sub")}</p>
      </div>

      <div data-drag-scroll className="no-scrollbar mb-4 flex snap-x gap-2 overflow-x-auto pb-1">
        {TABS.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition ${
              tab === tb ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-background/70 text-muted-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            {t(`look.tab_${tb}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
          {items.map((item, idx) => <LookCard key={item.id} item={item} tall={idx % 3 === 0} />)}
        </div>
      )}
    </section>
  );
}

function LookCard({ item, tall }: { item: LookbookItem; tall: boolean }) {
  const { t } = useTranslation();
  const href = item.profile_id
    ? { to: "/salon/$id" as const, params: { id: item.profile_id } }
    : {
        to: "/search" as const,
        search: {
          q: item.service_name ?? item.title,
          city: item.city ?? "Visi",
          category: "Visos",
          service: item.service_name ?? "",
          serviceId: "",
          date: "",
          from: "",
          to: "",
          onlyAvailable: false,
        },
      };

  return (
    <div className={`group relative break-inside-avoid overflow-hidden rounded-xl border border-border/60 ${tall ? "aspect-[3/4]" : "aspect-square"}`}>
      <img
        src={item.image_url}
        alt={item.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent opacity-90 transition-opacity md:opacity-0 md:group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 p-3 text-background md:translate-y-2 md:opacity-0 md:transition-all md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <p className="truncate font-display text-sm">{item.title}</p>
        <p className="truncate text-[11px] opacity-90">
          {[item.master_name, item.city].filter(Boolean).join(" · ")}
          {item.price ? ` · ${item.price} €` : ""}
        </p>
        <Button asChild size="sm" className="mt-2 h-9 w-full gradient-gold text-primary-foreground btn-press hover:opacity-90">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link {...(href as any)}>{t("look.cta")}</Link>
        </Button>
      </div>
    </div>
  );
}
