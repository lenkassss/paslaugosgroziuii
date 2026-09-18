import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bell, BellRing, LogOut, Mail,
  Smartphone, ShieldCheck, ChevronRight, Loader2,
  FileText, Trash2, TriangleAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useAuth } from "@/lib/auth-context";
import {
  getNotificationPrefs, updateNotificationPrefs, registerPushDevice,
  unregisterPushDevices, listPushDevices, type NotificationPrefs,
} from "@/lib/notification-prefs.functions";
import { CreditCard } from "lucide-react";
import { PaymentCardPicker } from "@/components/payment-card-picker";
import { getNewsletterOptIn, setNewsletterOptIn } from "@/lib/newsletter.functions";
import { deleteMyAccount } from "@/lib/account.functions";
import { enablePush, disablePush, isNativeApp } from "@/lib/push";
import { roleLabel } from "@/lib/role-labels";
import { toastError } from "@/lib/error-messages";


export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Mano profilis · PaslaugosGrožiui" },
      { name: "description", content: "Tvarkyk savo paskyrą, pranešimų nustatymus ir prisijungtus įrenginius PaslaugosGrožiui platformoje." },
      { property: "og:title", content: "Mano profilis · PaslaugosGrožiui" },
      { property: "og:description", content: "Paskyros ir pranešimų nustatymai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TOGGLES: { key: keyof NotificationPrefs; label: string; desc: string; icon: typeof Bell }[] = [
  { key: "notify_email", label: "El. pašto pranešimai", desc: "Rezervacijų patvirtinimai, priminimai ir naujienos el. paštu", icon: Mail },
];

