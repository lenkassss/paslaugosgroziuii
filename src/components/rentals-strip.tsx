import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { listRentals } from "@/lib/rentals.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, ArrowRight, Ruler, Lock } from "lucide-react";
import { fmtMoney } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const PERIOD_LABEL: Record<string, string> = { hour: "/val", day: "/d.", month: "/mėn." };

export function RentalsStrip() {
  const { role, loading } = useAuth();
  const isB2B = role === "salon" || role === "staff" || role === "supplier" || role === "admin";
  const fn = useServerFn(listRentals);
  const q = useQuery({
    queryKey: ["rentals-strip"],
    queryFn: () => fn({ data: { limit: 6 } }),
    enabled: isB2B,
    staleTime: 60_000,
  });

  if (loading) return null;
  if (!isB2B) return null;

  const rentals = (q.data?.items ?? []) as any[];
  if (!rentals.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg gradient-gold flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold">Patalpų nuoma meistrėms</h2>
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">B2B</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Darbo vietos ir kabinetai grožio profesionalams visoje Lietuvoje.</p>
        </div>
        <Link to="/feed/patalpos" className="text-sm text-primary hover:underline inline-flex items-center gap-1 shrink-0">
          Visos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {rentals.slice(0, 6).map((r) => {
          const img = Array.isArray(r.images) && r.images[0] ? r.images[0] : null;
          return (
            <Link key={r.id} to="/feed/patalpos" className="group">
              <Card className="overflow-hidden hover:border-primary/40 transition-colors h-full">
                <div className="aspect-[4/3] bg-secondary relative overflow-hidden">
                  {img ? (
                    <img loading="lazy" decoding="async" src={img} alt={r.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                      <Home className="h-8 w-8" />
                    </div>
                  )}
                  {r.price != null && (
                    <div className="absolute bottom-1.5 left-1.5 rounded-md bg-background/90 backdrop-blur px-1.5 py-0.5 text-[11px] font-semibold">
                      {fmtMoney(Number(r.price))}<span className="text-muted-foreground font-normal">{PERIOD_LABEL[r.price_period] ?? ""}</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-medium line-clamp-1">{r.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {r.city && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{r.city}</span>}
                    {r.area_sqm != null && <span className="inline-flex items-center gap-0.5"><Ruler className="h-3 w-3" />{r.area_sqm}m²</span>}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
