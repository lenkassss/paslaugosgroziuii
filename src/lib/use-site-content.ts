import { useQuery } from "@tanstack/react-query";
import { listSiteContent, type SiteContentBlock } from "@/lib/site-content.functions";

/** Visi vieši redaguojami tekstai (kešuoti). */
export function useSiteContent() {
  const { data } = useQuery({
    queryKey: ["site-content"],
    queryFn: () => listSiteContent(),
    staleTime: 60_000,
  });
  return data ?? [];
}

/** Vienos sekcijos tekstai su atsarginėmis reikšmėmis. */
export function useSection(page: string, section: string) {
  const all = useSiteContent();
  return all.find((b) => b.page_slug === page && b.section_id === section) as SiteContentBlock | undefined;
}
