import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CLASSIFIED_PACKS, perListingEur } from "@/lib/packages";
import { PROMO_PLANS } from "@/lib/promotions.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMyAddons, purchaseAddon } from "@/lib/addons.functions";
import { addonByKey, addonsForRole, type AddonItem } from "@/lib/addons";
import { useAuth } from "@/lib/auth-context";
import { eurFromNumber, SCHOOL_TRIAL_MONTHS, TIER_PRICING } from "@/lib/access";
import { toastError } from "@/lib/error-messages";
import { fmtDate, cn } from "@/lib/utils";
import { useIsPro } from "@/components/pro-gate";
import { upgradeToPro } from "@/lib/platform.functions";
import {
  Loader2, Crown, CalendarCheck, Megaphone, Mail, Image, Ticket, CheckCircle2, Lock, Pin, ChevronRight,
  UsersRound, GraduationCap, ArrowRight, Newspaper,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/addons")({
  component: AddonsPage,
  head: () => ({
    meta: [
      { title: "Papildomos paslaugos – PaslaugosGrožiui" },
      { name: "description", content: "Vienoje vietoje: mokymai, modelių paieška, specialūs pasiūlymai, skelbimai, reklama ir registracijų sistema." },
      { property: "og:title", content: "Papildomos paslaugos" },
      { property: "og:description", content: "Visos papildomos paslaugos vienoje patogioje skiltyje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function iconFor(key: string) {
  if (key.startsWith("banner_")) return Image;
  if (key.startsWith("special_offer_")) return Ticket;
  if (key.startsWith("model_pack_")) return UsersRound;
  if (key.startsWith("course_pack_")) return GraduationCap;
  if (key === "newsletter") return Mail;
  if (key === "supplier_offers") return Megaphone;
  if (key.startsWith("classified_pack_")) return Megaphone;
  return Ticket;
}

type TabKey = "visos" | "paslaugos" | "pasiulymai" | "skelbimai" | "reklama" | "aktyvus";

function AddonsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { role } = useAuth();
  const items = addonsForRole(role);
  const mine = useQuery({ queryKey: ["my-addons"], queryFn: () => listMyAddons({ data: undefined }) });
  const buyFn = useServerFn(purchaseAddon);
  const toProFn = useServerFn(upgradeToPro);
  const { isPro, loading: proLoading } = useIsPro();
  const showPro = role === "salon" || role === "staff";
  const [tab, setTab] = useState<TabKey>("visos");

  const buy = useMutation({
    mutationFn: (key: string) => buyFn({ data: { key, card_last4: "4242" } }),
    onSuccess: (r) => {
      const addon = addonByKey(r.key);
      toast.success(`${r.label} — apmokėta (demo, ${eurFromNumber(r.amount)})`, addon?.actionTo ? {
        action: {
          label: addon.actionLabel ?? "Tęsti",
          onClick: () => navigate({ to: addon.actionTo as never }),
        },
      } : undefined);
      qc.invalidateQueries();
    },
    onError: (e) => toastError(e),
  });

  const toPro = useMutation({
    mutationFn: () => toProFn({ data: undefined }),
    onSuccess: (r) => {
      toast.success(`PRO priedas aktyvuotas (${eurFromNumber(r.price)})`);
      qc.invalidateQueries();
    },
    onError: (e) => toastError(e),
  });

  const active = (mine.data?.addons ?? []).filter((a) => a.active);
  const banners = items.filter((a) => a.key.startsWith("banner_"));
  const packs = items.filter((a) => a.key.startsWith("classified_pack_"));
  const offers = items.filter((a) => a.key.startsWith("special_offer_"));
  const serviceItems = items.filter((a) => a.key.startsWith("course_pack_") || a.key.startsWith("model_pack_"));
  const others = items.filter((a) =>
    !a.key.startsWith("banner_") &&
    !a.key.startsWith("classified_pack_") &&
    !a.key.startsWith("special_offer_") &&
    !a.key.startsWith("course_pack_") &&
    !a.key.startsWith("model_pack_"),
  );
  const isProvider = role === "salon" || role === "staff";

  const TABS: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: "visos", label: "Visos" },
    { key: "paslaugos", label: "Paslaugos", count: serviceItems.length + others.length + (showPro ? 1 : 0) },
    ...(isProvider ? [{ key: "pasiulymai" as const, label: "Pasiūlymai", count: offers.length }] : []),
    { key: "skelbimai", label: "Skelbimai", count: packs.length },
    { key: "reklama", label: "Reklama", count: banners.length + Object.keys(PROMO_PLANS).length },
    { key: "aktyvus", label: "Aktyvūs", count: active.length },
  ];

  return (
    <DashboardShell>
      <header className="mb-4">
        <h1 className="font-display text-2xl leading-tight sm:text-3xl">Papildomos paslaugos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pirk, kurk ir valdyk papildomą matomumą vienoje vietoje.</p>
      </header>

      {/* Programėlės tipo skirtukai – patogu vienu pirštu telefone. */}
      <div
        className="no-scrollbar sticky z-30 -mx-4 mb-5 flex gap-1.5 overflow-x-auto bg-background/90 px-4 py-2 backdrop-blur md:mx-0 md:px-0"
        style={{ top: "var(--app-chrome-top, 0px)" }}
      >
        {TABS.map((t) => (
          <Button
            key={t.key}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.97]",
              tab === t.key
                ? "border-cyclamen bg-cyclamen/10 text-cyclamen"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className="ml-1.5 text-[11px] opacity-70">{t.count}</span>
            )}
          </Button>
        ))}
      </div>

      {tab === "visos" && isProvider && (
        <Card className="mb-6 rounded-xl border-border p-5 shadow-none">
          <h2 className="font-display text-lg">Kainos trumpai</h2>
          <p className="mt-1 text-sm text-muted-foreground">Meistrui ir salonui kainos vienodos.</p>
          <ul className="mt-4 divide-y divide-border/60 text-sm">
            {[
              { label: "Mokymų / seminarų kalendorius", note: "1 mokymo įkėlimas", price: eurFromNumber(TIER_PRICING.course.eur) },
              { label: "Modelių paieška", note: "1 paieškos įkėlimas", price: eurFromNumber(TIER_PRICING.modelCall.eur) },
              { label: "Skelbimų skiltis", note: "1 skelbimo įkėlimas", price: eurFromNumber(TIER_PRICING.classified.eur) },
              { label: "Specialūs pasiūlymai", note: "7, 14, 21 d. arba mėnesiui · klientams arba verslui", price: `nuo ${eurFromNumber(4.99)}` },
              { label: "Reklama / straipsniai", note: "1, 7, 14 arba 30 d. · klientams arba verslui", price: `nuo ${eurFromNumber(2.99)}` },
              { label: "Rezervacijų sistema / kalendorius", note: "PRO priedas, mėnesinis", price: `${eurFromNumber(TIER_PRICING.proUpgrade.eur)}/mėn.` },
            ].map((r) => (
              <li key={r.label} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block font-medium">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.note}</span>
                </span>
                <span className="shrink-0 font-display text-base">{r.price}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(tab === "visos" || tab === "paslaugos") && (
        <div className="space-y-4">
          {tab === "visos" && (
            <SectionHeading
              title={role === "advertiser" ? "Vienkartiniai skelbimai ir modelių paieška" : "Mokymai, modeliai ir rezervacijos"}
            />
          )}
          {showPro && (
            <Card className="rounded-xl border-border p-5 shadow-none">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Badge variant="outline" className="border-cyclamen/50 text-cyclamen">Pagrindinis priedas</Badge>
                  <h2 className="mt-2 font-display text-xl leading-tight">PRO — registracijų sistema</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kalendorius, paslaugų kainos, klientų registracijos, priminimai ir apmokėjimai.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-2xl leading-none">{eurFromNumber(TIER_PRICING.proUpgrade.eur)}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">/ mėn.</div>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {["Kalendorius ir darbo laikas", "Paslaugos, kainos, depozitai", "Klientų registracijos internetu", "Priminimai ir apmokėjimai"].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyclamen" /> <span className="min-w-0">{t}</span>
                  </li>
                ))}
              </ul>
              {isPro ? (
                <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-cyclamen">
                  <Crown className="h-4 w-4" /> Aktyvu
                </div>
              ) : (
                <Button
                  className="mt-4 w-full btn-press sm:w-auto"
                  disabled={toPro.isPending || proLoading}
                  onClick={() => toPro.mutate()}
                >
                  {toPro.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  Atrakinti PRO
                </Button>
              )}
            </Card>
          )}

          {role === "school" && (
            <Card className="rounded-2xl border-cyclamen/30 p-5">
              <div className="flex items-start gap-3 text-sm">
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyclamen" />
                <p className="min-w-0">
                  Akademijos narystė — pirmi <strong>{SCHOOL_TRIAL_MONTHS} mėn. nemokamai</strong>, vėliau{" "}
                  {eurFromNumber(TIER_PRICING.school.eur)}/mėn.
                </p>
              </div>
            </Card>
          )}

          {serviceItems.length + others.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...serviceItems, ...others].map((a) => (
                <AddonCard key={a.key} addon={a} pending={buy.isPending} onBuy={() => buy.mutate(a.key)} />
              ))}
            </div>
          ) : (
            !showPro && <Card className="rounded-2xl p-6 text-sm text-muted-foreground">Šiai paskyrai priedų kol kas nėra.</Card>
          )}
        </div>
      )}

      {(tab === "visos" || tab === "pasiulymai") && isProvider && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Specialūs pasiūlymai</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pasirink, kam pasiūlymas bus rodomas ir kiek laiko jis galios.
            </p>
          </div>
          <div className="space-y-5">
            {(["Klientams", "Verslui"] as const).map((audience) => (
              <section key={audience}>
                <h3 className="mb-2 text-sm font-semibold">{audience}</h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {offers.filter((a) => a.audience === audience).map((a) => (
                    <AddonCard key={a.key} addon={a} pending={buy.isPending} onBuy={() => buy.mutate(a.key)} compact />
                  ))}
                </div>
              </section>
            ))}
          </div>
          <HubLink to="/dashboard/salon/content" label="Mano pasiūlymai" hint="Kurk ir tvarkyk akcijas" icon={Ticket} />
        </div>
      )}

      {(tab === "visos" || tab === "skelbimai") && (
        <div className="space-y-4">
          {tab === "visos" && <SectionHeading title="Skelbimai" />}
          <p className="text-sm text-muted-foreground">Vienas skelbimas kainuoja 0,99 €. Didesni paketai sumažina vieno skelbimo kainą.</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CLASSIFIED_PACKS.map((p) => {
              const key = `classified_pack_${p.credits}`;
              const available = packs.some((a) => a.key === key);
              return (
                <Card key={key} className="flex flex-col rounded-2xl p-5 transition hover:border-cyclamen">
                    <div className="font-display text-2xl">{eurFromNumber(p.eur)}</div>
                  <div className="mt-1 text-sm font-semibold">{p.label}</div>
                  <div className="mt-0.5 flex-1 text-xs text-muted-foreground">
                    {eurFromNumber(perListingEur(p))} už skelbimą
                  </div>
                  <Button
                    variant={p.credits === 3 ? "default" : "outline"}
                    className="mt-4 w-full btn-press"
                    disabled={buy.isPending || !available}
                    onClick={() => buy.mutate(key)}
                  >
                    {buy.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pirkti
                  </Button>
                </Card>
              );
            })}
          </div>
          <HubLink to="/skelbimai" label="Mano skelbimai" hint="Tvarkyk paskelbtus skelbimus" />
        </div>
      )}

      {(tab === "visos" || tab === "reklama") && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-1 font-display text-lg">Reklama ir straipsniai</h2>
            <p className="mb-3 text-sm text-muted-foreground">Sukurk turinį klientams arba verslui, tada pasirink jo rodymo viršuje laiką.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(Object.entries(PROMO_PLANS) as Array<[string, { label: string; days: number; price_cents: number; badge: string }]>).map(
                ([key, p]) => (
                  <Card key={key} className="flex flex-col rounded-2xl p-5">
                    <div className="font-display text-2xl">{eurFromNumber(p.price_cents / 100)}</div>
                    <div className="mt-1 text-sm font-semibold">{p.label}</div>
                    <div className="mt-0.5 flex-1 text-xs text-muted-foreground">
                      {eurFromNumber(Math.round(p.price_cents / p.days) / 100)} už dieną · {p.badge}
                    </div>
                    <Button asChild variant="outline" className="mt-4 w-full btn-press">
                      <Link to="/dashboard/salon/promote">Pasirinkti straipsnį</Link>
                    </Button>
                  </Card>
                ),
              )}
            </div>
          </section>

          {isProvider && (
            <HubLink to="/dashboard/salon/content" label="Kurti straipsnį ar naujieną" hint="Pasirink klientų arba verslo auditoriją" icon={Newspaper} />
          )}

          {banners.length > 0 && (
            <section>
              <h2 className="mb-1 font-display text-lg">Banerių reklama</h2>
              <p className="mb-3 text-sm text-muted-foreground">Matomumas platformoje — pasirink trukmę.</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {banners.map((a) => (
                  <Card key={a.key} className="flex flex-col rounded-2xl p-5 transition hover:border-cyclamen">
                    <div className="font-display text-2xl">{eurFromNumber(a.eur)}</div>
                    <div className="text-xs text-muted-foreground">{a.days} d. reklama</div>
                    <Button
                      variant="outline"
                      className="mt-4 w-full btn-press"
                      disabled={buy.isPending}
                      onClick={() => buy.mutate(a.key)}
                    >
                      {buy.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Pirkti
                    </Button>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <HubLink to="/dashboard/salon/promote" label="Reklamuoti turinį" hint="Prikabink straipsnį naujienų viršuje" icon={Pin} />
            <HubLink to="/dashboard/salon/featured" label="Profilio paryškinimas" hint="Būk aukščiau paieškos rezultatuose" icon={Crown} />
          </div>
        </div>
      )}

      {(tab === "visos" || tab === "aktyvus") && (
        <section className="space-y-3">
        {tab === "visos" && <SectionHeading title="Aktyvios paslaugos" />}
        <Card className="rounded-2xl p-5">
          {mine.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Kraunama…
            </div>
          ) : active.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aktyvių priedų kol kas nėra.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {active.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{a.label || a.key}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {a.ends_at ? `iki ${fmtDate(a.ends_at)}` : "paruošta naudoti"}
                    </Badge>
                    {addonByKey(a.key)?.actionTo && (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={addonByKey(a.key)?.actionTo as never}>
                          {addonByKey(a.key)?.actionLabel ?? "Tvarkyti"}<ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </section>
      )}
    </DashboardShell>
  );
}

function HubLink({
  to, label, hint, icon: Icon = ChevronRight,
}: { to: string; label: string; hint: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition hover:border-cyclamen active:scale-[0.98]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyclamen/10">
        <Icon className="h-4 w-4 text-cyclamen" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="border-b border-border pb-2 font-display text-xl font-semibold">{title}</h2>;
}

function AddonCard({ addon, pending, onBuy, compact = false }: { addon: AddonItem; pending: boolean; onBuy: () => void; compact?: boolean }) {
  return (
    <Card className="flex flex-col rounded-lg p-5 shadow-none transition hover:border-foreground/30">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="outline">{addon.audience ?? (addon.days > 0 ? `${addon.days} d.` : "Vienkartinė")}</Badge>
        <div className="text-right">
          <div className="font-display text-2xl leading-none">{eurFromNumber(addon.eur)}</div>
        </div>
      </div>
      <h3 className="mt-4 font-display text-lg leading-snug">{addon.label}</h3>
      {!compact && <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{addon.description}</p>}
      <Button className="mt-4 w-full btn-press" disabled={pending} onClick={onBuy}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pirkti ir kurti
      </Button>
    </Card>
  );
}
