import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { dashboardPathFor } from "@/lib/dashboard-path";

/**
 * Verslo centro nebėra – visa verslo navigacija gyvena šoninėje juostoje.
 * Senos nuorodos nukreipiamos į naudotojo valdymo skiltį.
 */
export const Route = createFileRoute("/_authenticated/verslas")({
  component: BusinessRedirect,
  head: () => ({
    meta: [
      { title: "Mano valdymas · PaslaugosGrožiui" },
      { name: "description", content: "Verslo valdymo skiltis PaslaugosGrožiui platformoje." },
      { property: "og:title", content: "Mano valdymas · PaslaugosGrožiui" },
      { property: "og:description", content: "Verslo valdymo skiltis." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function BusinessRedirect() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate({ to: dashboardPathFor(role) as never, replace: true });
  }, [loading, role, navigate]);

  return <div className="p-10 text-center text-sm text-muted-foreground">Nukreipiame į jūsų valdymo skiltį…</div>;
}
