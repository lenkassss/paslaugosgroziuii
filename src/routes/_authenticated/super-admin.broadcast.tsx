import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Send, Trash2, TimerOff, Radio } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import {
  adminListAnnouncements,
  superAdminCreateAnnouncement,
  superAdminEndAnnouncement,
  superAdminDeleteAnnouncement,
} from "@/lib/announcements.functions";

export const Route = createFileRoute("/_authenticated/super-admin/broadcast")({
  component: Broadcast,
});

const LEVELS = [
  { value: "info", label: "Informacija" },
  { value: "success", label: "Gera naujiena" },
  { value: "warning", label: "Įspėjimas" },
  { value: "critical", label: "Kritinis" },
] as const;

function Broadcast() {
  const qc = useQueryClient();
  const list = useServerFn(adminListAnnouncements);
  const create = useServerFn(superAdminCreateAnnouncement);
  const end = useServerFn(superAdminEndAnnouncement);
  const del = useServerFn(superAdminDeleteAnnouncement);

  const { data } = useQuery({ queryKey: ["sa-announcements"], queryFn: () => list() });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]["value"]>("info");
  const [until, setUntil] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sa-announcements"] });
    qc.invalidateQueries({ queryKey: ["active-announcements"] });
  };

  const createMut = useMutation({
    mutationFn: () => create({ data: { title, body: body || undefined, level, activeUntil: until || undefined } }),
    onSuccess: () => {
      toast.success("Pranešimas paskelbtas visai platformai");
      setTitle("");
      setBody("");
      setUntil("");
      invalidate();
    },
    onError: (e: Error) => toastError(e),
  });

  const endMut = useMutation({
    mutationFn: (id: string) => end({ data: { id } }),
    onSuccess: () => { toast.success("Pranešimas išjungtas"); invalidate(); },
    onError: (e: Error) => toastError(e),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Ištrinta"); invalidate(); },
    onError: (e: Error) => toastError(e),
  });

  const rows = data?.announcements ?? [];
  const now = Date.now();

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <Radio className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl">Transliacijų centras</h1>
          <p className="text-sm text-muted-foreground">
            Platformos pranešimai visiems vartotojams. Skelbti gali tik super administratorius, matyti — visi administratoriai.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h2 className="font-display text-xl">Naujas pranešimas</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <Label>Antraštė</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pvz. Nauja: rezervacijos su išankstiniu apmokėjimu" />
            </div>
            <div>
              <Label>Tekstas (nebūtinas)</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Trumpas paaiškinimas vartotojams" />
            </div>
            <div>
              <Label>Tipas</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition active:scale-95 ${
                      level === l.value ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Rodyti iki (nebūtina)</Label>
              <Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
            </div>
            <Button
              className="w-full gradient-gold text-primary-foreground btn-press"
              disabled={title.trim().length < 3 || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              <Send className="mr-2 h-4 w-4" /> Skelbti visai platformai
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-xl">Pranešimų istorija</h2>
          {rows.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Kol kas pranešimų nėra.</p>}
          <div className="mt-4 space-y-3">
            {rows.map((a: any) => {
              const active =
                new Date(a.active_from).getTime() <= now && (!a.active_until || new Date(a.active_until).getTime() > now);
              return (
                <div key={a.id} className="rounded-2xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{a.title}</span>
                        <Badge variant={active ? "default" : "outline"} className="text-[10px]">
                          {active ? "Aktyvus" : "Neaktyvus"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{a.level}</Badge>
                      </div>
                      {a.body && <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(a.active_from).toLocaleString("lt-LT")}
                        {a.active_until ? ` → ${new Date(a.active_until).toLocaleString("lt-LT")}` : " → neribotai"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {active && (
                        <Button size="sm" variant="outline" onClick={() => endMut.mutate(a.id)}>
                          <TimerOff className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => delMut.mutate(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