function ProfilePage() {
  const { user, role, signOut } = useAuth();
  const qc = useQueryClient();
  const getPrefs = useServerFn(getNotificationPrefs);
  const savePrefs = useServerFn(updateNotificationPrefs);
  const regDevice = useServerFn(registerPushDevice);
  const unregDevices = useServerFn(unregisterPushDevices);
  const devicesFn = useServerFn(listPushDevices);

  const { data, isLoading } = useQuery({ queryKey: ["notif-prefs", user?.id], queryFn: () => getPrefs(), enabled: !!user, retry: false });
  const devices = useQuery({ queryKey: ["push-devices", user?.id], queryFn: () => devicesFn(), enabled: !!user, retry: false });

  const [native, setNative] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const removeAccount = useServerFn(deleteMyAccount);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");

  useEffect(() => { isNativeApp().then(setNative); }, []);

  const newsletterFn = useServerFn(getNewsletterOptIn);
  const saveNewsletterFn = useServerFn(setNewsletterOptIn);
  const newsletter = useQuery({
    queryKey: ["newsletter-opt-in", user?.id],
    queryFn: () => newsletterFn(),
    enabled: !!user,
    retry: false,
  });
  const saveNewsletter = async (optIn: boolean) => {
    qc.setQueryData(["newsletter-opt-in", user?.id], { optIn });
    try {
      await saveNewsletterFn({ data: { optIn } });
      toast.success(optIn ? "Naujienlaiškis įjungtas" : "Naujienlaiškio atsisakyta");
    } catch (e) {
      toastError(e);
      qc.invalidateQueries({ queryKey: ["newsletter-opt-in"] });
    }
  };

  const prefs = data?.prefs;
  const pushOn = (devices.data?.devices ?? []).length > 0;

  const toggle = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user) return;
    qc.setQueryData(["notif-prefs", user?.id], (old: typeof data) =>
      old ? { ...old, prefs: { ...old.prefs, [key]: value } } : old);
    try {
      await savePrefs({ data: { [key]: value } });
      toast.success("Nustatymai išsaugoti", { id: "notif-prefs-saved" });
    } catch (e) {
      toastError(e);
      qc.invalidateQueries({ queryKey: ["notif-prefs"] });
    }
  };

  const togglePush = async () => {
    if (!user) return;
    setPushBusy(true);
    try {
      if (pushOn) {
        await disablePush();
        await unregDevices();
        toast.success("Push pranešimai išjungti šiame įrenginyje");
      } else {
        const status = await enablePush(async (token, platform) => {
          await regDevice({ data: { token, platform } });
        });
        if (status === "unsupported") toast.info("Push pranešimai veikia tik mobiliojoje programėlėje. Naršyklėje gausi pranešimus programoje ir el. paštu.");
        else if (status === "denied") toast.error("Pranešimų leidimas atmestas. Įjunk jį telefono nustatymuose → Pranešimai.");
        else if (status === "error") toast.error("Nepavyko užregistruoti įrenginio. Patikrink interneto ryšį ir bandyk dar kartą.");
        else toast.success("Pranešimai įjungti");
      }

      qc.invalidateQueries({ queryKey: ["push-devices"] });
    } finally {
      setPushBusy(false);
    }
  };

  const initials = (data?.profile.owner_name || user?.email || "PG").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 md:pb-12">
      <Card className="overflow-hidden rounded-2xl border-border/70 p-0 shadow-none">
        <div className="bg-foreground px-5 py-6 text-background">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-background/30">
              <AvatarImage src={data?.profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-background/15 text-lg font-semibold text-background">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-display text-2xl">{data?.profile.owner_name || "Mano profilis"}</div>
              <div className="truncate text-xs opacity-90">{user?.email}</div>
              {role && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-background/15 px-2.5 py-1 text-[11px] font-medium">
                  <ShieldCheck className="h-3 w-3" /> {roleLabel(role)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-4 rounded-2xl border-border/60 px-4 py-4 text-sm text-muted-foreground">
        Visas valdymas, paslaugos ir reklama gyvena meniu – atverk jį viršuje kairėje.
      </Card>




      <h2 className="mt-8 flex items-center gap-2 px-1 font-display text-xl">
        <BellRing className="h-5 w-5 text-primary" /> Pranešimų nustatymai
      </h2>
      <p className="mt-1 px-1 text-sm text-muted-foreground">
        Pasirink, apie ką nori būti informuotas. Pranešimus gauni programėlėje (Push) ir el. paštu.
      </p>

      <Card className="mt-4 divide-y divide-border/60 rounded-3xl border-border/60 p-0">
        <div
          onClick={() => { if (!pushBusy) void togglePush(); }}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            {pushBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Programėlės Push pranešimai</span>
            <span className="block text-xs text-muted-foreground">
              {native ? (pushOn ? "Įjungta šiame įrenginyje" : "Įjunk, kad gautum priminimus realiu laiku") : "Prieinama mobiliojoje programėlėje"}
            </span>
          </span>
          <Switch
            checked={pushOn}
            disabled={pushBusy}
            aria-label="Programėlės Push pranešimai"
            onCheckedChange={() => { if (!pushBusy) void togglePush(); }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>


        {TOGGLES.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.key} className="flex items-center gap-3 px-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-foreground/70">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{row.label}</div>
                <div className="text-xs text-muted-foreground">{row.desc}</div>
              </div>
              <Switch
                checked={prefs ? !!prefs[row.key] : false}
                disabled={isLoading}
                onCheckedChange={(v) => toggle(row.key, v)}
              />
            </div>
          );
        })}
      </Card>

      <Card className="mt-6 divide-y divide-border/60 rounded-3xl border-border/60 p-0">
        <Link to="/notifications" className="flex items-center gap-3 px-4 py-4 transition active:scale-[0.99]">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary"><Bell className="h-5 w-5" /></span>
          <span className="flex-1 text-sm font-medium">Visi pranešimai</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/push-tester" className="flex items-center gap-3 px-4 py-4 transition active:scale-[0.99]">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary"><BellRing className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Push & Promo testeris</span>
            <span className="block text-xs text-muted-foreground">Išbandyk sisteminius pranešimus įrenginyje</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </Card>

      <h2 className="mt-8 flex items-center gap-2 px-1 font-display text-xl">
        <Mail className="h-5 w-5 text-primary" /> Naujienlaiškis
      </h2>
      <Card className="mt-4 flex items-center gap-3 rounded-3xl border-border/60 px-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">Sutinku gauti naujienlaiškį</div>
          <div className="text-xs text-muted-foreground">
            Naujienos, pasiūlymai ir mokymai el. paštu. Sutikimą gali atšaukti bet kada.
          </div>
        </div>
        <Switch
          checked={!!newsletter.data?.optIn}
          disabled={newsletter.isLoading}
          aria-label="Naujienlaiškio sutikimas"
          onCheckedChange={(v) => void saveNewsletter(v)}
        />
      </Card>


      <h2 className="mt-8 flex items-center gap-2 px-1 font-display text-xl">
        <CreditCard className="h-5 w-5 text-primary" /> Mokėjimo kortelės
      </h2>
      <Card className="mt-4 rounded-3xl border-border/60 p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Kortelė naudojama rezervacijų apmokėjimui ir vėlyvo atšaukimo mokesčiui. Demo režimas — tikri duomenys nesaugomi.
        </p>
        <PaymentCardPicker />
      </Card>


      <Card className="mt-6 divide-y divide-border/60 rounded-3xl border-border/60 p-0">
        <Link to="/privatumas" className="flex items-center gap-3 px-4 py-4 transition active:scale-[0.99]">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary"><ShieldCheck className="h-5 w-5" /></span>
          <span className="flex-1 text-sm font-medium">Privatumo politika</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/taisykles" className="flex items-center gap-3 px-4 py-4 transition active:scale-[0.99]">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary"><FileText className="h-5 w-5" /></span>
          <span className="flex-1 text-sm font-medium">Naudojimo taisyklės</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </Card>

      <Button variant="outline" onClick={() => signOut()} className="mt-6 h-12 w-full rounded-2xl active:scale-95">
        <LogOut className="mr-2 h-4 w-4" /> Atsijungti
      </Button>

      <button
        type="button"
        onClick={() => { setConfirm(""); setDeleteOpen(true); }}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium text-destructive transition active:scale-95"
      >
        <Trash2 className="h-4 w-4" /> Ištrinti paskyrą
      </button>

      <ResponsiveModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Ištrinti paskyrą"
        description="Šis veiksmas negrįžtamas: bus pašalinta paskyra, rezervacijų istorija, mėgstami ir pranešimų nustatymai."
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setDeleteOpen(false)}>
              Atšaukti
            </Button>
            <Button
              variant="destructive"
              disabled={confirm.trim().toUpperCase() !== "TRINTI" || deleting}
              className="h-11 rounded-2xl active:scale-95"
              onClick={async () => {
                setDeleting(true);
                try {
                  await removeAccount();
                  toast.success("Paskyra ištrinta");
                  await signOut();
                } catch (e) {
                  toastError(e);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Ištrinti visam laikui
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-muted-foreground">
              Jei turi neįvykusių rezervacijų, jos bus atšauktos. Sumokėti avansai negrąžinami pagal naudojimo taisykles.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Įrašyk <span className="font-semibold text-foreground">TRINTI</span>, kad patvirtintum
            </label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="TRINTI"
              className="mt-1.5 h-12 rounded-2xl"
            />
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}

