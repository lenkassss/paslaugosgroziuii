/**
 * Native device navigation deep links.
 * iOS  -> Apple Maps, Android -> Google Maps navigation, web -> Google Maps.
 */
function platform(): "ios" | "android" | "web" {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "web";
}

export type MapTarget = {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  city?: string | null;
  label?: string | null;
};

/** Builds the best destination string available for a target. */
export function destinationOf(t: MapTarget): string | null {
  if (typeof t.lat === "number" && typeof t.lng === "number") return `${t.lat},${t.lng}`;
  const text = [t.address, t.city].filter(Boolean).join(", ").trim();
  return text || null;
}

export function directionsUrl(t: MapTarget): string | null {
  const dest = destinationOf(t);
  if (!dest) return null;
  const enc = encodeURIComponent(dest);
  switch (platform()) {
    case "ios":
      return `http://maps.apple.com/?daddr=${enc}&dirflg=d`;
    case "android":
      return `google.navigation:q=${enc}`;
    default:
      return `https://www.google.com/maps/dir/?api=1&destination=${enc}`;
  }
}

/** Opens the device's native navigation app for this destination. */
export function openNativeDirections(t: MapTarget) {
  const url = directionsUrl(t);
  if (!url || typeof window === "undefined") return;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationOf(t)!)}`;
  try {
    window.location.href = url;
    // Android intent schemes silently fail inside some webviews — safety net.
    if (url.startsWith("google.navigation:")) {
      window.setTimeout(() => {
        if (!document.hidden) window.open(fallback, "_blank", "noopener");
      }, 700);
    }
  } catch {
    window.open(fallback, "_blank", "noopener");
  }
}

/** Haversine distance in km between two coordinates. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
