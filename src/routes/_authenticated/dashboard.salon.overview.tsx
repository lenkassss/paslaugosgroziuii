import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { MembershipBanner } from "@/components/membership-banner";
import { useQuery } from "@tanstack/react-query";

import { getSalonDashboard } from "@/lib/platform.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Euro, ListChecks, Users, Megaphone } from "lucide-react";
import { fmtDate, fmtMoney } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsPro } from "@/components/pro-gate";


export const Route = createFileRoute("/_authenticated/dashboard/salon/overview")({
  component: SalonOverview,
});

function SalonOverview() {
  const { isPro } = useIsPro();
  const { data, isLoading } = useQuery({
    queryKey: ["salon-dashboard"],
    queryFn: () => getSalonDashboard({ data: undefined }),
  });

  if (isLoading || !data) {
    return (
      <DashboardShell>
        <Skeleton className="h-24 w-full mb-6" />
        <div className="grid sm:grid-cols-3 gap-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      </DashboardShell>
    );
  }

  const { profile, appointments, services, staff, salonProfile } = data;
  const isStaff = !!staff;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mtdRevenue = appointments.filter((a) => new Date(a.created_at) >= monthStart && a.status !== "cancelled").length * 40;
  const upcoming = appointments.filter((a) => new Date(a.appointment_date) >= new Date(now.toISOString().slice(0,10))).slice(0, 8);
  const displayName = isStaff ? staff.staff_name : profile?.business_name;

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-2">Sveiki, {displayName || "salone"}</h1>
      {isStaff && (
        <div className="mb-6 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Meistrės demo paskyra · {salonProfile?.business_name ?? "salonas"} · rodoma tik tavo asmeninė dienotvarkė ir tau priskirtos rezervacijos.
        </div>
      )}
      <MembershipBanner active={!!profile?.subscription_active} isPro={profile?.membership_level === "pro"} expiresAt={profile?.subscription_expires_at} ctaPath="/dashboard/salon/membership" />
      <OnboardingGuide
        hasMembership={!!profile?.subscription_active}
        hasProfile={!!profile?.business_name && !!profile?.city}
        hasServices={services.length > 0}
        isVerified={profile?.verification_status === "verified"}
        isPro={isPro}
      />
      {isPro && <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label={isStaff ? "Mano rezervacijos" : "Visi užsakymai"} value={appointments.length} />
        <StatCard icon={Euro} label="Šio mėn. simuliuojamos pajamos" value={fmtMoney(mtdRevenue)} />
        <StatCard icon={ListChecks} label={isStaff ? "Salono paslaugos" : "Paslaugos"} value={services.length} />
      </div>}
      {!isStaff && <PromoteCard profile={profile} />}
      {isPro && <Card className="p-6">
        <h2 className="font-display text-xl mb-3">{isStaff ? "Mano artimiausios rezervacijos" : "Artimiausios rezervacijos"}</h2>

        <div className="space-y-2">
          {upcoming.length === 0 && <div className="text-sm text-muted-foreground py-4">Kol kas rezervacijų nėra.</div>}
          {upcoming.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/40 transition">
              <div>
                <div className="font-medium text-sm">{a.service_name}</div>
                <div className="text-xs text-muted-foreground">{a.client_name} · {a.client_phone}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{fmtDate(a.appointment_date)}</div>
                <div className="text-xs text-muted-foreground">{a.time_slot.slice(0,5)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>}
    </DashboardShell>
  );
}

function OnboardingGuide({ hasMembership, hasProfile, hasServices, isVerified, isPro }: { hasMembership: boolean; hasProfile: boolean; hasServices: boolean; isVerified: boolean; isPro: boolean }) {
  const steps = [
    { done: hasMembership, title: "1. Įsigykite narystę", text: "Be aktyvios narystės jūsų profilis nėra rodomas paieškoje ir klientai negali rezervuoti.", to: "/dashboard/salon/membership", cta: "Peržiūrėti narystes" },
    { done: hasProfile, title: "2. Užpildykite profilį", text: "Pridėkite pavadinimą, miestą, aprašymą ir nuotraukas – taip klientai jumis labiau patiki.", to: "/dashboard/salon/profile", cta: "Pildyti profilį" },
    ...(isPro ? [{ done: hasServices, title: "3. Sukurkite paslaugas", text: "Nurodykite paslaugų pavadinimus, trukmę ir kainas – be jų rezervacija neįmanoma.", to: "/dashboard/salon/services", cta: "Pridėti paslaugas" }] : []),
    { done: isVerified, title: "4. Patvirtinkite paskyrą", text: "Pateikite dokumentus ir gaukite „Patikrintas“ ženklelį – patikrintos paskyros gauna daugiau rezervacijų.", to: "/dashboard/salon/verification", cta: "Pateikti patikrinimui" },
  ];
  const left = steps.filter((s) => !s.done);
  if (left.length === 0) return null;
  return (
    <Card className="mb-6 max-w-full overflow-hidden p-5">
      <h2 className="font-display text-xl">Pirmi žingsniai</h2>
      <p className="mt-1 text-sm text-muted-foreground">Atlikite šiuos veiksmus, kad jūsų paskyra veiktų visu pajėgumu.</p>
      <div className="mt-4 space-y-3">
        {left.map((s) => (
          <div key={s.title} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/60 p-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{s.text}</div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link to={s.to}>{s.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <Card className="p-5 hover-lift">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-display font-semibold">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-lg gradient-gold flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
}

function PromoteCard({ profile }: { profile: any }) {
  const active = !!profile?.is_featured && profile?.featured_until && new Date(profile.featured_until) > new Date();
  const trialUsed = !!profile?.first_membership_at;

  return (
    <Card className="p-5 mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg gradient-gold flex items-center justify-center shrink-0">
            <Megaphone className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold">Reklamuoti savo saloną</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {active
                ? "Šiuo metu jūs esate reklamuojamas salonas — rodomas viršuje feed'e, paieškoje ir žemėlapyje su auksiniu ženkleliu."
                : trialUsed
                  ? "Rinkitės planą: €4.99/sav, €10.99/mėn arba €24.99/3 mėn. VIP TOP kortelė garantuoja pirmą vietą."
                  : "Naujiems salonams — pirma savaitė NEMOKAMAI. Peržiūrėkite planus ir aktyvuokite paryškinimą."}
            </p>
            {active && profile?.featured_until && (
              <div className="mt-2 text-xs text-primary font-medium">Aktyvu iki: {new Date(profile.featured_until).toLocaleDateString("lt-LT")}</div>
            )}
          </div>
        </div>
        <Button asChild className="gradient-gold text-primary-foreground shrink-0">
          <Link to="/dashboard/salon/featured">{active ? "Valdyti" : "Peržiūrėti planus"}</Link>
        </Button>
      </div>
    </Card>
  );
}

