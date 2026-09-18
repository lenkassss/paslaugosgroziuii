import { useAuth } from "@/lib/auth-context";
import { worldFor } from "@/lib/access";
import { BubbleRow } from "@/components/home-bubbles";
import { tilesForRole } from "@/lib/app-nav";

/** B2B navigacijos burbulai — rodomi tik verslo paskyroms. */
export function B2BBubbles({ className }: { className?: string }) {
  const { role, loading } = useAuth();
  if (loading || worldFor(role) !== "b2b") return null;
  return <BubbleRow tiles={tilesForRole(role)} keyPrefix="business.section.bubble" className={className} />;
}
