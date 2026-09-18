import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDemoCard, deleteCard, listMyCards, setDefaultCard } from "@/lib/policies.functions";
import { CreditCard, Loader2, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { toastError } from "@/lib/error-messages";

export function useMyCards() {
  const list = useServerFn(listMyCards);
  return useQuery({ queryKey: ["my-cards"], queryFn: () => list(), retry: false });
}

export function PaymentCardPicker({
  selectedId,
  onSelect,
  compact = false,
}: {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useMyCards();
  const add = useServerFn(addDemoCard);
  const del = useServerFn(deleteCard);
  const setDef = useServerFn(setDefaultCard);

  const [open, setOpen] = useState(false);
  const [num, setNum] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/29");
  const [holder, setHolder] = useState("");

  const addMut = useMutation({
    mutationFn: () => {
      const [m, y] = exp.split("/");
      return add({ data: {
        cardNumber: num,
        expMonth: Number(m),
        expYear: 2000 + Number(y),
        holder,
        makeDefault: true,
      } });
    },
    onSuccess: (r) => {
      toast.success("Kortelė pridėta");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["my-cards"] });
      if (r?.card?.id) onSelect?.(r.card.id);
    },
    onError: (e) => {
      const msg = (e as Error).message;
      toast.error(msg === "DEMO_INVALID_CARD" ? "Demo režime naudok kortelę 4242 4242 4242 4242" : msg);
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { cardId: id } }),
    onSuccess: () => { toast.success("Kortelė pašalinta"); qc.invalidateQueries({ queryKey: ["my-cards"] }); },
    onError: (e) => toastError(e),
  });

  const defMut = useMutation({
    mutationFn: (id: string) => setDef({ data: { cardId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-cards"] }),
  });

  const cards = data?.cards ?? [];
  const active = selectedId ?? cards.find((c) => c.is_default)?.id ?? cards[0]?.id ?? null;

  return (
    <div className="space-y-2">
      {isLoading && <div className="skeleton h-14 rounded-xl" />}
      {cards.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => { onSelect?.(c.id); if (!c.is_default) defMut.mutate(c.id); }}
          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${active === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold text-primary-foreground">
            <CreditCard className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{c.brand} •••• {c.last4}</span>
            <span className="block text-[11px] text-muted-foreground">
              {String(c.exp_month).padStart(2, "0")}/{String(c.exp_year).slice(-2)}
              {c.holder ? ` · ${c.holder}` : ""}
            </span>
          </span>
          {active === c.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
          {!compact && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); delMut.mutate(c.id); }}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </span>
          )}
        </button>
      ))}

      {!open ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
          <Plus className="mr-1.5 h-4 w-4" /> Pridėti kortelę
        </Button>
      ) : (
        <div className="space-y-2 rounded-xl border border-primary/30 bg-card/60 p-3">
          <div>
            <Label className="text-xs">{t("booking.cardNumber")}</Label>
            <Input value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t("booking.cardExpiry")}</Label>
              <Input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="12/29" />
            </div>
            <div>
              <Label className="text-xs">{t("booking.cardHolder")}</Label>
              <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder={t("booking.cardHolder")} />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Demo režimas: veikia tik testinė kortelė <strong>4242 4242 4242 4242</strong>. Tikri duomenys nesaugomi.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="flex-1">Atšaukti</Button>
            <Button
              type="button"
              size="sm"
              disabled={addMut.isPending || holder.length < 2}
              onClick={() => addMut.mutate()}
              className="flex-1 gradient-gold text-primary-foreground"
            >
              {addMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Išsaugoti
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
