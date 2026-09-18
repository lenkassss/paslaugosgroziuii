import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProfileEditor } from "@/components/profile-editor";

export const Route = createFileRoute("/_authenticated/dashboard/salon/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Salono ir meistrės profilis · PaslaugosGrožiui" },
      { name: "description", content: "Tvarkyk viešą profilį, nuotraukas, darbo laiką ir rezervacijų taisykles." },
      { property: "og:title", content: "Profilio valdymas · PaslaugosGrožiui" },
      { property: "og:description", content: "Profilio, darbo laiko ir rezervacijų nustatymai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProfilePage() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Profilis</h1>
        <p className="text-sm text-muted-foreground mt-1">Nuotraukos, informacija, darbo laikas ir taisyklės vienoje vietoje.</p>
      </div>
      <ProfileEditor kind="salon" />
    </DashboardShell>
  );
}
