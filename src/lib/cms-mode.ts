import { useEffect, useState } from "react";

/** Bendra redagavimo režimo būsena super administratoriui. */
let editing = false;
const listeners = new Set<(v: boolean) => void>();

export function setCmsEditing(v: boolean) {
  editing = v;
  listeners.forEach((l) => l(v));
}

export function useCmsEditing() {
  const [v, setV] = useState(editing);
  useEffect(() => {
    const l = (n: boolean) => setV(n);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return v;
}
