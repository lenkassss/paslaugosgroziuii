import { Link } from "@tanstack/react-router";
import { Sparkles, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SwipeRail } from "@/components/swipe-rail";


/**
 * Slowly running horizontal ticker of featured (paid VIP) salons.
 * Mobile: replaces the big hero article — a living, app-like strip.
 * Hover / touch pauses the animation. Reduced motion → static scroll.
 */
export function FeaturedSalonsTicker({ salons }: { salons: any[] }) {
  if (!salons?.length) return null;
  const featuredFirst = [...salons].sort((a, b) => Number(!!b.is_featured_active) - Number(!!a.is_featured_active));


  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <h2 className="truncate font-display text-lg font-semibold sm:text-xl">Atrinkti salonai</h2>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">Patvirtinti salonai — rezervuok vienu paspaudimu</p>
        </div>
        <Link to="/search" className="shrink-0 text-xs font-medium text-primary">
          Visi <ArrowRight className="ml-0.5 inline h-3 w-3" />
        </Link>
      </div>

      <div className="relative rounded-3xl border border-border/60 glass py-3">
        <SwipeRail itemWidth={230} flush>

          {featuredFirst.map((s: any, i: number) => {
            const featured = !!s.is_featured_active;
            return (
              <Link
                key={`${s.id}-${i}`}
                to="/salon/$id"
                params={{ id: s.id }}
                className={`flex w-[230px] shrink-0 snap-start items-center gap-3 rounded-2xl border p-3 transition-all active:scale-95 ${
                  featured ? "border-primary/40 bg-gradient-to-r from-primary/10 to-transparent" : "border-border/60 bg-background/70"
                }`}
              >
                <Avatar className={`h-12 w-12 shrink-0 rounded-2xl ${featured ? "ring-2 ring-primary" : "ring-1 ring-border"}`}>
                  <AvatarImage src={s.avatar_url ?? s.cover_url ?? undefined} className="rounded-2xl object-cover" />
                  <AvatarFallback className="rounded-2xl gradient-gold text-primary-foreground text-xs">
                    {(s.business_name ?? "SA").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-sm font-semibold">{s.business_name}</span>
                    <VerifiedBadge status={s.verification_status} size="xs" />
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{s.city ?? "Lietuva"}{s.category ? ` · ${s.category}` : ""}</span>
                  </div>
                  {featured && (
                    <Badge className="mt-1 h-4 border-0 gradient-gold px-1.5 text-[9px] text-primary-foreground">VIP</Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </SwipeRail>

      </div>
    </section>
  );
}
