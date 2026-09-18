import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import {
  getLocationConsent,
  onLocationRequest,
  setLocationConsent,
} from "@/lib/location-consent";

/**
 * Store-review requirement: explain WHY we need location before the OS prompt.
 * Mounted once in the root; appears only when a component actually needs a
 * position and the user has not decided yet.
 */
export function LocationConsentPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => onLocationRequest(() => {
    if (getLocationConsent() === "unknown") setOpen(true);
  }), []);

  const decide = (granted: boolean) => {
    setOpen(false);
    setLocationConsent(granted ? "granted" : "denied");
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => { if (!v) decide(false); }}
      title="Rodyti salonus netoli tavęs?"
      description="Naudosime tik apytikslę tavo vietą, kad parodytume atstumą iki salonų ir artimiausius laisvus laikus. Vietos niekada nesaugome viešai ir neperduodame trečiosioms šalims."
    >
      <div className="grid gap-3 pb-2">
        <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Leidus, telefonas paklaus dar kartą — tai standartinis sistemos patvirtinimas. Gali atsisakyti, viskas veiks ir be vietos.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={() => decide(false)}>
            Ne dabar
          </Button>
          <Button type="button" className="gradient-gold h-12 rounded-2xl text-primary-foreground btn-press" onClick={() => decide(true)}>
            Leisti vietą
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
