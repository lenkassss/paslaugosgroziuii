import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Link } from "@tanstack/react-router";

const KEY = "pg_cookie_consent";

export type CookieChoice = "all" | "necessary";

/** Vartotojo pasirinkimas dėl slapukų (įsimenamas įrenginyje). */
export function useCookieConsent() {
  const [choice, setChoice] = useState<CookieChoice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    setChoice(saved === "all" || saved === "necessary" ? saved : null);
    setReady(true);
    const onChange = () => {
      const v = localStorage.getItem(KEY);
      setChoice(v === "all" || v === "necessary" ? v : null);
    };
    window.addEventListener("pg-cookie-consent", onChange);
    return () => window.removeEventListener("pg-cookie-consent", onChange);
  }, []);

  const decide = (v: CookieChoice) => {
    localStorage.setItem(KEY, v);
    window.dispatchEvent(new Event("pg-cookie-consent"));
  };

  return { choice, ready, decide };
}

/** Slapukų sutikimo juosta — rodoma tol, kol vartotojas nepasirenka. */
export function CookieConsentBanner({ text }: { text?: string | null }) {
  const { choice, ready, decide } = useCookieConsent();
  if (!ready || choice) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(var(--app-bottom-nav-height,0px)+env(safe-area-inset-bottom)+0.75rem)] md:pb-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background/98 p-4 shadow-elegant backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary">
            <Cookie className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Slapukai</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {text ||
                "Naudojame būtinus slapukus, kad svetainė veiktų, ir analitikos slapukus, kad suprastume, kaip ją naudojate."}{" "}
              <Link to="/privatumas" className="underline">
                Privatumo politika
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => decide("necessary")}
            className="h-11 rounded-xl border border-border text-sm font-medium transition active:scale-95"
          >
            Tik būtini
          </button>
          <button
            type="button"
            onClick={() => decide("all")}
            className="h-11 rounded-xl gradient-gold text-sm font-semibold text-primary-foreground shadow-elegant transition active:scale-95"
          >
            Sutinku su visais
          </button>
        </div>
      </div>
    </div>
  );
}
