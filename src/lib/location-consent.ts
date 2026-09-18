/**
 * Location permission rationale gate.
 *
 * The OS prompt must never be the first thing the user sees, so components ask
 * here first: `requestLocation()` notifies the mounted rationale dialog, and the
 * browser geolocation call happens only after an explicit "granted" decision.
 */

const KEY = "pg_geo_consent";

export type LocationConsent = "unknown" | "granted" | "denied";

type Listener = () => void;

const requestListeners = new Set<Listener>();
const changeListeners = new Set<Listener>();

export function getLocationConsent(): LocationConsent {
  if (typeof window === "undefined") return "unknown";
  const raw = window.localStorage.getItem(KEY);
  return raw === "granted" || raw === "denied" ? raw : "unknown";
}

export function setLocationConsent(next: Exclude<LocationConsent, "unknown">): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* private mode */
  }
  changeListeners.forEach((l) => l());
}

/** Ask the mounted rationale dialog to explain itself (no-op once decided). */
export function requestLocation(): void {
  requestListeners.forEach((l) => l());
}

export function onLocationRequest(listener: Listener): () => void {
  requestListeners.add(listener);
  return () => requestListeners.delete(listener);
}

export function onLocationConsentChange(listener: Listener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}
