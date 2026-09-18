import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProfileEditor } from "@/components/profile-editor";

export const Route = createFileRoute("/_authenticated/dashboard/supplier/profile")({
  component: SupplierProfile,
});

function SupplierProfile() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Tiekėjo profilis</h1>
        <p className="text-sm text-muted-foreground mt-1">Logotipas, viršelis, produktų galerija, kontaktai — viskas viename.</p>
      </div>
      <ProfileEditor kind="supplier" />
    </DashboardShell>
  );
}
