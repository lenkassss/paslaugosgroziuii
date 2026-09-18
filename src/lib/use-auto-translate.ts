import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts } from "@/lib/translate.functions";
import { useLanguage } from "@/lib/use-language";

const memory = new Map<string, string>();

function cacheKey(lang: string, text: string) {
  return `tr:${lang}:${text.slice(0, 180)}`;
}

function readCache(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(key);
    if (v) memory.set(key, v);
    return v;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage full / private mode */
  }
}

/**
 * Translates dynamic strings (article titles, excerpts, categories, service
 * names) to the active language with a local cache. Returns the originals
 * while translation is in flight, so nothing ever flashes empty.
 */
export function useAutoTranslate(texts: (string | null | undefined)[]): string[] {
  const { lang } = useLanguage();
  const source = texts.map((t) => (t ?? "").toString());
  const signature = `${lang}|${source.join("\u0001")}`;
  const call = useServerFn(translateTexts);
  const [out, setOut] = useState<string[]>(source);

  useEffect(() => {
    if (lang === "lt" || source.every((s) => !s.trim())) {
      setOut(source);
      return;
    }
    let alive = true;

    // Serve from cache first for instant switching.
    const cached = source.map((s) => (s.trim() ? readCache(cacheKey(lang, s)) : s));
    setOut(cached.map((c, i) => c ?? source[i]!));

    const missing = source.filter((s, i) => s.trim() && !cached[i]);
    if (missing.length === 0) return;

    void (async () => {
      try {
        const res = await call({ data: { lang: lang as "en" | "ru", texts: missing.slice(0, 300) } });
        if (!alive) return;
        missing.forEach((src, i) => {
          const val = res.items[i];
          if (val) writeCache(cacheKey(lang, src), val);
        });
        setOut(source.map((s) => (s.trim() ? (readCache(cacheKey(lang, s)) ?? s) : s)));
      } catch {
        /* keep originals */
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return out.length === source.length ? out : source;
}

/** Single-string convenience wrapper. */
export function useAutoTranslateText(text: string | null | undefined): string {
  return useAutoTranslate([text])[0] ?? "";
}
