import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CitySelect } from "@/components/city-select";
import { toast } from "sonner";
import { LipsIcon } from "@/components/lips-icon";
import { PasswordStrength } from "@/components/password-strength";
import { PhoneInput, isValidEmail, isValidPhone } from "@/components/phone-input";
import { Loader2, ArrowLeft, ChevronDown, Eye, EyeOff, Store, Scissors, Package, GraduationCap, User, Megaphone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { peekStaffInvite, acceptStaffInvite } from "@/lib/staff.functions";
import { useServerFn } from "@tanstack/react-start";
import { registerReferral } from "@/lib/referrals.functions";
import { toastError } from "@/lib/error-messages";
import { setNewsletterOptIn } from "@/lib/newsletter.functions";

const authSearch = z.object({
  mode: z.enum(["signin", "signup", "reset"]).default("signin").optional(),
  next: z.string().optional(),
  invite: z.string().uuid().optional(),
  /** Iš „Verslui" puslapio – iš anksto pažymėta verslo rolė. */
  role: z.enum(["client", "salon", "supplier", "school", "advertiser"]).optional(),
  /** Pakvietimo kodas – priskiriamas kvietėjui po registracijos. */
  ref: z.string().min(4).max(24).optional(),
});

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: authSearch,
  head: () => ({
    meta: [
      { title: "Prisijungti · PaslaugosGrožiui" },
      { name: "description", content: "Prisijunk arba sukurk paskyrą: rezervuok grožio paslaugas, valdyk saloną, mokyklą ar tiekėjo katalogą." },
      { property: "og:title", content: "Prisijungti · PaslaugosGrožiui" },
      { property: "og:description", content: "Viena paskyra visai grožio industrijai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ROLES = [
  { v: "client", label: "Klientas", desc: "Rezervuoti paslaugas", icon: User },
  { v: "salon", label: "Meistras / Salonas", desc: "Priimti klientus", icon: Scissors },
  { v: "supplier", label: "Tiekėjas", desc: "Prekės ženklas, parduotuvė", icon: Package },
  { v: "school", label: "Mokykla", desc: "Mokymai, diplomai", icon: GraduationCap },
  { v: "advertiser", label: "Skelbikas", desc: "Tik skelbimų skiltis", icon: Megaphone },
] as const;

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, role, loading } = useAuth();
  const inviteToken = search.invite;
  const [mode, setMode] = useState<"signin" | "signup">(
    inviteToken ? "signup" : search.mode === "signup" ? "signup" : "signin",
  );
  /** Naujo slaptažodžio nustatymas atėjus iš el. laiško nuorodos. */
  const resetting = search.mode === "reset";
  const [newPass, setNewPass] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [signupRole, setSignupRole] = useState<"client" | "staff" | "salon" | "supplier" | "school" | "advertiser">(inviteToken ? "staff" : (search.role ?? "client"));
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [dial, setDial] = useState("+370");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const peekFn = useServerFn(peekStaffInvite);
  const acceptFn = useServerFn(acceptStaffInvite);
  const registerReferralFn = useServerFn(registerReferral);
  const setNewsletterFn = useServerFn(setNewsletterOptIn);
  const [inviteInfo, setInviteInfo] = useState<{ salon_name: string; email: string; status: string } | null>(null);

  useEffect(() => {
    if (!inviteToken) return;
    peekFn({ data: { token: inviteToken } }).then((r) => {
      if (r.invite) {
        setInviteInfo(r.invite);
        setEmail(r.invite.email);
      }
    }).catch(() => {});
  }, [inviteToken, peekFn]);

  useEffect(() => {
    if (loading || !user || blockedReason || resetting) return;
    (async () => {
      if (inviteToken) {
        try {
          const res = await acceptFn({ data: { token: inviteToken } });
          toast.success(`Prisijungei prie salono „${res.salonName ?? ""}"`);
        } catch (e) {
          toastError(e);
        }
      }
      if (localStorage.getItem("pg_newsletter") === "1") {
        try { await setNewsletterFn({ data: { optIn: true } }); } catch { /* nekritinis */ }
        localStorage.removeItem("pg_newsletter");
      }
      const pendingRef = search.ref ?? localStorage.getItem("pg_ref");
      if (pendingRef) {
        try { await registerReferralFn({ data: { code: pendingRef } }); } catch { /* nekritinis */ }
        localStorage.removeItem("pg_ref");
      }
      if (role) {
        // Po prisijungimo / registracijos visada grįžtame į pradinį puslapį —
        // teises ir skiltis kiekvienai rolei parodo pati navigacija.
        const dest =
          search.next && search.next.startsWith("/") ? search.next
          : inviteToken ? "/dashboard/salon/overview"
          : "/";
        nav({ to: dest });
      }
    })();
  }, [user, role, loading, nav, search.next, search.ref, inviteToken, acceptFn, registerReferralFn, blockedReason]);

  const guardBlocked = async (): Promise<boolean> => {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("blocked_at, blocked_reason")
      .eq("id", session.user.id)
      .maybeSingle();
    if (profile?.blocked_at) {
      setBlockedReason(profile.blocked_reason || "Taisyklių pažeidimas");
      await supabase.auth.signOut();
      return true;
    }
    return false;
  };

  const doSignIn = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setSubmitting(false); return toastError(error); }
    const blocked = await guardBlocked();
    setSubmitting(false);
    if (blocked) return;
    toast.success("Sveiki sugrįžę!");
  };

  const doSignUp = async () => {
    if (!isValidEmail(email)) return toast.error("Įvesk taisyklingą el. paštą, pvz. vardas@pastas.lt");
    if (phone && !isValidPhone(dial, phone)) return toast.error("Telefono numeris neatitinka pasirinktos šalies formato");
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          role: signupRole,
          business_name: signupRole !== "client" ? businessName : null,
          owner_name: ownerName,
          phone: phone ? `${dial}${phone.replace(/\D/g, "")}` : null,
          city,
        },
      },
    });
    setSubmitting(false);
    if (error) return toastError(error);
    if (search.ref) localStorage.setItem("pg_ref", search.ref);
    if (newsletter) localStorage.setItem("pg_newsletter", "1");
    toast.success("Paskyra sukurta! Patvirtink el. paštą, kad galėtum prisijungti.");
  };

  /** Slaptažodžio atkūrimas: išsiunčia nuorodą į el. paštą. */
  const doForgot = async () => {
    if (!isValidEmail(email)) return toast.error("Įrašyk savo el. paštą, į kurį atsiųsime nuorodą.");
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setSubmitting(false);
    if (error) return toastError(error);
    toast.success("Išsiuntėme nuorodą slaptažodžio atkūrimui. Patikrink el. paštą.");
  };

  /** Naujo slaptažodžio išsaugojimas (atėjus iš laiško nuorodos). */
  const doResetPassword = async () => {
    if (newPass.length < 6) return toast.error("Slaptažodis turi būti bent 6 simbolių.");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSubmitting(false);
    if (error) return toastError(error);
    toast.success("Slaptažodis atnaujintas.");
    nav({ to: "/" });
  };





  const quickLogin = async (em: string, pass = "Demo1234!") => {
    setEmail(em);
    setPassword(pass);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pass });
    if (error) {
      setSubmitting(false);
      return toast.error(error.message + " – paspausk „Sukurti demo duomenis“.");
    }
    await guardBlocked();
    setSubmitting(false);
  };

  if (resetting) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-5">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl gradient-gold shadow-glow">
          <LipsIcon className="h-6 w-[32px] text-primary-foreground" />
        </div>
        <h1 className="mt-5 text-center font-display text-3xl leading-tight">Naujas slaptažodis</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Įrašyk naują slaptažodį – po išsaugojimo iškart prisijungsi.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); void doResetPassword(); }}
          className="mt-6 space-y-4"
        >
          <Input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Naujas slaptažodis"
            className="h-13 rounded-2xl bg-background/70 px-4 text-base"
          />
          <PasswordStrength value={newPass} />
          <Button type="submit" disabled={submitting} className="h-13 w-full rounded-2xl gradient-gold text-base font-semibold text-primary-foreground">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Išsaugoti slaptažodį
          </Button>
        </form>
        <Link to="/" className="mt-4 text-center text-sm text-muted-foreground underline">Į pradžią</Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-72 max-w-full rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-80 max-w-full rounded-full bg-accent/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-28 pt-[max(1rem,env(safe-area-inset-top))] md:pb-12">
        <Link
          to="/"
          className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur-xl transition active:scale-90"
          aria-label="Atgal"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="mt-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl gradient-gold shadow-glow">
            <LipsIcon className="h-6 w-[32px] text-primary-foreground drop-shadow-sm" />
          </div>
          <h1 className="mt-4 font-display text-3xl leading-tight">
            {mode === "signin" ? "Sveiki sugrįžę" : "Sukurk paskyrą"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin" ? "Prisijunk ir tęsk ten, kur baigei." : "Viena paskyra visai grožio industrijai."}
          </p>
        </div>

        {inviteInfo && (
          <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <div className="font-medium text-primary">Pakvietimas prisijungti prie salono</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Salonas <span className="font-medium text-foreground">„{inviteInfo.salon_name}"</span> kviečia tave tapti meistre.
            </div>
          </div>
        )}

        {/* Segmented control */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-border/60 bg-secondary/60 p-1 backdrop-blur-xl">
          {(["signin", "signup"] as const).map((m) => (
            <Button
              type="button"
              variant="ghost"
              key={m}
              onClick={() => setMode(m)}
              className={`h-11 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 ${
                mode === m ? "gradient-gold text-primary-foreground shadow-elegant" : "text-muted-foreground"
              }`}
            >
              {m === "signin" ? t("nav.signIn") : t("nav.signUp")}
            </Button>
          ))}
        </div>

        <div className="my-6 h-px w-full bg-border/60" />


        <form onSubmit={(e) => { e.preventDefault(); mode === "signin" ? doSignIn() : doSignUp(); }} className="space-y-4">
          {mode === "signup" && !inviteToken && (
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.role")}</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = signupRole === r.v;
                  return (
                    <button
                      key={r.v}
                      type="button"
                      onClick={() => setSignupRole(r.v)}
                      className={`rounded-2xl border p-3 text-left transition-all duration-200 active:scale-95 ${
                        active ? "border-primary bg-primary/5 shadow-elegant" : "border-border/60 bg-background/60"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="mt-2 text-sm font-semibold leading-tight">{r.label}</div>
                      <div className="text-[11px] leading-snug text-muted-foreground">{r.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.email")}</Label>
            <Input
              id="email" type="email" inputMode="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="vardas@pastas.lt"
              className={`mt-1.5 h-13 rounded-2xl bg-background/70 px-4 text-base ${email ? (isValidEmail(email) ? "border-emerald-500/60" : "border-destructive/60") : ""}`}
              aria-invalid={!!email && !isValidEmail(email)}
            />
            {!!email && (
              <p className={`mt-1.5 text-[11px] ${isValidEmail(email) ? "text-emerald-600" : "text-destructive"}`}>
                {isValidEmail(email) ? "El. pašto formatas tinkamas" : "Formatas turi būti vardas@pastas.lt"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.password")}</Label>
            <div className="relative mt-1.5">
              <Input
                id="password" type={showPass ? "text" : "password"} required minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-13 rounded-2xl bg-background/70 px-4 pr-12 text-base"
              />
              <button
                type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition active:scale-90"
                aria-label={showPass ? "Slėpti slaptažodį" : "Rodyti slaptažodį"}
              >
                {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {mode === "signup" && <PasswordStrength value={password} />}
          </div>

          {mode === "signup" && (
            <>
              {signupRole !== "client" && (
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.businessName")}</Label>
                  <Input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1.5 h-13 rounded-2xl bg-background/70 px-4 text-base" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.ownerName")}</Label>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="mt-1.5 h-13 rounded-2xl bg-background/70 px-4 text-base" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.city")}</Label>
                  <div className="mt-1.5"><CitySelect value={city} onChange={setCity} placeholder={t("hero.f2ph")} /></div>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.phone")}</Label>
                <div className="mt-1.5">
                  <PhoneInput dial={dial} value={phone} onDialChange={setDial} onChange={setPhone} />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-3.5">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  Sutinku gauti PaslaugosGrožiui naujienlaiškį – naujienas, pasiūlymus ir mokymus el. paštu.
                  Sutikimą galiu atšaukti bet kada savo profilyje.
                </span>
              </label>
            </>
          )}

          <Button type="submit" disabled={submitting} className="h-13 w-full rounded-2xl gradient-gold text-base font-semibold text-primary-foreground shadow-elegant transition active:scale-95 hover:opacity-90">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" ? t("nav.signIn") : t("nav.signUp")}
          </Button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={doForgot}
              disabled={submitting}
              className="w-full text-center text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Pamiršai slaptažodį?
            </button>
          )}
        </form>


        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <button className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? t("nav.signUp") : t("nav.signIn")}
          </button>
        </p>

        {/* Demo accounts — collapsed by default so the screen stays clean */}
        <div className="mt-8 rounded-3xl border border-border/60 bg-secondary/40 p-1.5 backdrop-blur-xl">
          <button
            onClick={() => setDemoOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition active:scale-[0.99]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Store className="h-4 w-4" /></span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">{t("auth.demoTitle")}</span>
              <span className="block text-xs text-muted-foreground">{t("auth.demoDesc")}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${demoOpen ? "rotate-180" : ""}`} />
          </button>

          {demoOpen && (
            <div className="animate-slide-up space-y-2 px-1.5 pb-1.5">
              {[
                { role: "Salonas (PRO)", note: "Visas salonas: registracijos, kalendorius, komanda", email: "vilnius.beauty@demo.lt" },
                { role: "Meistrė (PRO)", note: "Pilnai veikianti narystė su internetinėmis registracijomis", email: "meistre@demo.lt" },
                { role: "Meistrė (bazinė)", note: "Tik profilis ir kontaktai – be internetinių registracijų", email: "meistre.bazine@demo.lt" },
                { role: "Skelbikas", note: "Mato tik skelbimų skiltį ir savo narystę", email: "skelbikas@demo.lt" },
                { role: "Tiekėjas", note: "Produktų katalogas ir B2B turgus", email: "supplier.cosmetics@demo.lt" },
                { role: "Mokykla", note: "Mokymų kalendorius ir registracijos", email: "mokykla@demo.lt" },
                { role: "Darbdavys", note: "Darbo skelbimai ir kandidatai", email: "darbdavys@demo.lt" },
                { role: "Klientas", note: "Paprastas vartotojas – rezervacijos nemokamai", email: "client@demo.lt" },
              ].map((d) => (
                <button
                  key={d.email}
                  onClick={() => quickLogin(d.email)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-3.5 py-3 text-left transition active:scale-[0.98]"
                >
                  <span className="min-w-0">
                    <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{d.role}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{d.note}</span>
                    <span className="block truncate text-[11px] text-muted-foreground/80">{d.email}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-primary">Prisijungti →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!blockedReason} onOpenChange={(o) => { if (!o) setBlockedReason(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-destructive">Paskyra užblokuota</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Jūsų paskyra yra užblokuota. Priežastis: <span className="font-medium text-foreground">{blockedReason}</span>.
            Jeigu manote, kad tai klaida, susisiekite su administracija.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockedReason(null)}>Uždaryti</Button>
            <Button asChild><a href="/contact">Susisiekti</a></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
