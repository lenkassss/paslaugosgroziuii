import { useEffect, useState } from "react";
import { LipsIcon } from "@/components/site-header";

const SEEN_KEY = "pg_splash_seen";

/**
 * Luxury app launch animation.
 * Shows a branded champagne splash for ~1.6s, then fades out.
 * Always shown on a native/standalone launch, and once per browser session on web.
 */
export function AppLaunchSplash() {
  // Shown from the very first painted frame (no flash of unstyled content).
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.documentElement.classList.contains("capacitor-native");

    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    if (!standalone && seen) {
      setShow(false);
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode */
    }

    const t1 = setTimeout(() => setFading(true), 1350);
    const t2 = setTimeout(() => setShow(false), 1850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);


  if (!show) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-accent/60 blur-3xl" />

      <div className="relative flex flex-col items-center gap-5">
        <div className="grid h-24 w-24 place-items-center rounded-[2rem] gradient-gold text-primary-foreground shadow-glow animate-spring-in animate-pulse-gold">
          <LipsIcon className="h-8 w-[46px] drop-shadow" />
        </div>
        <div className="animate-fade-in text-center">
          <div className="font-display text-2xl tracking-tight">PaslaugosGrožiui</div>
          <div className="mt-1.5 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Grožio platforma
          </div>
        </div>
        <div className="mt-2 h-[3px] w-28 overflow-hidden rounded-full bg-border/70">
          <div className="h-full w-1/2 rounded-full gradient-gold animate-[shimmer_1.4s_linear_infinite]" />
        </div>
      </div>
    </div>
  );
}
