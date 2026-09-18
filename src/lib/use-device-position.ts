import { useEffect, useState } from "react";
import { getLocationConsent, onLocationConsentChange, requestLocation } from "@/lib/location-consent";

const KEY = "pg_geo";

type Pos = { lat: number; lng: number } | null;

let cached: Pos = null;

/**
 * One-shot, permission-friendly device position used for "x km away" labels.
 * Never blocks rendering, asks for an in-app rationale before the OS prompt and
 * silently stays null when permission is denied.
 */
export function useDevicePosition(): Pos {
  const [pos, setPos] = useState<Pos>(cached);
  const [consent, setConsent] = useState(() => getLocationConsent());

  useEffect(() => onLocationConsentChange(() => setConsent(getLocationConsent())), []);

  useEffect(() => {
    if (cached) return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Pos;
        if (p && typeof p.lat === "number") {
          cached = p;
          setPos(p);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    if (consent === "unknown") {
      requestLocation();
      return;
    }
    if (consent === "denied" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (g) => {
        const p = { lat: g.coords.latitude, lng: g.coords.longitude };
        cached = p;
        setPos(p);
        try {
          window.localStorage.setItem(KEY, JSON.stringify(p));
        } catch {
          /* ignore */
        }
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60_000 },
    );
  }, [consent]);

  return pos;
}
