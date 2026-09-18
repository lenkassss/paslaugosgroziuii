import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { GraduationCap, Clock, ArrowRight, Lock } from "lucide-react";
import { GatedContent } from "@/components/gated-content";
import { useAuth } from "@/lib/auth-context";

const TEASER_COURSE = {
  title: "Manikiūro meistriškumo klasė – gelinis dizainas 2026",
  school: "Vilnius Beauty Academy",
  city: "Vilnius",
  date: "2026-08-12",
  price: "€149",
  tier: "Auksas",
};

export function HomeGatedTeasers() {
  const { user } = useAuth();
  const [gate, setGate] = useState<string | null>(null);

  return (
    <section className="mb-12 space-y-8 md:space-y-10">
      <TeaserBlock
        icon={GraduationCap}
        eyebrow="Mokymai"
        title="Grožio mokyklos ir kursai"
        desc="Sertifikuoti mokymai iš patikimų grožio akademijų."
        to="/mokyklos"
        label="Kursai"
        user={!!user}
        onGate={() => setGate("Kursai")}
      >
        <Card className="p-5 border-border/60">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">{TEASER_COURSE.tier}</Badge>
            <Badge variant="secondary" className="text-[10px]">{TEASER_COURSE.city}</Badge>
          </div>
          <h3 className="font-display text-lg leading-tight">{TEASER_COURSE.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{TEASER_COURSE.school}</p>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {TEASER_COURSE.date}</span>
            <span className="font-display text-base text-primary">{TEASER_COURSE.price}</span>
          </div>
        </Card>
      </TeaserBlock>

      <Dialog open={!!gate} onOpenChange={(o) => !o && setGate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center font-display text-xl">Prisijunk, kad pamatytum</DialogTitle>
            <DialogDescription className="text-center">
              {gate} matomi tik registruotiems PaslaugosGrožiui vartotojams. Registracija nemokama ir užtrunka minutę.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full gradient-gold text-primary-foreground">
              <Link to="/auth" search={{ mode: "signup" }}>Registruotis</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth" search={{ mode: "signin" }}>Prisijungti</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function TeaserBlock({
  icon: Icon, eyebrow, title, desc, to, label, user, onGate, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string; title: string; desc: string; to: string; label: string;
  user: boolean; onGate: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            <Icon className="h-3.5 w-3.5 shrink-0" /> {eyebrow}
          </div>
          <h2 className="mt-1 font-display text-xl sm:text-2xl md:text-3xl">{title}</h2>
          <p className="mt-1 hidden max-w-xl text-sm text-muted-foreground sm:block">{desc}</p>
        </div>
        {/* Desktop: direct link. Mobile handled by the CTA below. */}
        <Button asChild variant="outline" size="sm" className="hidden shrink-0 md:inline-flex">
          <Link to={to}>Peržiūrėti visus <ArrowRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      </div>

      {/* Desktop / tablet: a single locked preview card */}
      <div className="hidden md:block">
        <div className="max-w-md">
          <GatedContent label={label}>{children}</GatedContent>
        </div>
      </div>

      {/* Mobile: keep the page light — one clear CTA */}
      <div className="md:hidden">
        {user ? (
          <Button asChild variant="outline" className="w-full h-11">
            <Link to={to}>Peržiūrėti visus <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        ) : (
          <Button variant="outline" className="w-full h-11" onClick={onGate}>
            <Lock className="mr-1.5 h-4 w-4" /> Peržiūrėti visus
          </Button>
        )}
      </div>
    </div>
  );
}
