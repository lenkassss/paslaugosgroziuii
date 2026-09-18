import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Settings2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { upsertComponentStyle, type ElementStyles } from "@/lib/component-styles.functions";
import { useElementStyle, toCss } from "@/lib/use-component-styles";
import { useCmsEditing } from "@/lib/cms-mode";
import { useIsSuperAdmin } from "@/components/inline-cms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toastError } from "@/lib/error-messages";
import { cn } from "@/lib/utils";

const SHAPES: { key: NonNullable<ElementStyles["shape"]>; label: string }[] = [
  { key: "circle", label: "Apskritimas" },
  { key: "rounded", label: "Apvalinta" },
  { key: "pill", label: "Kapsulė" },
  { key: "flat", label: "Plokščia" },
];
const SHADOWS: { key: NonNullable<ElementStyles["shadow"]>; label: string }[] = [
  { key: "none", label: "Be šešėlio" },
  { key: "soft", label: "Švelnus" },
  { key: "elevated", label: "Iškeltas" },
];

/**
 * Apvalkalas, leidžiantis super administratoriui redagavimo režimu keisti
 * elemento formą, spalvas, rėmelį, šešėlį ir matomumą tiesiog puslapyje.
 */
export function Styleable({
  elementKey, label, children, className,
}: { elementKey: string; label: string; children: (style: React.CSSProperties) => ReactNode; className?: string }) {
  const isSuper = useIsSuperAdmin();
  const on = useCmsEditing();
  const row = useElementStyle(elementKey);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ElementStyles>(row?.styles ?? {});
  const qc = useQueryClient();
  const save = useServerFn(upsertComponentStyle);

  useEffect(() => { setDraft(row?.styles ?? {}); }, [row?.styles]);

  const m = useMutation({
    mutationFn: (payload: { styles: ElementStyles; is_visible?: boolean }) =>
      save({ data: { element_key: elementKey, styles: payload.styles, is_visible: payload.is_visible } as never }),
    onSuccess: () => {
      toast.success("Išvaizda išsaugota");
      qc.invalidateQueries({ queryKey: ["component-styles"] });
      setOpen(false);
    },
    onError: (e: Error) => toastError(e),
  });

  const visible = row?.is_visible !== false;
  const css = toCss(on ? draft : row?.styles);

  if (!visible && !(isSuper && on)) return null;
  if (!isSuper || !on) return <>{children(css)}</>;

  const patch = (p: Partial<ElementStyles>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div className={cn("relative", className, !visible && "opacity-40")}>
      {children(css)}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Redaguoti: ${label}`}
        className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-cyclamen text-white shadow-elegant"
      >
        <Settings2 className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{label} — išvaizda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Forma</Label>
              <div className="grid grid-cols-4 gap-2">
                {SHAPES.map((s) => (
                  <Button
                    key={s.key}
                    type="button"
                    variant={draft.shape === s.key ? "default" : "outline"}
                    className="h-9 rounded-xl px-2 text-[11px]"
                    onClick={() => patch({ shape: s.key })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {([
                { key: "fill", label: "Fonas" },
                { key: "border_color", label: "Rėmelis" },
                { key: "color", label: "Tekstas" },
              ] as const).map((c) => (
                <div key={c.key} className="space-y-1">
                  <Label className="text-[11px]">{c.label}</Label>
                  <input
                    type="color"
                    aria-label={c.label}
                    value={(draft[c.key] as string) ?? "#ffffff"}
                    onChange={(e) => patch({ [c.key]: e.target.value } as Partial<ElementStyles>)}
                    className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent"
                  />
                </div>
              ))}
            </div>

            {([
              { key: "fill_alpha", label: "Fono skaidrumas", min: 0, max: 1, step: 0.05, def: 1 },
              { key: "border_width", label: "Rėmelio plotis", min: 0, max: 8, step: 1, def: 1 },
              { key: "padding", label: "Vidinis tarpas", min: 0, max: 48, step: 2, def: 12 },
              { key: "width", label: "Plotis", min: 60, max: 320, step: 4, def: 112 },
              { key: "height", label: "Aukštis", min: 60, max: 320, step: 4, def: 112 },
              { key: "font_size", label: "Teksto dydis", min: 10, max: 32, step: 1, def: 12 },
              { key: "margin", label: "Išorinis tarpas", min: 0, max: 64, step: 2, def: 0 },
              { key: "gap", label: "Tarpas tarp elementų", min: 0, max: 48, step: 2, def: 0 },
            ] as const).map((s) => (
              <div key={s.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{s.label}</span>
                  <span>{(draft[s.key] as number | undefined) ?? s.def}</span>
                </div>
                <Slider
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={[(draft[s.key] as number | undefined) ?? s.def]}
                  onValueChange={([v]) => patch({ [s.key]: v } as Partial<ElementStyles>)}
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label className="text-xs">Šešėlis</Label>
              <div className="grid grid-cols-3 gap-2">
                {SHADOWS.map((s) => (
                  <Button
                    key={s.key}
                    type="button"
                    variant={draft.shadow === s.key ? "default" : "outline"}
                    className="h-9 rounded-xl px-2 text-[11px]"
                    onClick={() => patch({ shadow: s.key })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-xl"
                onClick={() => m.mutate({ styles: draft, is_visible: !visible })}
              >
                {visible ? <><EyeOff className="mr-2 h-4 w-4" /> Paslėpti</> : <><Eye className="mr-2 h-4 w-4" /> Rodyti</>}
              </Button>
              <Button
                className="h-11 flex-1 rounded-xl"
                disabled={m.isPending}
                onClick={() => m.mutate({ styles: draft })}
              >
                Išsaugoti pakeitimus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
