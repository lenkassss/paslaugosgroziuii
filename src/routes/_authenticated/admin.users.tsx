import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsersWithRoles, setUserRole, ALL_ROLES } from "@/lib/roles.functions";
import { adminBlockUser, adminUnblockUser } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, ShieldCheck, Crown } from "lucide-react";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: AdminUsers });

const ROLE_LABELS: Record<string, string> = {
  client: "Klientas", staff: "Meistrė", salon: "Salonas", supplier: "Tiekėjas",
  school: "Mokykla", employer: "Darbdavys", admin: "Admin", super_admin: "Super Admin",
};

function AdminUsers() {
  const qc = useQueryClient();
  const listFn = useServerFn(listUsersWithRoles);
  const setRoleFn = useServerFn(setUserRole);
  const blockFn = useServerFn(adminBlockUser);
  const unblockFn = useServerFn(adminUnblockUser);

  const { data } = useQuery({ queryKey: ["admin-users-roles"], queryFn: () => listFn() });
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");

  const roleMut = useMutation({
    mutationFn: (v: { userId: string; role: any; grant: boolean }) => setRoleFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users-roles"] }); toast.success("Rolė atnaujinta"); },
    onError: (e) => toastError(e),
  });
  const blockMut = useMutation({
    mutationFn: (v: { userId: string; reason: string }) => blockFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users-roles"] }); setBlockTarget(null); setReason(""); toast.success("Užblokuota"); },
  });
  const unblockMut = useMutation({
    mutationFn: (id: string) => unblockFn({ data: { userId: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users-roles"] }); toast.success("Atblokuota"); },
  });

  const filtered = (data?.users ?? []).filter((u: any) => {
    if (roleFilter === "blocked" && !u.blocked_at) return false;
    if (roleFilter !== "all" && roleFilter !== "blocked" && !(u.roles ?? []).includes(roleFilter)) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return u.business_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.owner_name?.toLowerCase().includes(s);
  });

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-2">Vartotojai ir rolės</h1>
      <p className="text-sm text-muted-foreground mb-4">Uždėk / nuimk bet kurią rolę bet kuriam vartotojui. Admin ir Super Admin roles gali keisti tik Super Admin.</p>

      <Card className="p-4 mb-4 space-y-3">
        <Input placeholder="Paieška pagal vardą, el. paštą…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {[
            { v: "all", label: "Visi" },
            { v: "client", label: "Klientai" },
            { v: "staff", label: "Meistrės" },
            { v: "salon", label: "Salonai" },
            { v: "supplier", label: "Tiekėjai" },
            { v: "school", label: "Mokyklos" },
            { v: "admin", label: "Administratoriai" },
            { v: "blocked", label: "Užblokuoti" },
          ].map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setRoleFilter(f.v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                roleFilter === f.v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">Rodoma: {filtered.length}</div>
      </Card>

      <div className="space-y-3">
        {filtered.map((u: any) => (
          <Card key={u.id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium flex items-center gap-2">
                  {u.business_name || u.owner_name || u.email}
                  {u.is_primary_owner && <Crown className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground">{u.email} · {u.city ?? "—"}</div>
                {u.blocked_at && <div className="text-xs text-destructive mt-1">Užblokuotas: {u.blocked_reason}</div>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {u.blocked_at && <Badge variant="destructive">Užblokuotas</Badge>}
                {u.subscription_active && <Badge className="bg-success/20 text-success border-0">VIP</Badge>}
                {u.blocked_at ? (
                  <Button size="sm" variant="outline" onClick={() => unblockMut.mutate(u.id)}><ShieldCheck className="h-4 w-4 mr-1" /> Atblokuoti</Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => setBlockTarget({ id: u.id, name: u.business_name || u.email })}><Ban className="h-4 w-4 mr-1" /> Blokuoti</Button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {ALL_ROLES.map((r) => {
                const has = u.roles.includes(r);
                return (
                  <label key={r} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition ${has ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                    <Checkbox
                      checked={has}
                      onCheckedChange={(v) => roleMut.mutate({ userId: u.id, role: r, grant: !!v })}
                      disabled={roleMut.isPending}
                    />
                    <span>{ROLE_LABELS[r]}</span>
                  </label>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!blockTarget} onOpenChange={(o) => !o && setBlockTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Užblokuoti vartotoją</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{blockTarget?.name}</p>
          <div><Label>Priežastis</Label><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTarget(null)}>Atšaukti</Button>
            <Button variant="destructive" disabled={reason.trim().length < 3 || blockMut.isPending}
              onClick={() => blockTarget && blockMut.mutate({ userId: blockTarget.id, reason })}>Užblokuoti</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
