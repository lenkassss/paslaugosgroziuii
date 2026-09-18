import { useEffect, useState } from "react";

/**
 * True only after the client has hydrated.
 * Use it to gate anything time-, locale- or device-dependent so the first
 * client render matches the server markup exactly.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
