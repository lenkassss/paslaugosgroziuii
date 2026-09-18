import { SidebarAd } from "@/components/feed/feed-cards";

type Ad = Parameters<typeof SidebarAd>[0]["ad"];

/**
 * Vertical infinite-marquee sidebar advertising carousel.
 * Continuously scrolls the ad stack upward at a luxurious pace.
 * Hover to pause. Reduced motion → static list.
 */
export function SidebarAdCarousel({ ads, height = 620 }: { ads: Ad[]; height?: number }) {
  if (!ads?.length) return null;
  // Duplicate so the -50% translate loops seamlessly
  const loop = [...ads, ...ads];
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        height,
        maskImage: "linear-gradient(to bottom, transparent 0, #000 8%, #000 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 8%, #000 92%, transparent 100%)",
      }}
    >
      <div className="ad-marquee space-y-4">
        {loop.map((ad, i) => (
          <SidebarAd key={`${ad.id}-${i}`} ad={ad} />
        ))}
      </div>
    </div>
  );
}
