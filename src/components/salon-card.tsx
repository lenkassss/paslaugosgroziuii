import { Link } from "@tanstack/react-router";
import { Navigation, Sparkles, Star, MapPin, Clock, Scissors } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { FavoriteButton } from "@/components/favorite-button";
import { useDevicePosition } from "@/lib/use-device-position";
import { distanceKm, openNativeDirections } from "@/lib/native-maps";
import { useAutoTranslateText } from "@/lib/use-auto-translate";
import { openStatusLabel, type DayHours } from "@/lib/working-hours";

export type SalonCardData = {
  id: string;
  business_name: string | null;
  city: string | null;
  address?: string | null;
  category?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  gallery_urls?: string[] | null;
  verification_status?: string | null;
  is_featured_active?: boolean;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  reviews?: number | null;
  amenities?: string[] | null;
  kind?: "salon" | "specialist" | null;
  service?: { name: string; price: number; duration_mins: number } | null;
  slots?: string[];
  todayHours?: DayHours | null;
};

/**
 * Ultra-premium native salon / master card: photo cover, rating chip,
 * distance, category tags, instant favourite heart and one-tap navigation.
 */
export function SalonCard({ salon, className = "" }: { salon: SalonCardData; className?: string }) {
  const { t } = useTranslation();
  const pos = useDevicePosition();
  const category = useAutoTranslateText(salon.category ?? "");

  const photo = salon.gallery_urls?.[0] ?? salon.cover_url ?? salon.avatar_url ?? null;
  const featured = !!salon.is_featured_active;
  const km =
    pos && typeof salon.lat === "number" && typeof salon.lng === "number"
      ? distanceKm(pos, { lat: salon.lat, lng: salon.lng })
      : null;
  const openStatus = openStatusLabel(salon.todayHours ?? null);
  const hasMap =
    (typeof salon.lat === "number" && typeof salon.lng === "number") || !!salon.address || !!salon.city;

  return (
    <Link
      to="/salon/$id"
      params={{ id: salon.id }}
      className={`group relative block overflow-hidden rounded-[24px] border bg-card shadow-elegant transition-all duration-300 active:scale-[0.98] ${
        featured ? "border-primary/45 shadow-glow" : "border-border/60"
      } ${className}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary sm:aspect-[16/10]">
        {photo ? (
          <img
            src={photo}
            alt={salon.business_name ?? "Salonas"}
            loading="lazy"
            className="h-full w-full rounded-b-2xl object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground/40">
            <Sparkles className="h-9 w-9" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />

        {featured && (
          <Badge className="absolute left-3 top-12 border-0 gradient-gold text-[10px] tracking-wide text-primary-foreground">
            VIP
          </Badge>
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-background/20 bg-foreground/65 px-2.5 py-1 text-[10px] font-medium text-background backdrop-blur-md">
          {salon.kind === "specialist" ? <Scissors className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {salon.kind === "specialist" ? t("salonCard.specialist") : t("salonCard.salon")}
        </span>

        <div className="absolute right-3 top-3">
          <FavoriteButton
            item={{ id: salon.id, name: salon.business_name ?? "", city: salon.city, image: photo, category: salon.category }}
            className="h-10 w-10 border-white/25 bg-black/25 text-white backdrop-blur-md"
          />
        </div>

        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {salon.rating ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">
                <Star className="h-3 w-3 fill-primary text-primary" />
                {salon.rating.toFixed(1)}
                {salon.reviews ? <span className="font-normal text-muted-foreground">({salon.reviews})</span> : null}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-md">
                <Star className="h-3 w-3" /> {t("salonCard.new")}
              </span>
            )}
            {km !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md">
                <MapPin className="h-3 w-3 text-primary" />
                {km < 10 ? km.toFixed(1) : Math.round(km)} km
              </span>
            )}
          </div>

          {hasMap && (
            <button
              type="button"
              aria-label={t("salonCard.navigate")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openNativeDirections({ lat: salon.lat, lng: salon.lng, address: salon.address, city: salon.city });
              }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition active:scale-90"
            >
              <Navigation className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-display text-[17px] font-semibold leading-tight">{salon.business_name}</h3>
          <VerifiedBadge status={salon.verification_status as any} size="xs" />
        </div>
        <div className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{salon.address ?? salon.city}</span>
        </div>

        {openStatus && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                openStatus.open
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${openStatus.open ? "bg-success animate-pulse" : "bg-muted-foreground/50"}`} />
              {openStatus.text}
            </span>
          </div>
        )}

        {salon.service && (
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border/60 pt-3 text-xs">
            <span className="min-w-0 truncate text-muted-foreground">{salon.service.name} · {salon.service.duration_mins} min</span>
            <span className="shrink-0 font-semibold">{t("salonCard.from")} {salon.service.price.toFixed(0)} €</span>
          </div>
        )}

        {(salon.slots?.length ?? 0) > 0 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar" data-drag-scroll>
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
            {salon.slots?.slice(0, 4).map((slot) => (
              <span key={slot} className="shrink-0 rounded-full border border-primary/30 bg-primary/[0.06] px-2.5 py-1 text-[11px] font-semibold">
                {slot}
              </span>
            ))}
          </div>
        )}

        {(category || salon.amenities?.length) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {category && (
              <span className="rounded-full border border-primary/25 bg-primary/[0.07] px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                {category}
              </span>
            )}
            {(salon.amenities ?? []).slice(0, 2).map((a) => (
              <span key={a} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
