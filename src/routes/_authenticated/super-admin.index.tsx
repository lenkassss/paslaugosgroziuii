import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { superAdminOverview, superAdminListUsers, superAdminSetRole, adminListHighlights, adminBlockUser, adminUnblockUser, adminSetSalonApproved } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Crown, Users, Ban, Sparkles, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { roleLabel, statusLabel } from "@/lib/role-labels";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/super-admin/")({
  component: SuperAdmin,
});

function StatCard({ icon: Icon, label, value, tone = "default" }: { icon: any; label: string; value: number; tone?: "default" | "danger" | "gold" }) {
  const toneCls = tone === "danger" ? "text-destructive" : tone === "gold" ? "text-primary" : "";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${toneCls}`} />
      </div>
      <div className={`mt-2 text-3xl font-semibold ${toneCls}`}>{value}</div>
    </Card>
  );
}

function SuperAdmin() {
  const qc = useQueryClient();
  const ov = useServerFn(superAdminOverview);
  const list = useServerFn(superAdminListUsers);
  const setRole = useServerFn(superAdminSetRole);
  const hlist = useServerFn(adminListHighlights);
  const blockUser = useServerFn(adminBlockUser);
  const unblockUser = useServerFn(adminUnblockUser);
  const setApproved = useServerFn(adminSetSalonApproved);

  const overview = useQuery({ queryKey: ["sa-overview"], queryFn: () => ov() });
  const users = useQuery({ queryKey: ["sa-users"], queryFn: () => list() });
  const highlights = useQuery({ queryKey: ["sa-highlights"], queryFn: () => hlist() });

  const [q, setQ] = useState("");

  const roleMut = useMutation({
    mutationFn: (v: { userId: string; role: any; grant: boolean }) => setRole({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sa-users"] }); qc.invalidateQueries({ queryKey: ["sa-overview"] }); toast.success("Atnaujinta"); },
    onError: (e) => toastError(e),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["sa-users"] });
    qc.invalidateQueries({ queryKey: ["sa-overview"] });
  };

  const blockMut = useMutation({
    mutationFn: (v: { userId: string; reason: string }) => blockUser({ data: v }),
    onSuccess: () => { refresh(); toast.success("Vartotojas užblokuotas"); },
    onError: (e) => toastError(e),
  });
  const unblockMut = useMutation({
    mutationFn: (v: { userId: string }) => unblockUser({ data: v }),
    onSuccess: () => { refresh(); toast.success("Vartotojas atblokuotas"); },
    onError: (e) => toastError(e),
  });
  const approveMut = useMutation({
    mutationFn: (v: { salonId: string; approved: boolean }) => setApproved({ data: v }),
    onSuccess: (_d, v) => { refresh(); toast.success(v.approved ? "Paskyra patvirtinta" : "Patvirtinimas atšauktas"); },
    onError: (e) => toastError(e),
  });

  const filtered = (users.data?.users ?? []).filter((u: any) =>
    !q || u.business_name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <Crown className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl">Super administratorius</h1>
          <p className="text-sm text-muted-foreground">Aukščiausio lygio valdymas — teisės, blokavimai, mokėjimai.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Vartotojai" value={overview.data?.users ?? 0} />
        <StatCard icon={ShieldCheck} label="Admin/Super" value={overview.data?.admins ?? 0} tone="gold" />
        <StatCard icon={Ban} label="Užblokuoti" value={overview.data?.blocked ?? 0} tone="danger" />
        <StatCard icon={Sparkles} label="Aktyvūs paryškinimai" value={overview.data?.activeHighlights ?? 0} tone="gold" />
        <StatCard icon={Users} label="Salonai" value={overview.data?.salons ?? 0} />
        <StatCard icon={Users} label="Tiekėjai" value={overview.data?.suppliers ?? 0} />
        <StatCard icon={Calendar} label="Apmokėti renginiai" value={overview.data?.paidEventRegs ?? 0} />
      </div>

      <Card className="p-4 mb-4">
        <h2 className="font-display text-xl mb-3">Teisių valdymas</h2>
        <Input placeholder="Paieška..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {filtered.map((u: any) => {
            const isAdmin = u.roles.includes("admin");
            const isSuper = u.roles.includes("super_admin");
            const blocked = Boolean(u.blocked_at);
            const busy = roleMut.isPending || blockMut.isPending || unblockMut.isPending || approveMut.isPending;
            return (
              <div key={u.id} className="py-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{u.business_name || u.email}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {u.email} · {u.roles.map((r: string) => roleLabel(r)).join(", ") || roleLabel("client")}
                    </div>
                    {blocked && u.blocked_reason && (
                      <div className="mt-1 text-xs text-destructive">Užblokuota: {u.blocked_reason}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {isSuper && <Badge className="bg-primary text-primary-foreground"><Crown className="mr-1 h-3 w-3" />Super</Badge>}
                    {isAdmin && !isSuper && <Badge variant="secondary"><ShieldCheck className="mr-1 h-3 w-3" />Administratorius</Badge>}
                    {blocked && <Badge variant="destructive">Užblokuota</Badge>}
                    {u.is_approved === false && !blocked && <Badge variant="outline">Nepatvirtinta</Badge>}
                    {u.subscription_active && <Badge variant="outline">Narystė aktyvi</Badge>}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant={isAdmin ? "outline" : "default"} disabled={busy}
                    onClick={() => roleMut.mutate({ userId: u.id, role: "admin", grant: !isAdmin })}>
                    {isAdmin ? "Nuimti administratorių" : "Padaryti administratoriumi"}
                  </Button>
                  <Button size="sm" variant={isSuper ? "outline" : "default"} disabled={busy}
                    className={!isSuper ? "gradient-gold text-primary-foreground" : ""}
                    onClick={() => roleMut.mutate({ userId: u.id, role: "super_admin", grant: !isSuper })}>
                    {isSuper ? "Nuimti super teises" : "Suteikti super teises"}
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy}
                    onClick={() => approveMut.mutate({ salonId: u.id, approved: u.is_approved === false })}>
                    {u.is_approved === false ? "Patvirtinti paskyrą" : "Atšaukti patvirtinimą"}
                  </Button>
                  {blocked ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => unblockMut.mutate({ userId: u.id })}>
                      Atblokuoti
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" disabled={busy}
                      onClick={() => {
                        const reason = window.prompt("Blokavimo priežastis (bus matoma vartotojui):");
                        if (reason && reason.trim().length >= 3) blockMut.mutate({ userId: u.id, reason: reason.trim() });
                        else if (reason !== null) toast.error("Nurodykite bent 3 simbolių priežastį.");
                      }}>
                      <Ban className="mr-1 h-3 w-3" />Blokuoti
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-xl mb-3">Paskutiniai paryškinimai (€4,99/sav.)</h2>
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {(highlights.data?.highlights ?? []).map((h: any) => (
            <div key={h.id} className="py-2 flex items-center gap-3 text-sm">
              <Badge variant="outline">{h.target_kind}</Badge>
              <div className="flex-1 min-w-0 truncate text-xs text-muted-foreground">{h.target_id}</div>
              <span className="text-xs">{h.weeks} sav.</span>
              <span className="font-medium">{(h.amount_cents / 100).toFixed(2)}€</span>
              <Badge variant={h.payment_status === "paid" ? "default" : "secondary"}>{statusLabel(h.payment_status)}</Badge>
              <span className="text-xs text-muted-foreground">iki {new Date(h.ends_at).toLocaleDateString("lt-LT")}</span>
            </div>
          ))}
          {highlights.data && highlights.data.highlights.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Kol kas nėra paryškinimų.</div>
          )}
        </div>
      </Card>
    </DashboardShell>
  );
}
