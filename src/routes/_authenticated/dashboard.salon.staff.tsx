import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyStaff, upsertStaff, deleteStaff, createStaffInvite, listStaffInvites, revokeStaffInvite } from "@/lib/staff.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, User, Mail, Copy, X, CheckCircle2 } from "lucide-react";
import { initials } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";
import { ProGate } from "@/components/pro-gate";

export const Route = createFileRoute("/_authenticated/dashboard/salon/staff")({ component: Page });

type StaffRow = {
  id: string;
  staff_name: string;
  specialization: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
};

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyStaff);
  const upFn = useServerFn(upsertStaff);
  const delFn = useServerFn(deleteStaff);
  const { data } = useQuery({ queryKey: ["my-staff"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<Partial<StaffRow> | null>(null);

  const upsert = useMutation({
    mutationFn: (v: Partial<StaffRow>) => upFn({ data: {
      id: v.id,
      staff_name: v.staff_name ?? "",
      specialization: v.specialization ?? null,
      avatar_url: v.avatar_url ?? "",
      bio: v.bio ?? null,
      is_active: v.is_active ?? true,
    } }),
    onSuccess: () => { toast.success("Išsaugota"); setEditing(null); qc.invalidateQueries({ queryKey: ["my-staff"] }); },
    onError: (e) => toastError(e),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Ištrinta"); qc.invalidateQueries({ queryKey: ["my-staff"] }); },
    onError: (e) => toastError(e),
  });

  // Invitations
  const invListFn = useServerFn(listStaffInvites);
  const createInvFn = useServerFn(createStaffInvite);
  const revokeInvFn = useServerFn(revokeStaffInvite);
  const invitesQ = useQuery({ queryKey: ["my-staff-invites"], queryFn: () => invListFn() });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSpec, setInviteSpec] = useState("");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const createInv = useMutation({
    mutationFn: () => createInvFn({ data: { email: inviteEmail.trim(), invited_name: inviteName.trim() || undefined, specialization: inviteSpec.trim() || undefined } }),
    onSuccess: (res) => {
      const url = `${window.location.origin}/auth?invite=${res.invite?.token}`;
      setLastInviteLink(url);
      setInviteEmail(""); setInviteName(""); setInviteSpec("");
      toast.success("Kvietimas išsiųstas");
      qc.invalidateQueries({ queryKey: ["my-staff-invites"] });
    },
    onError: (e) => toastError(e),
  });
  const revokeInv = useMutation({
    mutationFn: (id: string) => revokeInvFn({ data: { id } }),
    onSuccess: () => { toast.success("Kvietimas atšauktas"); qc.invalidateQueries({ queryKey: ["my-staff-invites"] }); },
  });

  return (
    <DashboardShell>
      <ProGate feature="komandos valdymas">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="font-display text-3xl">Meistrės</h1>
          <p className="text-sm text-muted-foreground">Pakviesk meistres el. paštu — jos prisijungs ir gaus savo kalendorių tavo salone.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setInviteOpen(true); setLastInviteLink(null); }}>
            <Mail className="mr-2 h-4 w-4" /> Pakviesti el. paštu
          </Button>
          <Button onClick={() => setEditing({ is_active: true })} className="gradient-gold text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Pridėti rankiniu būdu
          </Button>
        </div>
      </div>

      {/* Pending invites */}
      {invitesQ.data && invitesQ.data.invites.filter((i) => i.status === "pending").length > 0 && (
        <Card className="p-4 mb-4 border-primary/30 bg-primary/5">
          <div className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary" /> Laukiama atsakymo</div>
          <div className="space-y-2">
            {invitesQ.data.invites.filter((i) => i.status === "pending").map((i) => {
              const url = `${window.location.origin}/auth?invite=${i.token}`;
              return (
                <div key={i.id} className="flex items-center justify-between gap-2 bg-background/70 rounded-md p-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{i.invited_name || i.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{i.email}{i.specialization ? ` · ${i.specialization}` : ""}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(url); toast.success("Nuoroda nukopijuota"); }}>
                      <Copy className="h-3 w-3 mr-1" /> Nuoroda
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => revokeInv.mutate(i.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.staff ?? []).map((s) => (
          <Card key={s.id} className="p-4 hover-lift">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                {s.avatar_url ? <AvatarImage src={s.avatar_url} /> : null}
                <AvatarFallback className="bg-primary/20 text-primary">{initials(s.staff_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate flex items-center gap-1.5">{s.staff_name}{(s as any).user_id && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}</div>
                <div className="text-xs text-muted-foreground truncate">{s.specialization || "—"}</div>
                {(s as any).user_id && <Badge variant="outline" className="mt-1 text-[10px] border-primary/30 text-primary">Prisijungusi</Badge>}
                {!s.is_active && <div className="text-[10px] text-destructive uppercase tracking-wide mt-0.5">Neaktyvi</div>}
              </div>
            </div>
            {s.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{s.bio}</p>}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setEditing(s)}><Pencil className="h-3 w-3 mr-1" /> Redaguoti</Button>
              <Button variant="ghost" size="sm" onClick={() => confirm(`Ištrinti ${s.staff_name}?`) && del.mutate(s.id)}><Trash2 className="h-3 w-3 mr-1" /> Ištrinti</Button>
            </div>
          </Card>
        ))}
        {!data?.staff?.length && (
          <Card className="p-10 text-center text-muted-foreground col-span-full">
            <User className="mx-auto h-8 w-8 mb-2 text-muted-foreground/50" />
            Kol kas nepridėjote nei vienos meistrės. Klientams bus rodomas vienas bendras salono kalendorius.
          </Card>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pakviesti meistrę</DialogTitle>
            <DialogDescription>Įvesk el. paštą — meistrė gaus nuorodą prisijungti prie tavo salono. Ji automatiškai gaus meistrės rolę ir asmeninį kalendorių.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>El. paštas *</Label>
              <Input type="email" placeholder="meistre@pvz.lt" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vardas (neprivaloma)</Label>
                <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
              </div>
              <div>
                <Label>Specializacija</Label>
                <Input placeholder="pvz. Manikiūristė" value={inviteSpec} onChange={(e) => setInviteSpec(e.target.value)} />
              </div>
            </div>
            {lastInviteLink && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="text-xs font-medium mb-1 text-primary">Kvietimo nuoroda (demo režimas):</div>
                <div className="flex gap-2">
                  <Input value={lastInviteLink} readOnly className="text-xs" />
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(lastInviteLink); toast.success("Nukopijuota"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Nusiųsk šią nuorodą meistrei el. paštu ar žinute — paspaudusi ir prisijungusi ji taps tavo salono komandos dalimi.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Uždaryti</Button>
            <Button
              disabled={!inviteEmail.includes("@") || createInv.isPending}
              onClick={() => createInv.mutate()}
              className="gradient-gold text-primary-foreground"
            >
              <Mail className="mr-2 h-4 w-4" /> Siųsti kvietimą
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Redaguoti meistrę" : "Nauja meistrė"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Vardas *</Label>
                <Input value={editing.staff_name ?? ""} onChange={(e) => setEditing({ ...editing, staff_name: e.target.value })} />
              </div>
              <div>
                <Label>Specializacija</Label>
                <Input placeholder="pvz. Manikiūristė, Kirpėja" value={editing.specialization ?? ""} onChange={(e) => setEditing({ ...editing, specialization: e.target.value })} />
              </div>
              <div>
                <Label>Nuotraukos URL</Label>
                <Input value={editing.avatar_url ?? ""} onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })} />
              </div>
              <div>
                <Label>Trumpas prisistatymas</Label>
                <Textarea rows={3} value={editing.bio ?? ""} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Aktyvi (matoma klientams)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Atšaukti</Button>
            <Button disabled={!editing?.staff_name || upsert.isPending} onClick={() => editing && upsert.mutate(editing)} className="gradient-gold text-primary-foreground">Išsaugoti</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </ProGate>
    </DashboardShell>
  );
}
