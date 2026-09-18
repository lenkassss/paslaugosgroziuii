import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/platform.functions";
import { Card } from "@/components/ui/card";
import { Users, CreditCard, Euro, MessageCircle } from "lucide-react";
import { fmtMoney } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => getAdminDashboard({ data: undefined }) });
  if (!data) return <DashboardShell><div className="h-32 skeleton rounded" /></DashboardShell>;

  const totalUsers = Object.values(data.roleCounts).reduce((a, b) => a + b, 0);
  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-6">Administratoriaus panelė</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat icon={Users} label="Vartotojai" value={totalUsers} sub={`Salonų: ${data.roleCounts.salon} · Tiekėjų: ${data.roleCounts.supplier}`} />
        <Stat icon={CreditCard} label="Aktyvūs nariai" value={data.activeMembers} />
        <Stat icon={Euro} label="Šio mėn. pajamos" value={fmtMoney(data.mtdRevenue)} />
        <Stat icon={MessageCircle} label="B2B įrašai" value={data.pendingPosts} />
      </div>
      <Card className="p-6">
        <h2 className="font-display text-xl mb-4">Pajamų dinamika (12 mėn.)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.015 85)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0.015 85)" }} />
              <Line type="monotone" dataKey="revenue" stroke="oklch(0.78 0.12 85)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.78 0.12 85)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-5 hover-lift">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-display font-semibold">{value}</div>
          {sub && <div className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</div>}
        </div>
        <div className="h-10 w-10 rounded-lg gradient-gold flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
}
