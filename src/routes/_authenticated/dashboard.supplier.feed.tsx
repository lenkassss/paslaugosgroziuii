import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createPromo, deleteMyContent, listMyContent } from "@/lib/content.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import { Megaphone, Loader2, Trash2, Tag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard/supplier/feed")({
  component: SupplierOffers,
});

type Errors = Partial<Record<"title" | "body" | "discount" | "ends", string>>;

function SupplierOffers() {
  const qc = useQueryClient();
  const createFn = useServerFn(createPromo);
  const delFn = useServerFn(deleteMyContent);
  const mine = useQuery({ queryKey: ["my-content"], queryFn: () => listMyContent({ data: undefined }) });

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [discount, setDiscount] = useState("10");
  const [endsAt, setEndsAt] = useState("");
  const [audience, setAudience] = useState<"b2c" | "b2b">("b2b");
  const [touched, setTouched] = useState(false);

  const errors: Errors = useMemo(() => {
    const e: Errors = {};
    if (title.trim().length < 3) e.title = "Įrašykite bent 3 simbolius.";
    if (body.trim().length < 5) e.body = "Aprašykite pasiūlymą (bent 5 simboliai).";
    const d = Number(discount);
    if (!Number.isFinite(d) || d < 1 || d > 90) e.discount = "Nuolaida turi būti nuo 1 iki 90 %.";
    if (!endsAt) e.ends = "Pasirinkite, iki kada pasiūlymas galioja.";
    else if (new Date(endsAt).getTime() < Date.now()) e.ends = "Data turi būti ateityje.";
    return e;
  }, [title, body, discount, endsAt]);
  const invalid = Object.keys(errors).length > 0;

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          body_md: body.trim(),
          promo_discount_pct: Number(discount),
          promo_ends_at: new Date(endsAt).toISOString(),
          promo_service_ids: [],
          audience,
        },
      }),
    onSuccess: () => {
      toast.success(audience === "b2c" ? "Pasiūlymą matys tik klientai." : "Pasiūlymą matys tik profesionalai.");
      setTitle(""); setExcerpt(""); setBody(""); setDiscount("10"); setEndsAt(""); setTouched(false);
      qc.invalidateQueries({ queryKey: ["my-content"] });
      qc.invalidateQueries({ queryKey: ["promos"] });
    },
    onError: (e) => toastError(e),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Pasiūlymas pašalintas"); qc.invalidateQueries({ queryKey: ["my-content"] }); qc.invalidateQueries({ queryKey: ["promos"] }); },
    onError: (e) => toastError(e),
  });

  const promos = (mine.data?.items ?? []).filter((a: { kind?: string }) => a.kind === "promo");

  const err = (key: keyof Errors) => (touched && errors[key] ? <p className="mt-1 text-xs text-destructive">{errors[key]}</p> : null);

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
          <Megaphone className="h-3.5 w-3.5" /> Tiekėjo pasiūlymai
        </div>
        <h1 className="font-display text-3xl">Mano pasiūlymai</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Skelbk specialius pasiūlymus meistrėms ir salonams — jie pasirodo verslo pasiūlymų sraute.
        </p>
      </div>

      <Card className="mb-8 p-4 sm:p-5">
        <div className="grid gap-4">
          <div>
            <Label className="text-xs">Kam rodyti pasiūlymą?</Label>
            <Tabs value={audience} onValueChange={(value) => setAudience(value as "b2c" | "b2b")} className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="b2c">Klientams</TabsTrigger>
                <TabsTrigger value="b2b">Profesionalams</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="mt-2 text-xs text-muted-foreground">
              {audience === "b2c" ? "Bus rodoma tik klientų pasaulyje." : "Bus rodoma tik salonams, meistrams, tiekėjams ir mokykloms."}
            </p>
          </div>
          <div>
            <Label className="text-xs">Pavadinimas *</Label>
            <Input
              className="mt-1"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pvz. −20 % profesionaliems dažams"
              aria-invalid={touched && !!errors.title}
            />
            {err("title")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Nuolaida, % *</Label>
              <Input className="mt-1" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value)} aria-invalid={touched && !!errors.discount} />
              {err("discount")}
            </div>
            <div>
              <Label className="text-xs">Galioja iki *</Label>
              <Input className="mt-1" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} aria-invalid={touched && !!errors.ends} />
              {err("ends")}
            </div>
          </div>
          <div>
            <Label className="text-xs">Trumpas aprašas (nebūtina)</Label>
            <Input className="mt-1" value={excerpt} maxLength={300} onChange={(e) => setExcerpt(e.target.value)} placeholder="Vienas sakinys sraute" />
          </div>
          <div>
            <Label className="text-xs">Pasiūlymo aprašymas *</Label>
            <Textarea className="mt-1" rows={5} value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={touched && !!errors.body} />
            {err("body")}
          </div>

          {touched && invalid && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              Užpildykite pažymėtus laukus, kad galėtume paskelbti pasiūlymą.
            </div>
          )}

          <Button
            className="btn-press w-full sm:w-auto"
            disabled={create.isPending}
            onClick={() => { setTouched(true); if (!invalid) create.mutate(); }}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Skelbti pasiūlymą
          </Button>
        </div>
      </Card>

      <h2 className="font-display text-xl">Paskelbti pasiūlymai</h2>
      <div className="mt-3 space-y-3">
        {mine.isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        {!mine.isLoading && promos.length === 0 && (
          <EmptyState icon={Tag} title="Pasiūlymų dar nėra" description="Paskelbk pirmą pasiūlymą — jį iškart pamatys meistrės ir salonai." />
        )}
        {promos.map((p: { id: string; title: string; promo_discount_pct: number | null; promo_ends_at: string | null }) => (
          <Card key={p.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{p.title}</div>
              <div className="text-xs text-muted-foreground">
                {p.promo_discount_pct ? `−${p.promo_discount_pct}%` : "—"}
                {p.promo_ends_at ? ` · iki ${new Date(p.promo_ends_at).toLocaleDateString("lt-LT")}` : ""}
              </div>
            </div>
            <Badge variant="outline">Paskelbta</Badge>
            <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(p.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
