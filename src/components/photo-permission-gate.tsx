import { useCallback, useRef, useState } from "react";
import { Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";

const KEY = "pg_photos_rationale";

/**
 * Store-review requirement: explain why we need gallery/camera access before
 * the OS picker appears. Shown once per device, then remembered.
 */
export function usePhotoPermissionGate() {
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const guard = useCallback((action: () => void) => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(KEY) === "1";
    } catch {
      seen = true;
    }
    if (seen) return action();
    pending.current = action;
    setOpen(true);
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* private mode */
    }
    setOpen(false);
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const dialog = (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => { if (!v) { pending.current = null; setOpen(false); } }}
      title="Prieiga prie nuotraukų"
      description="Nuotraukas naudojame tik tavo profiliui ir darbų galerijai. Pasirinktus failus įkeliame į tavo paskyrą — jokios kitos bibliotekos dalies nematome."
    >
      <div className="grid gap-3 pb-2">
        <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4">
          <Images className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Toliau telefonas paklaus leidimo — tai standartinis sistemos patvirtinimas. Leidimą gali bet kada atšaukti telefono nustatymuose.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={() => { pending.current = null; setOpen(false); }}>
            Atšaukti
          </Button>
          <Button type="button" className="gradient-gold h-12 rounded-2xl text-primary-foreground btn-press" onClick={accept}>
            Tęsti
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );

  return { guard, dialog };
}
