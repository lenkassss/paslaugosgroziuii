import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngBoundsExpression, LatLngExpression, Map as LeafletMap } from "leaflet";
import { openNativeDirections } from "@/lib/native-maps";
type LeafletMod = typeof import("leaflet");

export type MapSalon = {
  id: string;
  business_name: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  category?: string | null;
  address?: string | null;
  cover_url?: string | null;
  kind?: "salon" | "specialist" | null;
  rating?: number | null;
  is_featured?: boolean | null;
  featured_until?: string | null;
};

/** Lithuania viewport guards — nothing outside the country is ever shown. */
const LT_CENTER: LatLngExpression = [55.1694, 23.8813];
const VILNIUS: LatLngExpression = [54.6872, 25.2797];
const LT_BOUNDS: LatLngBoundsExpression = [
  [53.85, 20.85],
  [56.47, 26.92],
];
const inLithuania = (lat: number, lng: number) =>
  lat >= 53.8 && lat <= 56.5 && lng >= 20.8 && lng <= 27.0;

export function SalonMap({
  salons,
  highlightedId,
  onHighlight,
  singleFocus,
}: {
  salons: MapSalon[];
  highlightedId?: string | null;
  onHighlight?: (id: string | null) => void;
  singleFocus?: boolean;
}) {
  const [Mod, setMod] = useState<typeof import("react-leaflet") | null>(null);
  const [L, setL] = useState<LeafletMod | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([m, lmod]) => {
      const l = (lmod as unknown as { default: LeafletMod }).default ?? lmod;
      setMod(m);
      setL(l);
    });
  }, []);

  const withCoords = useMemo(
    () => salons.filter((s) => s.lat != null && s.lng != null && inLithuania(s.lat!, s.lng!)),
    [salons],
  );

  const center: LatLngExpression = useMemo(() => {
    if (singleFocus && withCoords[0]) return [withCoords[0].lat!, withCoords[0].lng!];
    if (!withCoords.length) return VILNIUS;
    if (withCoords.length === 1) return [withCoords[0].lat!, withCoords[0].lng!];
    return LT_CENTER;
  }, [withCoords, singleFocus]);

  /** Tile-grid repaint + bounds fitting once the container has real dimensions. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !L) return;
    const t1 = window.setTimeout(() => {
      map.invalidateSize();
      if (!singleFocus && withCoords.length > 1) {
        map.fitBounds(
          withCoords.map((s) => [s.lat!, s.lng!] as [number, number]),
          { padding: [24, 24], maxZoom: 12 },
        );
      }
    }, 120);
    const t2 = window.setTimeout(() => map.invalidateSize(), 600);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", onResize);
    };
  }, [L, Mod, withCoords, singleFocus]);

  if (!Mod || !L) return <div className="h-full w-full skeleton" />;

  const { MapContainer, TileLayer, Marker, Popup } = Mod;

  const now = Date.now();
  const isFeatured = (s: MapSalon) =>
    !!s.is_featured && !!s.featured_until && new Date(s.featured_until).getTime() > now;

  const badgeIcon = (s: MapSalon, highlighted: boolean) => {
    const featured = isFeatured(s);
    const size = highlighted ? 46 : featured ? 42 : 38;
    const ring = highlighted
      ? "box-shadow:0 0 0 3px var(--map-pin-active),0 8px 20px -6px rgba(0,0,0,.45);"
      : "box-shadow:0 6px 16px -6px rgba(0,0,0,.35);";
    const pulse = featured || highlighted
      ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:radial-gradient(closest-side,var(--map-pin-glow),transparent 70%);animation:pin-ping 1.8s cubic-bezier(0,0,.2,1) infinite;"></span>`
      : "";
    const glyph = s.kind === "specialist"
      // sparkle
      ? `<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" fill="white"/>`
      // scissors
      : `<g stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"><circle cx="7" cy="18" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="M8.6 16.2L17 4M15.4 16.2L7 4"/></g>`;

    return L.divIcon({
      className: "ab-pin-wrap",
      html: `<div class="ab-pin" style="width:${size}px;height:${size}px;position:relative;">
        ${pulse}
        <span style="position:absolute;inset:0;border-radius:9999px;background:var(--map-pin);border:2.5px solid #fff;${ring}display:grid;place-items:center;">
          <svg viewBox="0 0 24 24" width="${Math.round(size * 0.55)}" height="${Math.round(size * 0.55)}" xmlns="http://www.w3.org/2000/svg">${glyph}</svg>
        </span>
      </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 6)],
    });
  };

  return (
    <MapContainer
      ref={(m: LeafletMap | null) => { mapRef.current = m; }}
      center={center}
      zoom={singleFocus ? 14 : withCoords.length === 1 ? 12 : 7}
      minZoom={6}
      maxBounds={LT_BOUNDS}
      maxBoundsViscosity={0.9}
      style={{ height: "100%", width: "100%", background: "transparent" }}
      scrollWheelZoom
      zoomControl={!singleFocus}
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap, &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
        detectRetina
        maxZoom={19}
      />
      {withCoords.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat!, s.lng!]}
          icon={badgeIcon(s, s.id === highlightedId)}
          eventHandlers={{
            mouseover: () => onHighlight?.(s.id),
            mouseout: () => onHighlight?.(null),
             click: () => onHighlight?.(s.id),
          }}
        >
          <Popup closeButton={false} className="ab-popup" maxWidth={280} minWidth={260}>
            <div className="w-[260px] overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-md">
              <div className="relative aspect-video bg-muted">
                {s.cover_url ? (
                  <img src={s.cover_url} alt={s.business_name ?? "Salonas"} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full gradient-gold" />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-foreground">
                  {s.kind === "specialist" ? "Individuali meistrė" : "Salonas"}
                </span>
                {isFeatured(s) && (
                  <span className="absolute right-2 top-2 rounded-full gradient-gold px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Išskirtinis
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base leading-tight text-foreground line-clamp-2 m-0">
                    {s.business_name ?? "Salonas"}
                  </h3>
                  <span className="shrink-0 text-xs font-medium text-primary">★ {(s.rating ?? 4.9).toFixed(1)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground m-0">
                  {[s.address, s.city].filter(Boolean).join(", ") || s.city}
                  {s.category ? ` · ${s.category}` : ""}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {!singleFocus && (
                    <a
                      href={`/salon/${s.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg gradient-gold px-3 py-2 text-xs font-semibold text-primary-foreground no-underline transition hover:opacity-90"
                    >
                      Peržiūrėti
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => openNativeDirections({ lat: s.lat, lng: s.lng, address: s.address, city: s.city, label: s.business_name })}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    Naviguoti
                  </button>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
