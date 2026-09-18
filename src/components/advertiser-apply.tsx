import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";
import { getMyAdvertiserProfile, submitAdvertiserApplication } from "@/lib/advertiser.functions";
import { TIER_PRICING, eur } from "@/lib/access";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import { Loader2, Megaphone } from "lucide-react";

/**
 * „Tik skelbikas" paskyros anketa — pildo klientas, patvirtina administratorius.
 * Patvirtinus suteikiama skelbiko rolė ir 1 nemokamo skelbimo kreditas.
 */
export function AdvertiserApply() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const getFn = useServerFn(getMyAdvertiserProfile);
  const submitFn = useServerFn(submitAdvertiserApplication);
  const me = useQuery({ queryKey: ["my-advertiser"], queryFn: () => getFn(), retry: false, enabled: !!user });
  const [open, setOpen] = useState(false);

  const [personType, setPersonType] = useState<"individual" | "legal">("individual");
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [social, setSocial] = useState("");
  const [intent, setIntent] = useState("");

  const valid =
    fullName.trim().length >= 3 && /.+@.+\..+/.test(email) && phone.trim().length >= 6 && intent.trim().length >= 10;

  const mut = useMutation({
    mutationFn: () =>
      submitFn({
        data: {
          person_type: personType,
          business_name: businessName.trim() || undefined,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim() || undefined,
          social_links: social.trim() || undefined,
          intent: intent.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Anketa pateikta! Gausite pranešimą, kai administratorius ją patvirtins.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["my-advertiser"] });
    },
    onError: (e) => toastError(e),
  });

  const profile = me.data?.profile ?? null;

  return (
    <Card className="mx-auto mt-6 max-w-2xl p-6">
      <div className="flex items-center gap-2 text-primary">
        <Megaphone className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Tik skelbimams</span>
      </div>
      <h2 className="mt-2 font-display text-xl">Noriu tik kelti skelbimus</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Užpildyk trumpą anketą — patvirtinus gausi skelbiko paskyrą ({eur(TIER_PRICING.advertiser.cents)}/mėn.) su vienu
        įskaičiuotu skelbimu. Kiti skelbimai — po {eur(TIER_PRICING.advertiserExtra.cents)}.
      </p>

      {!user ? (
        <Button asChild className="mt-4 btn-press" disabled={authLoading}>
          <Link to="/auth" search={{ mode: "signup" }}>Prisijunk ir pildyk anketą</Link>
        </Button>
      ) : profile ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={profile.status === "approved" ? "default" : profile.status === "rejected" ? "destructive" : "secondary"}>
            {profile.status === "approved" ? "Patvirtinta" : profile.status === "rejected" ? "Atmesta" : "Tvirtinama"}
          </Badge>
          {profile.rejection_note && <span className="text-xs text-destructive">{profile.rejection_note}</span>}
          {profile.status === "rejected" && (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Pildyti iš naujo</Button>
          )}
        </div>
      ) : (
        <Button className="mt-4 btn-press" onClick={() => setOpen(true)} disabled={me.isLoading}>
          Pildyti anketą
        </Button>
      )}

      <ResponsiveModal open={open} onOpenChange={setOpen} title="Skelbiko anketa">
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Asmens statusas</Label>
            <Select value={personType} onValueChange={(v) => setPersonType(v as typeof personType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Fizinis asmuo</SelectItem>
                <SelectItem value="legal">Juridinis asmuo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {personType === "legal" && (
            <div>
              <Label className="text-xs">Įmonės pavadinimas</Label>
              <Input className="mt-1" maxLength={160} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
          )}
          <div>
            <Label className="text-xs">Vardas, pavardė</Label>
            <Input className="mt-1" maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">El. paštas</Label>
              <Input className="mt-1" type="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Telefonas</Label>
              <Input className="mt-1" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+370…" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Adresas</Label>
            <Input className="mt-1" maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Socialiniai tinklai (nebūtina)</Label>
            <Input className="mt-1" maxLength={300} value={social} onChange={(e) => setSocial(e.target.value)} placeholder="instagram.com/…" />
          </div>
          <div>
            <Label className="text-xs">Ką planuojate skelbti?</Label>
            <Textarea className="mt-1" rows={4} maxLength={1000} value={intent} onChange={(e) => setIntent(e.target.value)}
              placeholder="Pvz. nuomoju kabinetą Vilniuje ir parduodu kosmetologinę įrangą." />
          </div>
          <Button className="w-full btn-press" disabled={!valid || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pateikti anketą
          </Button>
        </div>
      </ResponsiveModal>
    </Card>
  );
}
