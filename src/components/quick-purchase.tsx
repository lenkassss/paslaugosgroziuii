import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { purchaseAddon } from "@/lib/addons.functions";
import { addonsForRole, type AddonItem } from "@/lib/addons";
import { toastError } from "@/lib/error-messages";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/use-language";
import { uiText } from "@/lib/ui-copy";

const eur = (n: number) => `€${n.toFixed(2)}`;

/**
 * Papildomos paslaugos – tvarkingos išskleidžiamos kortelės.
 * Paspaudus prekę iškart iškyla patvirtinimas ir apmokama išsaugota kortele.
 */
export function QuickPurchaseList({ role, className }: { role?: string | null; className?: string }) {
  const { lang } = useLanguage();
  const copy = (value: string) => uiText(value, lang);
  const items = addonsForRole(role);
  const cards: Array<{ id: string; title: string; hint: string; list: AddonItem[]; link?: { to: string; label: string } }> = [
    {
      id: "packs",
      title: "Skelbimų paketai",
      hint: "Nuo €0.99 už skelbimą",
      list: items.filter((a) => a.key.startsWith("classified_pack_")),
    },
    {
      id: "ads",
      title: "Banerinė reklama / straipsniai",
      hint: "Banerio reklama 3–30 d.",
      list: items.filter((a) => a.key.startsWith("banner_")),
      link: { to: "/dashboard/salon/promote", label: "Tvarkyti reklamą ir straipsnius" },
    },
    // Skelbikui mokymų ir modelių paieškos kortelės nerodomos.
    ...(role === "advertiser"
      ? []
      : [{
      id: "courses",
      title: "Mokymai / seminarai",
      hint: "1 nuo €9.99 · 3 už €24.99 · 5 už €36.99",
      list: items.filter((a) => a.key.startsWith("course_pack_")),
      link: { to: "/dashboard/salon/content", label: "Skelbti mokymus" },
    },
    {
      id: "models",
      title: "Ieškomi modeliai",
      hint: "1 nuo €3.99 · 3 už €9.99 · 5 už €14.99",
      list: items.filter((a) => a.key.startsWith("model_pack_")),
      link: { to: "/dashboard/salon/models", label: "Ieškoti modelio" },
    }]),
    {
      id: "offers",
      title: "Specialūs pasiūlymai",
      hint: "7, 14, 21 d. arba mėnesiui",
      list: items.filter((a) => a.key.startsWith("special_offer_")),
    },
    // B2B tiekėjų pasiūlymus mato tik meistrės, salonai ir tiekėjai.
    ...(role === "salon" || role === "staff" || role === "supplier" || role === "admin" || role === "super_admin"
      ? [{
          id: "b2b",
          title: "Tiekėjų pasiūlymai",
          hint: "Pasiūlymai grožio profesionalams",
      list: items.filter((a) => a.key === "supplier_offers" || a.key === "newsletter"),

          link: { to: "/feed/akcijos", label: "Naršyti tiekėjų pasiūlymus" },
        }]
      : []),
  ].filter((c) => c.list.length > 0 || c.link);

  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<AddonItem | null>(null);
  const qc = useQueryClient();
  const buy = useServerFn(purchaseAddon);
  const m = useMutation({
    mutationFn: (key: string) => buy({ data: { key } }),
    onSuccess: (r) => {
      toast.success(`Apmokėta: ${r.label} (${eur(r.amount)})`);
      qc.invalidateQueries({ queryKey: ["my-addons"] });
      setPending(null);
    },
    onError: (e: Error) => { toastError(e); setPending(null); },
  });

  if (cards.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {cards.map((c) => {
        const isOpen = open === c.id;
        return (
          <div key={c.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : c.id)}
              aria-expanded={isOpen}
              className="flex min-h-13 w-full items-center gap-2 px-4 py-3 text-left transition active:scale-[0.99]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{copy(c.title)}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{copy(c.hint)}</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300", !isOpen && "-rotate-90")} />
            </button>
            <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="min-h-0 overflow-hidden">
              <div className="divide-y divide-border/60 border-t border-border/60">
                {c.list.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setPending(a)}
                    className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-secondary active:scale-[0.99]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{a.label}</span>
                      {a.audience && <span className="block text-[11px] text-muted-foreground">{a.audience}</span>}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-cyclamen">{eur(a.eur)}</span>
                  </button>
                ))}
                {c.link && (
                  <Link
                    to={c.link.to as never}
                    className="flex min-h-12 items-center px-4 py-2.5 text-sm font-semibold text-cyclamen"
                  >
                    {copy(c.link.label)}
                  </Link>
                )}
              </div>
              </div>
            </div>
          </div>
        );
      })}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy("Patvirtinkite užsakymą")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && `Ar tikrai norite užsisakyti „${pending.label}“ už ${eur(pending.eur)}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{copy("Atšaukti")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              disabled={m.isPending}
              onClick={(e) => { e.preventDefault(); if (pending) m.mutate(pending.key); }}
            >
              {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {copy("Apmokėti išsaugota kortele")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
