import { useEffect, useState } from "react";
import i18n from "@/lib/i18n";

export const LANGS = [
  { code: "lt", label: "Lietuvių", short: "LT", flag: "🇱🇹" },
  { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
  { code: "ru", label: "Русский", short: "RU", flag: "🇷🇺" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

/** Persists the choice and applies it everywhere (i18next + <html lang>). */
export function setLanguage(next: string) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("lang", next);
    } catch {
      /* private mode */
    }
    document.documentElement.setAttribute("lang", next);
  }
  void i18n.changeLanguage(next);
}

/**
 * Reactive current language. Any component using this re-renders the moment
 * the language changes — on web and inside the native app alike.
 */
export function useLanguage() {
  const [lang, setLang] = useState<string>(i18n.language || "lt");

  useEffect(() => {
    const onChange = (next: string) => setLang(next);
    i18n.on("languageChanged", onChange);
    // Catch a language applied before this component mounted (hydration path).
    if (i18n.language && i18n.language !== lang) setLang(i18n.language);
    return () => {
      i18n.off("languageChanged", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { lang, setLanguage };
}
