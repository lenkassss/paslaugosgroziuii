import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ownerSearchUsers, ownerGrantMembership, ownerGrantFeatured } from "@/lib/finance.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Search, Gift, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/super-admin/grants")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: p } = await supabase.from("profiles").select("is_primary_owner").eq("id", data.user.id).maybeSingle();
    if (!p?.is_primary_owner) throw redirect({ to: "/" });
  },
  component: GrantsPage,
});

function GrantsPage() {
  const qc = useQueryClient();
  const searchFn = useServerFn(ownerSearchUsers);
  const grantMemFn = useServerFn(ownerGrantMembership);
  const grantFeatFn = useServerFn(ownerGrantFeatured);

  const [q, setQ] = useState("");
  const search = useQuery({ queryKey: ["owner-search", q], queryFn: () => searchFn({ data: { q: q || undefined } }) });

  const grantMem = useMutation({
    mutationFn: (v: { user_id: string; months: number }) => grantMemFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner-search"] }); toast.success("Narystė padovanota"); },
    onError: (e) => toastError(e),
  });
  const grantFeat = useMutation({
    mutationFn: (v: { user_id: string; days: number }) => grantFeatFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner-search"] }); toast.success("Paryškinimas suteiktas"); },
    onError: (e) => toastError(e),
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg gradient-gold flex items-center justify-center">
          <Gift className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl">Nemokamos narystės / paryškinimai</h1>
          <p className="text-sm text-muted-foreground">Tik pagrindinio savininko įrankis · rankinis dovanojimas.</p>
        </div>
        <Badge className="ml-auto gradient-gold text-primary-foreground border-0"><Crown className="h-3 w-3 mr-1" />Owner only</Badge>
      </div>

      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Ieškoti pagal el. paštą, verslo vardą..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </Card>

      <div className="space-y-3">
        {search.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {search.data?.items.map((u: any) => {
          const featActive = u.is_featured && u.featured_until && new Date(u.featured_until) > new Date();
          return (
            <Card key={u.id} className="p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium flex items-center gap-2">
                  {u.business_name || u.owner_name || u.email}
                  {u.is_primary_owner && <Badge className="gradient-gold text-primary-foreground border-0"><Crown className="h-3 w-3 mr-1" />Owner</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {u.subscription_active && <Badge variant="outline">Narystė aktyvi</Badge>}
                  {featActive && <Badge className="gradient-gold text-primary-foreground border-0"><Sparkles className="h-3 w-3 mr-1" />Paryškintas</Badge>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => grantMem.mutate({ user_id: u.id, months: 1 })}>+1 mėn. narystė</Button>
                <Button size="sm" variant="outline" onClick={() => grantMem.mutate({ user_id: u.id, months: 12 })}>+12 mėn. narystė</Button>
                <Button size="sm" variant="outline" onClick={() => grantFeat.mutate({ user_id: u.id, days: 7 })}>+7 d. paryšk.</Button>
                <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => grantFeat.mutate({ user_id: u.id, days: 30 })}>+30 d. paryšk.</Button>
              </div>
            </Card>
          );
        })}
        {search.data?.items.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">Rezultatų nėra</Card>
        )}
      </div>
    </DashboardShell>
  );
}
