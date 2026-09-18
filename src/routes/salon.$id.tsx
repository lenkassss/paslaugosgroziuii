import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { VerifiedBadge } from "@/components/verified-badge";
import { FavoriteButton } from "@/components/favorite-button";

import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSalonDetail, getAvailableSlots, bookAppointment, submitReview } from "@/lib/platform.functions";
import { listSalonStaff } from "@/lib/staff.functions";

import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { MapPin, Phone, Star, Clock, CheckCircle2, Calendar as CalIcon, Lock, ShieldAlert, CreditCard, Wallet, Sparkle, Navigation as NavIcon } from "lucide-react";
import { openNativeDirections } from "@/lib/native-maps";

import { amenityLabel } from "@/lib/amenities";
import { BookingWizard } from "@/components/booking-wizard";

import { toast } from "sonner";
import { fmtMoney, initials } from "@/lib/utils";
import { SalonMap } from "@/components/salon-map";
import { BookingCalendar } from "@/components/booking-calendar";
import { listProviderBrands } from "@/lib/provider-brands.functions";
import { Badge } from "@/components/ui/badge";
import { WorkingHoursCard } from "@/components/working-hours-card";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/salon/$id")({
  loader: async ({ params, context }) => {
    try {
      return await context.queryClient.ensureQueryData({
        queryKey: ["salon", params.id],
        queryFn: () => getSalonDetail({ data: { id: params.id } }),
      });
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    const name = loaderData?.profile?.business_name ?? "Salonas";
    return {
      meta: [
        { title: `${name} · PaslaugosGrožiui` },
        { name: "description", content: loaderData?.profile?.bio?.slice(0, 160) ?? "Grožio salonas Lietuvoje. Rezervuok laiką akimirksniu." },
        { property: "og:title", content: name },
        { property: "og:image", content: loaderData?.profile?.cover_url ?? "" },
      ],
    };
  },
  component: SalonPage,
});


function SalonPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["salon", id], queryFn: () => getSalonDetail({ data: { id } }) });
  const { data: staffData } = useQuery({ queryKey: ["staff", id], queryFn: () => listSalonStaff({ data: { salonId: id } }) });
  const { data: brandData } = useQuery({ queryKey: ["provider-brands", id], queryFn: () => listProviderBrands({ data: { profileId: id } }) });
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null); // null = "any"
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);

  const isApproved = data?.profile?.is_approved !== false;
  const pol = (data?.profile ?? {}) as Record<string, unknown>;
  const amenities: string[] = Array.isArray(pol['amenities']) ? (pol['amenities'] as string[]) : [];
  const acceptApp = pol['accept_app_payments'] !== false;
  const acceptOnsite = pol['accept_onsite_payments'] !== false;
  const feePercent = Number(pol['cancellation_fee_percent'] ?? 0);
  const windowMins = Number(pol['cancellation_window_mins'] ?? 0);

  const openBooking = () => {
    if (!user) { setAuthGateOpen(true); return; }
    if (!isApproved) { toast.error(t("booking.underReview")); return; }
    setBookingOpen(true);
  };


  const review = useServerFn(submitReview);
  type ReviewInput = { salonId: string; reviewerName: string; rating: number; comment?: string };
  const revMut = useMutation({
    mutationFn: (input: ReviewInput) => review({ data: input }),
    onSuccess: () => {
      setReviewOpen(false);
      toast.success("Atsiliepimas pridėtas!");
      qc.invalidateQueries({ queryKey: ["salon", id] });
    },
    onError: (e) => toastError(e),
  });

  if (!data) return null;
  const { profile, services, hours, reviews } = data;
  const gallery = (data as { gallery?: { id: string; title: string; image_url: string; service_name: string | null; price: number | null }[] }).gallery ?? [];
  const staff = (staffData?.staff ?? []).filter((m) => m.is_active !== false);
  const avgRating = reviews.length ? reviews.reduce((a, b) => a + b.rating_stars, 0) / reviews.length : 0;
  const grouped = services.reduce<Record<string, typeof services>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      {/* Cover */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-muted">
        {profile.cover_url ? (
          <img loading="lazy" decoding="async" src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-gold" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
      </div>

      <div className="relative -mt-16 mx-auto max-w-7xl animate-slide-up pb-28 md:-mt-24 md:px-6 md:pb-0">
        <section className="border-y border-border/60 bg-background/95 px-4 py-5 shadow-elegant backdrop-blur-xl md:rounded-2xl md:border md:p-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2 flex-wrap">
                <span>{profile.business_name}</span>
                <VerifiedBadge status={profile.verification_status} size="md" showLabel />
                <FavoriteButton
                  item={{
                    id: profile.id,
                    name: profile.business_name ?? "Salonas",
                    city: profile.city,
                    image: profile.avatar_url ?? profile.cover_url,
                    category: profile.category,
                  }}
                />
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profile.city && (
                  <button
                    type="button"
                    onClick={() => openNativeDirections({ lat: profile.lat, lng: profile.lng, address: profile.address, city: profile.city })}
                    className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-1.5 font-medium text-foreground/80 transition active:scale-95"
                  >
                    <MapPin className="h-4 w-4 text-primary" /> {profile.address ?? profile.city}
                    <NavIcon className="ml-0.5 h-3.5 w-3.5 text-primary" />
                  </button>
                )}

                {profile.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {profile.phone}</span>}
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-primary text-primary" /> {avgRating.toFixed(1)} ({reviews.length})</span>
              </div>
              {profile.bio && <p className="mt-3 text-muted-foreground max-w-2xl">{profile.bio}</p>}
              {!isApproved && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 max-w-2xl">
                  <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Salonas peržiūrimas administracijos – rezervacijos laikinai negalimos. Naršyti profilį galima, o rezervuoti bus galima kai tik salonas bus patvirtintas.</span>
                </div>
              )}
              {(brandData?.brands?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Naudojama produkcija</div>
                  <div className="flex flex-wrap gap-1.5">
                    {brandData!.brands.map((b) => (
                      <Badge key={b.id} variant="outline" className="text-[11px]">{b.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {amenities.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Patogumai</div>
                  <div className="flex flex-wrap gap-1.5">
                    {amenities.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px]">
                        <Sparkle className="h-3 w-3 text-primary" /> {amenityLabel(a)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {acceptApp && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600"><CreditCard className="h-3 w-3" /> Apmokėjimas aplikacijoje</span>
                )}
                {acceptOnsite && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Wallet className="h-3 w-3" /> Atsiskaitymas vietoje</span>
                )}
                {feePercent > 0 && windowMins > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-amber-600">
                    <ShieldAlert className="h-3 w-3" /> Atšaukus likus mažiau nei {Math.round(windowMins / 60)} val. — {feePercent}% mokestis
                  </span>
                )}
              </div>


            </div>
            <Button size="lg" onClick={openBooking} disabled={!isApproved} className="gradient-gold text-primary-foreground btn-press hover:opacity-90 shrink-0 disabled:opacity-50">
              {!user ? <Lock className="mr-2 h-4 w-4" /> : <CalIcon className="mr-2 h-4 w-4" />} {t("salon.book")}
            </Button>
          </div>
        </section>
        {/* Sticky mobile section nav */}
        <nav className="sticky top-[var(--app-chrome-top)] z-30 -mx-0 mt-3 flex gap-2 overflow-x-auto border-y border-border/60 bg-background/90 px-4 py-2.5 backdrop-blur-xl no-scrollbar md:hidden">
          {[
            gallery.length > 0 && { id: "gallery", label: t("salon.gallery") },
            staff.length > 0 && { id: "team", label: t("salon.team") },
            { id: "services", label: t("salon.services") },
            { id: "reviews", label: t("salon.reviews") },
          ]
            .filter(Boolean)
            .map((s) => {
              const sec = s as { id: string; label: string };
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => document.getElementById(sec.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="shrink-0 rounded-full border border-border/60 px-4 py-1.5 text-xs font-semibold transition active:scale-95"
                >
                  {sec.label}
                </button>
              );
            })}
        </nav>

        <div className="mt-3 grid gap-3 px-3 md:mt-8 md:gap-6 md:px-0 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* GALLERY */}
            {gallery.length > 0 && (
              <section id="gallery" className="border-y border-border/60 bg-card px-4 py-5 md:rounded-2xl md:border md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">{t("salon.gallery")}</h2>
                  <span className="text-xs text-muted-foreground">{gallery.length}</span>
                </div>
                <div className="mt-4 -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 no-scrollbar">
                  {gallery.map((g) => (
                    <figure key={g.id} className="group relative h-52 w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-border/60 shadow-elegant md:h-60 md:w-48">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={g.image_url}
                        alt={g.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-3">
                        <div className="truncate text-xs font-medium">{g.title}</div>
                        {g.price != null && <div className="text-[11px] text-primary">{fmtMoney(Number(g.price))}</div>}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {/* TEAM */}
            {staff.length > 0 && (
              <section id="team" className="border-y border-border/60 bg-card px-4 py-5 md:rounded-2xl md:border md:p-6">
                <h2 className="font-display text-2xl">{t("salon.team")}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t("salon.teamHint")}</p>
                <div className="mt-4 -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 no-scrollbar">
                  {staff.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => { setSelectedStaff(m.id); openBooking(); }}
                      className={`w-32 shrink-0 snap-start rounded-2xl border p-3 text-center transition active:scale-95 ${
                        selectedStaff === m.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50"
                      }`}
                    >
                      <Avatar className="mx-auto h-16 w-16 ring-2 ring-primary/20">
                        <AvatarImage src={m.avatar_url ?? undefined} alt={m.staff_name} />
                        <AvatarFallback>{initials(m.staff_name)}</AvatarFallback>
                      </Avatar>
                      <div className="mt-2 truncate text-sm font-medium">{m.staff_name}</div>
                      {m.specialization && <div className="truncate text-[11px] text-muted-foreground">{m.specialization}</div>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* SERVICES */}
            <Card id="services" className="overflow-hidden rounded-3xl border-border/60 p-0 shadow-elegant">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-secondary/60 px-5 py-4">
                <h2 className="min-w-0 truncate font-display text-2xl">{t("salon.services")}</h2>
                <span className="shrink-0 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1 text-[11px] font-semibold">
                  {services.length}
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {Object.entries(grouped).map(([cat, list]) => (
                  <div key={cat} className="p-4 sm:p-5">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{cat}</h3>
                    <div className="space-y-2">
                      {list.map((s) => {
                        const active = selectedService === s.id;
                        const hasDiscount = !!s.discount_price && Number(s.discount_price) < Number(s.price);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => { setSelectedService(s.id); openBooking(); }}
                            className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.99] ${
                              active
                                ? "border-primary/60 bg-primary/[0.06] shadow-glow"
                                : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate text-[15px] font-semibold leading-tight">{s.name}</div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                                  <Clock className="h-3 w-3" /> {s.duration_mins} min
                                </span>
                                {hasDiscount && (
                                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
                                    {s.discount_label ?? "Akcija"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {hasDiscount && (
                                <div className="text-[11px] text-muted-foreground line-through">{fmtMoney(Number(s.price))}</div>
                              )}
                              <div className="font-display text-lg font-semibold leading-none">
                                {fmtMoney(Number(hasDiscount ? s.discount_price : s.price))}
                              </div>
                              <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                                {t("salon.book")}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!services.length && (
                  <div className="py-10 text-center text-sm text-muted-foreground">Kol kas paslaugų nėra.</div>
                )}
              </div>
            </Card>

            {/* REVIEWS */}
            <Card id="reviews" className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">{t("salon.reviews")}</h2>
                <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}>{t("salon.writeReview")}</Button>
              </div>

              {reviews.length > 0 && (
                <div className="mt-5 flex flex-col gap-5 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center">
                  <div className="text-center sm:w-32">
                    <div className="font-display text-4xl leading-none">{avgRating.toFixed(1)}</div>
                    <div className="mt-1.5 flex justify-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(avgRating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{reviews.length} atsiliepimai</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating_stars === star).length;
                      const pct = Math.round((count / reviews.length) * 100);
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-3 text-[11px] text-muted-foreground">{star}</span>
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/60">
                            <div className="h-full gradient-gold transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-[11px] text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-3">

                {reviews.length === 0 && <p className="text-sm text-muted-foreground">{t("salon.noReviews")}</p>}
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-border/60 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{r.reviewer_name}</div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating_stars ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </div>
                    {r.text_comment && <p className="text-sm text-muted-foreground mt-1">{r.text_comment}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* HOURS */}
            <WorkingHoursCard hours={hours} />

            {/* MAP */}
            {profile.lat && profile.lng && (
              <Card className="overflow-hidden h-64">
                <SalonMap salons={[{ id: profile.id, business_name: profile.business_name, city: profile.city, lat: profile.lat, lng: profile.lng, address: profile.address, cover_url: profile.cover_url, category: profile.category }]} singleFocus />
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* STICKY MOBILE BOOKING BAR */}
      <div className="fixed inset-x-0 bottom-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))] z-40 border-t border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{profile.business_name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {services.length ? `${t("salon.services")} · ${services.length}` : t("salon.book")}
            </div>
          </div>
          <Button onClick={openBooking} disabled={!isApproved} className="gradient-gold text-primary-foreground btn-press shrink-0 disabled:opacity-50">
            {!user ? <Lock className="mr-2 h-4 w-4" /> : <CalIcon className="mr-2 h-4 w-4" />} {t("salon.book")}
          </Button>
        </div>
      </div>

      {/* BOOKING WIZARD (3 steps) */}
      <BookingWizard
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        salonId={id}
        salonName={profile.business_name ?? ""}
        services={services}
        staff={staffData?.staff ?? []}
        acceptApp={acceptApp}
        acceptOnsite={acceptOnsite}
        feePercent={feePercent}
        windowMins={windowMins}
        initialServiceId={selectedService}
        initialStaffId={selectedStaff}
        onSuccess={() => setSuccessOpen(true)}
      />


      {/* SUCCESS */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md text-center">
          <div className="py-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-success/20 flex items-center justify-center animate-spring-in">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <h2 className="mt-4 font-display text-2xl">{t("salon.success")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("salon.successDesc")}</p>
            <Button onClick={() => setSuccessOpen(false)} className="mt-6 gradient-gold text-primary-foreground">Puiku!</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* REVIEW */}
      <ReviewDialog open={reviewOpen} onOpenChange={setReviewOpen} onSubmit={(v) => revMut.mutate({ salonId: id, ...v })} pending={revMut.isPending} />

      {/* AUTH GATE */}
      <Dialog open={authGateOpen} onOpenChange={setAuthGateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto h-14 w-14 rounded-full gradient-gold flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-center font-display text-2xl">Prisijunkite tęsti</DialogTitle>
            <DialogDescription className="text-center">
              Norėdami rezervuoti laiką, prisijunkite arba užsiregistruokite per kelias sekundes — taip apsaugome salonus nuo netikrų rezervacijų.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" onClick={() => setAuthGateOpen(false)}>
              <Link to="/auth" search={{ mode: "signup", next: `/salon/${id}` } as never}>Registruotis</Link>
            </Button>
            <Button asChild onClick={() => setAuthGateOpen(false)} className="gradient-gold text-primary-foreground">
              <Link to="/auth" search={{ mode: "signin", next: `/salon/${id}` } as never}>Prisijungti</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingForm({ onSubmit, disabled }: { onSubmit: (v: { name: string; phone: string; email: string; channel: "email" | "sms" | "both" | "none" }) => void; disabled: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<"email" | "sms" | "both" | "none">("email");
  const { t } = useTranslation();
  const needsEmail = channel === "email" || channel === "both";
  return (
    <form
      className="grid gap-3 border-t border-border pt-4"
      onSubmit={(e) => { e.preventDefault(); onSubmit({ name, phone, email, channel }); }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("salon.yourName")}</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>{t("salon.yourPhone")}</Label>
          <Input required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>{t("salon.yourEmail")}{needsEmail && <span className="text-destructive"> *</span>}</Label>
        <Input type="email" required={needsEmail} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Kaip norite gauti patvirtinimą?</Label>
        <div className="mt-1.5 grid grid-cols-4 gap-1 rounded-md border p-1 bg-secondary/40">
          {([["email","El. paštu"],["sms","SMS"],["both","Abu"],["none","Nereikia"]] as const).map(([v,l]) => (
            <button
              type="button"
              key={v}
              onClick={() => setChannel(v)}
              className={`text-xs py-1.5 rounded transition ${channel === v ? "gradient-gold text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >{l}</button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">Priminimą siųsime likus 24 val. iki vizito. Atšaukti galėsite per el. laiške esančią nuorodą — pinigai negrąžinami.</p>
      </div>
      <Button type="submit" disabled={disabled} className="gradient-gold text-primary-foreground btn-press hover:opacity-90">
        {t("salon.confirm")}
      </Button>
    </form>
  );
}

function ReviewDialog({ open, onOpenChange, onSubmit, pending }: { open: boolean; onOpenChange: (b: boolean) => void; onSubmit: (v: { reviewerName: string; rating: number; comment: string }) => void; pending: boolean }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Palik atsiliepimą</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Vardas</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Įvertinimas</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-8 w-8 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Komentaras</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!name || pending} onClick={() => onSubmit({ reviewerName: name, rating, comment })} className="gradient-gold text-primary-foreground">Skelbti</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
