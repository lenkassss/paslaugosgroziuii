import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, CalendarCheck, Ban, Tag, Send, ChevronLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { sendLocalPush } from "@/lib/local-push";
import { isNativeApp } from "@/lib/push";

export const Route = createFileRoute("/_authenticated/push-tester")({
  component: PushTesterPage,
  head: () => ({
    meta: [
      { title: "Push pranešimų testeris · PaslaugosGrožiui" },
      { name: "description", content: "Admin valdymo skydas: išbandyk vizito, atšaukimo ir akcijų push pranešimus tiesiai įrenginyje." },
      { property: "og:title", content: "Push pranešimų testeris · PaslaugosGrožiui" },
      { property: "og:description", content: "Testuok sisteminius push pranešimus ir marketingo žinutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Preset = {
  id: string;
  icon: typeof CalendarCheck;
  label: string;
  title: string;
  body: string;
  path?: string;
};

const PRESETS: Preset[] = [
  {
    id: "confirm",
    icon: CalendarCheck,
    label: "Vizito patvirtinimas",
    title: "Vizitas patvirtintas 💅",
    body: "Jūsų vizitas Kaunas Nails Studio patvirtintas 14:00.",
    path: "/dashboard/customer",
  },
  {
    id: "cancel",
    icon: Ban,
    label: "Atšaukimas / bauda",
    title: "Vizitas atšauktas",
    body: "Vizitas atšauktas. Taikomas 30% neatvykimo mokestis.",
    path: "/dashboard/customer",
  },
  {
    id: "promo",
    icon: Tag,
    label: "Akcija / nuolaidos kodas",
    title: "Tik šį savaitgalį 🏷️",
    body: "Gauk -20% nuolaidą manikiūrui! Kodas: GROZIS20",
    path: "/feed/akcijos",
  },
];

function PushTesterPage() {
  const { role } = useAuth();
  const allowed = role === "admin" || role === "salon" || role === "supplier";
  const [native, setNative] = useState(false);
  const [active, setActive] = useState<Preset>(PRESETS[0]!);
  const [title, setTitle] = useState(PRESETS[0]!.title);
  const [body, setBody] = useState(PRESETS[0]!.body);
  const [busy, setBusy] = useState(false);

  useEffect(() => { isNativeApp().then(setNative); }, []);

  const pick = (p: Preset) => {
    setActive(p);
    setTitle(p.title);
    setBody(p.body);
  };

  const send = async () => {
    setBusy(true);
    try {
      const res = await sendLocalPush({ title: title.trim(), body: body.trim(), path: active.path });
      if (res === "native") toast.success("Pranešimas išsiųstas į įrenginio pranešimų centrą");
      else if (res === "web") toast.success("Sisteminis pranešimas išsiųstas (naršyklės simuliatorius)");
      else if (res === "denied") toast.error("Pranešimų leidimas atmestas — įjunk jį įrenginio nustatymuose");
      else toast.info("Šis įrenginys nepalaiko sisteminių pranešimų");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-4 md:pb-12 md:pt-8">
      <Link
        to="/profile"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" /> Profilis
      </Link>

      <Card className="overflow-hidden rounded-3xl border-border/60 p-0 shadow-elegant">
        <div className="gradient-gold px-5 py-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-background/20">
              <BellRing className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-display text-xl">Push & Promo valdymas</div>
              <div className="truncate text-xs opacity-90">
                {native ? "Native režimas — pranešimai eina į įrenginio centrą" : "Naršyklės simuliatorius"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {!allowed && (
        <Card className="mt-4 rounded-3xl border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
          Šis skydas skirtas administratoriams ir verslo paskyroms. Testiniai pranešimai bus siunčiami tik į šį įrenginį.
        </Card>
      )}

      <h2 className="mt-8 px-1 font-display text-lg">1. Pasirink pranešimo tipą</h2>
      <div className="mt-3 grid gap-2">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const on = p.id === active.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p)}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-3xl border px-4 py-4 text-left transition active:scale-95 ${
                on ? "border-primary/40 bg-primary/5 shadow-glow" : "border-border/60 bg-card"
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                  on ? "gradient-gold text-primary-foreground" : "bg-secondary text-foreground/70"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{p.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.body}</span>
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-8 px-1 font-display text-lg">2. Turinys</h2>
      <Card className="mt-3 space-y-3 rounded-3xl border-border/60 p-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Antraštė</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 h-12 rounded-2xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tekstas</label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="mt-1.5 rounded-2xl" />
        </div>
        <div className="rounded-2xl border border-border/60 bg-secondary/50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Peržiūra</div>
          <div className="mt-1 text-sm font-semibold">{title || "Antraštė"}</div>
          <div className="text-xs text-muted-foreground">{body || "Pranešimo tekstas"}</div>
        </div>
      </Card>

      <Button
        onClick={send}
        disabled={busy || !title.trim() || !body.trim()}
        className="mt-6 h-12 w-full rounded-2xl gradient-gold text-primary-foreground active:scale-95"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Siųsti testinį pranešimą
      </Button>

      <p className="mt-3 px-1 text-xs text-muted-foreground">
        Pranešimas pasirodo įrenginio pranešimų centre po ~1 sek. Naršyklėje naudojamas Web Push simuliatorius.
      </p>
    </div>
  );
}
