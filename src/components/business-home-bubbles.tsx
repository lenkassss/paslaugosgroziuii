import { useAuth } from "@/lib/auth-context";
import { BubbleRow } from "@/components/home-bubbles";
import { tilesForRole } from "@/lib/app-nav";

/**
 * Verslo (B2B) burbuliukai – tas pats sąrašas kaip meniu punktai tai pačiai rolei.
 */
export function BusinessHomeBubbles({ className }: { className?: string }) {
  const { role } = useAuth();
  return <BubbleRow tiles={tilesForRole(role)} keyPrefix="business.bubble" className={className} />;
}
