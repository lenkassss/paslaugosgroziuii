import { useCallback, useEffect, useState } from "react";

const KEY = "pg_favorites_v1";
const EVENT = "pg-favorites-changed";

export type FavoriteItem = {
  id: string;
  name: string;
  city?: string | null;
  image?: string | null;
  category?: string | null;
};

function read(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: FavoriteItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Device-local favourites ("Mėgstami") — works for guests and signed-in users,
 * survives app restarts and syncs instantly across every mounted component.
 */
export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isFavorite = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: FavoriteItem) => {
    const current = read();
    const exists = current.some((i) => i.id === item.id);
    write(exists ? current.filter((i) => i.id !== item.id) : [item, ...current]);
    return !exists;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, count: items.length, isFavorite, toggle, remove, clear };
}
