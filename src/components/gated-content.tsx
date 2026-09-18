import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  /** Roles allowed to see the content. If omitted, any authenticated user is allowed. */
  allow?: AppRole[];
  /** Short label used in the lock overlay ("Renginys", "Kursas", "Darbo pasiūlymas"). */
  label?: string;
};

export function GatedContent({ children, allow, label = "Turinys" }: Props) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);

  const allowed = !!user && (!allow || (role && allow.includes(role)));

  if (allowed) return <>{children}</>;

  return (
    <>
      <div className="relative group">
        <div className="pointer-events-none select-none filter blur-[6px] opacity-70">{children}</div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/40 backdrop-blur-[2px] transition hover:bg-background/60"
          aria-label={`Atrakinti ${label.toLowerCase()}`}
        >
          <div className="rounded-full bg-primary/90 text-primary-foreground p-3 shadow-elegant">
            <Lock className="h-5 w-5" />
          </div>
          <div className="mt-3 text-sm font-medium">Turinys „{label}" matomas tik prisijungusiems</div>
          <div className="mt-1 text-xs text-muted-foreground">Spustelėkite, kad prisijungtumėte</div>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Šis turinys matomas tik prisiregistravusiems</DialogTitle>
            <DialogDescription>
              Prisijunkite arba susikurkite PaslaugosGrožiui paskyrą, kad galėtumėte peržiūrėti pilną informaciją, registruotis ir susisiekti su organizatoriais.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" asChild>
              <Link to="/auth" search={{ mode: "signin" }}>Prisijungti</Link>
            </Button>
            <Button asChild className="gradient-gold text-primary-foreground">
              <Link to="/auth" search={{ mode: "signup" }}>Susikurti paskyrą</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
