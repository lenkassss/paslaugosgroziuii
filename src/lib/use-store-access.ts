import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/settings.functions";
import { useAuth } from "@/lib/auth-context";
import { canSee, isBusinessRole } from "@/lib/access";

/**
 * B2B skiltys (Tiekėjų katalogas, Forumas, Skelbimai, Mokymai) prieinamos tik verslo rolėms.
 * Super Admin jungtukas (`public_b2c_store`) gali atverti katalogą visiems.
 */
export function useStoreAccess() {
  const { role, loading } = useAuth();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    staleTime: 5 * 60_000,
  });

  const isBusiness = isBusinessRole(role);
  const publicStore = !!settings?.features?.public_b2c_store;

  return {
    isPro: isBusiness,
    isBusiness,
    publicStore,
    canShop: canSee(role, "marketplace") || publicStore,
    /** Forumas — tik meistrės ir salonai (be tiekėjų, skelbikų ir klientų). */
    canForum: canSee(role, "forum"),
    canAcademy: canSee(role, "schools"),
    loading: loading || isLoading,
  };
}
