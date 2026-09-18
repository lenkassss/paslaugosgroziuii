import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { submitSupplierRequest } from "@/lib/payments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Truck, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/for-suppliers")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Tiekėjams · PaslaugosGrožiui" },
      { name: "description", content: "Norite parduoti grožio priemones, įrangą ar organizuoti mokymus tūkstančiams meistrų Lietuvoje? Užpildykite užklausą — susisieksime." },
      { property: "og:title", content: "Tiekėjams · PaslaugosGrožiui" },
      { property: "og:description", content: "Ekskluzyvi B2B rinkos vieta grožio tiekėjams. Užpildykite užklausą." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function Page() {
  const fn = useServerFn(submitSupplierRequest);
  const [f, setF] = useState({ company_name: "", contact_name: "", email: "", phone: "", website: "", products_description: "" });
  const [sent, setSent] = useState(false);

  const mut = useMutation({
    mutationFn: () => fn({ data: f }),
    onSuccess: () => { setSent(true); toast.success("Užklausa gauta"); },
    onError: (e) => toastError(e),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-16">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-gold text-primary-foreground mb-4"><Truck className="h-6 w-6" /></div>
        <h1 className="font-display text-4xl md:text-5xl">Tiekėjams</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Tiekėjo paskyra nėra viešai perkama — kad apsaugotume meistrus nuo suklastotų prekių, kiekvieną tiekėją patvirtiname rankiniu būdu. Užpildykite žemiau esančią užklausą ir susisieksime per 2 darbo dienas.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-10">
        {[
          { icon: ShieldCheck, title: "Patvirtinta pardavimo vieta", text: "Kiekvienas tiekėjas rankiniu būdu patikrinamas — jokių fake gaminių." },
          { icon: Users, title: "Tiesioginis B2B srautas", text: "Prieiga prie salonų ir meistrų kontaktų, užklausų srauto ir mokymų publikavimo." },
          { icon: Truck, title: "Rinkos vieta", text: "Įkelkite produktus, mes tvarkome užsakymus. Platformos mokestis — vos 0,49 € už užsakymą." },
        ].map((x, i) => (
          <Card key={i} className="p-5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3"><x.icon className="h-5 w-5" /></div>
            <div className="font-medium">{x.title}</div>
            <p className="text-sm text-muted-foreground mt-1">{x.text}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 md:p-8 mt-10 shadow-elegant">
        {sent ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
            <h2 className="mt-4 font-display text-2xl">Užklausa gauta</h2>
            <p className="mt-2 text-sm text-muted-foreground">Susisieksime su jumis el. paštu per 2 darbo dienas.</p>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          >
            <h2 className="font-display text-2xl">Tiekėjo užklausa</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Įmonės pavadinimas" required value={f.company_name} onChange={(v) => setF({ ...f, company_name: v })} />
              <Field label="Kontaktinis asmuo" required value={f.contact_name} onChange={(v) => setF({ ...f, contact_name: v })} />
              <Field label="El. paštas" type="email" required value={f.email} onChange={(v) => setF({ ...f, email: v })} />
              <Field label="Telefonas" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
            </div>
            <Field label="Svetainė" value={f.website} onChange={(v) => setF({ ...f, website: v })} />
            <div>
              <Label>Ką parduodate arba organizuojate? *</Label>
              <Textarea required minLength={20} rows={5} value={f.products_description} onChange={(e) => setF({ ...f, products_description: e.target.value })} placeholder="Aprašykite savo produktus, prekės ženklus, mokymus, seminarus…" />
            </div>
            <Button disabled={mut.isPending} type="submit" className="gradient-gold text-primary-foreground w-full sm:w-auto">Siųsti užklausą</Button>
          </form>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <Input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
