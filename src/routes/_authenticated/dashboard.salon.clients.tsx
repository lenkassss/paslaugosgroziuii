import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { listMyClients, saveClientRecord, type ClientCard } from "@/lib/clients.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Phone, Mail, Ban, ShieldCheck, StickyNote, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/salon/clients")({
  component: ClientsPage,
  head: () => ({
    meta: [
      { title: "Klientai · Valdymas · PaslaugosGrožiui" },
      { name: "description", content: "Klientų kartoteka: kontaktai, apsilankymų skaičius, paslaugos, pastabos ir blokavimas." },
      { property: "og:title", content: "Klientų kartoteka" },
      { property: "og:description", content: "Kontaktai, apsilankymai, pastabos ir blokavimas vienoje vietoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type ClientRecordInput = {
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  note?: string | null;
  is_blocked?: boolean;
  blocked_reason?: string | null;
};

function ClientsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["my-clients"], queryFn: () => listMyClients() });

  const clients = useMemo(() => {
    const list = data?.clients ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((c) =>
      [c.name, c.phone, c.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)),
    );
  }, [data, q]);

  const save = useMutation({
    mutationFn: (input: ClientRecordInput) => saveClientRecord({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-clients"] });
      toast.success("Išsaugota");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-semibold">Klientai</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tavo klientų kartoteka: kontaktai, apsilankymai, paslaugos ir asmeninės pastabos. Šių duomenų nemato niekas kitas.
      </p>

      <div className="relative my-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ieškoti pagal vardą, telefoną ar el. paštą"
          className="h-11 rounded-xl pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8" /> Klientų dar nėra – jie atsiras po pirmų rezervacijų.
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <ClientRow key={c.key} client={c} onSave={(input) => save.mutate(input)} saving={save.isPending} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function ClientRow({
  client,
  onSave,
  saving,
}: {
  client: ClientCard;
  onSave: (input: ClientRecordInput) => void;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(client.note ?? "");

  const base = { client_name: client.name, client_phone: client.phone, client_email: client.email };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{client.name}</span>
            {client.isBlocked && <Badge variant="destructive">Užblokuotas</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Phone className="h-3 w-3" />
                {client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Mail className="h-3 w-3" />
                {client.email}
              </a>
            )}
            <span>Apsilankė: {client.visits}</span>
            {client.lastVisit && <span>Paskutinis: {client.lastVisit}</span>}
          </div>
          {client.services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {client.services.map((s) => (
                <Badge key={s} variant="secondary" className="text-[11px]">
                  {s}
                </Badge>
              ))}
            </div>
          )}
          {client.note && !open && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
              {client.note}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setOpen((v) => !v)}>
            <StickyNote className="mr-1.5 h-3.5 w-3.5" /> Pastaba
          </Button>
          <Button
            size="sm"
            variant={client.isBlocked ? "secondary" : "outline"}
            className="rounded-full"
            disabled={saving}
            onClick={() => onSave({ ...base, is_blocked: !client.isBlocked, note: client.note })}
          >
            {client.isBlocked ? (
              <>
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Atblokuoti
              </>
            ) : (
              <>
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Blokuoti
              </>
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Pvz. alergija, plaukų spalvos formulė, pageidavimai."
            className="rounded-xl"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={saving}
              onClick={() => {
                onSave({ ...base, note, is_blocked: client.isBlocked });
                setOpen(false);
              }}
            >
              Išsaugoti pastabą
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
              Atšaukti
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
