import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyVerification, submitVerification } from "@/lib/payments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ShieldAlert, Clock, XCircle, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/salon/verification")({ component: Page });

async function uploadDoc(file: File, tag: string): Promise<string> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id ?? "anon";
  const path = `${uid}/${tag}-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("verification-docs").upload(path, file, { upsert: true });
  if (error) throw error;
  const signed = await supabase.storage.from("verification-docs").createSignedUrl(path, 60 * 60 * 24 * 365);
  return signed.data?.signedUrl ?? path;
}

const COPY: Record<string, { title: string; intro: string; bizLabel: string; addrLabel: string; extra?: string }> = {
  school: {
    title: "Mokyklos patvirtinimas",
    intro: "Kad kursai taptų vieši ir mokiniai galėtų registruotis, patvirtink mokyklą: įkelk vadovo asmens dokumentą, įmonės registracijos pažymėjimą ir mokymo licenciją / akreditaciją.",
    bizLabel: "Įmonės registracijos pažymėjimas (VĮ Registrų centras)",
    addrLabel: "Mokymo licencija / akreditacija arba patalpų nuomos sutartis",
    extra: "Nurodyk mokymo programas, dėstytojų kvalifikaciją ir išduodamų sertifikatų tipą.",
  },
  employer: {
    title: "Darbdavio patvirtinimas",
    intro: "Kad darbo skelbimai taptų vieši, patvirtink darbdavį: įkelk atstovo asmens dokumentą ir įmonės registracijos pažymėjimą. Taip apsaugome meistres nuo apgaulingų skelbimų.",
    bizLabel: "Įmonės registracijos pažymėjimas / individualios veiklos pažyma",
    addrLabel: "Darbo vietos adreso patvirtinimas (nuomos sutartis / sąskaita)",
    extra: "Nurodyk įmonės kodą, veiklos sritį ir kontaktinį asmenį personalo klausimais.",
  },
  salon: {
    title: "Salono patikrinimas",
    intro: "Kad klientai galėtų rezervuoti vizitus, tavo salonas turi būti patvirtintas. Įkelk asmens dokumentą, savininko selfie ir verslo pažymėjimą — mūsų komanda peržiūrės per 24 val.",
    bizLabel: "Verslo pažymėjimas / individualios veiklos pažyma",
    addrLabel: "Adreso patvirtinimas (sąskaita / nuomos sutartis)",
  },
};

function Page() {
  const qc = useQueryClient();
  const { role } = useAuth();
  const kind = role === "school" ? "school" : "salon";
  const copy = COPY[kind];
  const getFn = useServerFn(getMyVerification);
  const subFn = useServerFn(submitVerification);
  const q = useQuery({ queryKey: ["my-verification"], queryFn: () => getFn() });

  const [idUrl, setIdUrl] = useState("");
  const [bizUrl, setBizUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [addrUrl, setAddrUrl] = useState("");
  const [atHome, setAtHome] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (q.data?.verification_docs) {
      const d = q.data.verification_docs as Record<string, string | boolean>;
      setIdUrl(String(d.id_document_url ?? ""));
      setBizUrl(String(d.business_document_url ?? ""));
      setSelfieUrl(String(d.selfie_url ?? ""));
      setAddrUrl(String(d.address_proof_url ?? ""));
      setAtHome(!!q.data.at_home_service);
    }
  }, [q.data]);

  const status = q.data?.verification_status ?? "unverified";

  const submit = useMutation({
    mutationFn: () => subFn({ data: {
      id_document_url: idUrl, business_document_url: bizUrl || undefined,
      selfie_url: selfieUrl, address_proof_url: addrUrl || undefined,
      at_home_service: atHome, notes,
    } }),
    onSuccess: () => { toast.success("Dokumentai išsiųsti peržiūrai"); qc.invalidateQueries({ queryKey: ["my-verification"] }); },
    onError: (e) => toastError(e),
  });

  const badge = status === "verified"
    ? { icon: BadgeCheck, cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40", label: "Patvirtinta" }
    : status === "pending"
    ? { icon: Clock, cls: "bg-amber-500/15 text-amber-600 border-amber-500/40", label: "Peržiūrima" }
    : status === "rejected"
    ? { icon: XCircle, cls: "bg-destructive/15 text-destructive border-destructive/40", label: "Atmesta" }
    : { icon: ShieldAlert, cls: "bg-muted text-muted-foreground", label: "Nepatikrinta" };

  return (
    <DashboardShell>
      <div className="mb-6 flex w-full max-w-full flex-col items-start gap-3 overflow-hidden sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="break-words font-display text-2xl sm:text-3xl">{copy.title}</h1>
          <p className="mt-1 max-w-2xl break-words text-sm text-muted-foreground">
            {copy.intro}
          </p>
        </div>
        <Badge variant="outline" className={`${badge.cls} px-3 py-1.5 text-sm`}><badge.icon className="h-4 w-4 mr-1.5" />{badge.label}</Badge>
      </div>

      {q.data?.rejection_reason && (
        <Card className="p-4 mb-4 border-destructive/40 bg-destructive/5">
          <p className="text-sm"><strong>Atmesta priežastis:</strong> {q.data.rejection_reason}</p>
        </Card>
      )}

      <Card className="w-full max-w-full overflow-hidden rounded-3xl p-4 space-y-5 sm:p-6">
        <FileField label="Asmens dokumentas (ID / pasas)" required value={idUrl} onFile={async (f) => setIdUrl(await uploadDoc(f, "id"))} />
        <FileField label={kind === "salon" ? "Savininko selfie su dokumentu" : "Atstovo selfie su dokumentu"} required value={selfieUrl} onFile={async (f) => setSelfieUrl(await uploadDoc(f, "selfie"))} />
        <FileField label={copy.bizLabel} required={kind !== "salon"} value={bizUrl} onFile={async (f) => setBizUrl(await uploadDoc(f, "biz"))} />
        <FileField label={copy.addrLabel} value={addrUrl} onFile={async (f) => setAddrUrl(await uploadDoc(f, "addr"))} />

        {kind === "salon" && (
        <label className="flex w-full max-w-full flex-col gap-2 overflow-hidden rounded-2xl border border-border/60 bg-secondary/20 p-4 cursor-pointer transition active:scale-[0.99] hover:bg-secondary/40">
          <span className="flex w-full min-w-0 items-center gap-3">
            <input
              type="checkbox"
              checked={atHome}
              onChange={(e) => setAtHome(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-primary"
            />
            <span className="min-w-0 flex-1 break-words text-sm font-medium">Paslaugas teikiu namuose</span>
          </span>
          <span className="block w-full break-words text-xs leading-relaxed text-muted-foreground">
            Jei ženklinsi šį lauką, patikrinimas bus griežtesnis — reikės papildomo adreso patvirtinimo saugumui užtikrinti.
          </span>
        </label>
        )}

        <div>
          <Label>Papildoma informacija</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={copy.extra ?? "Neprivaloma"} />
        </div>

        <Button
          className="gradient-gold text-primary-foreground"
          disabled={!idUrl || !selfieUrl || (kind !== "salon" && !bizUrl) || submit.isPending}
          onClick={() => submit.mutate()}
        >
          {status === "pending" ? "Atnaujinti ir siųsti iš naujo" : "Siųsti peržiūrai"}
        </Button>
      </Card>
    </DashboardShell>
  );
}

function FileField({ label, required, value, onFile }: { label: string; required?: boolean; value: string; onFile: (f: File) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm ${busy ? "opacity-50" : "hover:bg-secondary"}`}>
          <Upload className="h-4 w-4" /> {value ? "Pakeisti" : "Įkelti"}
          <input type="file" accept="image/*,.pdf" className="hidden" disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              setBusy(true); try { await onFile(f); toast.success("Įkelta"); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
            }} />
        </label>
        {value && <span className="text-xs text-emerald-600">✓ įkelta</span>}
      </div>
    </div>
  );
}
