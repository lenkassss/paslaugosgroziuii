import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/settings.functions";
import { CookieConsentBanner, useCookieConsent } from "@/components/cookie-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

function injectGa(id: string) {
  if (document.getElementById("pg-ga")) return;
  const s = document.createElement("script");
  s.id = "pg-ga";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: true });
}

function injectPixel(id: string) {
  if (document.getElementById("pg-fbq")) return;
  const s = document.createElement("script");
  s.id = "pg-fbq";
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  const queue: unknown[] = [];
  const fbq = ((...args: unknown[]) => {
    queue.push(args);
  }) as NonNullable<Window["fbq"]>;
  fbq.queue = queue;
  fbq.version = "2.0";
  fbq.loaded = true;
  window.fbq = window.fbq || fbq;
  window._fbq = window._fbq || window.fbq;
  window.fbq("init", id);
  window.fbq("track", "PageView");
}

/**
 * Google Analytics + Meta Pixel. Kraunami tik gavus vartotojo sutikimą
 * ir tik jei super administratorius įrašė ID svetainės redaktoriuje.
 */
export function AnalyticsScripts() {
  const { data: settings } = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings(), staleTime: 60_000 });
  const { choice } = useCookieConsent();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const ga = settings?.ga_measurement_id?.trim();
  const pixel = settings?.meta_pixel_id?.trim();
  const allowed = choice === "all";

  useEffect(() => {
    if (!allowed) return;
    if (ga) injectGa(ga);
    if (pixel) injectPixel(pixel);
  }, [allowed, ga, pixel]);

  useEffect(() => {
    if (!allowed) return;
    if (ga && window.gtag) window.gtag("event", "page_view", { page_path: pathname });
    if (pixel && window.fbq) window.fbq("track", "PageView");
  }, [allowed, ga, pixel, pathname]);

  return <CookieConsentBanner text={settings?.cookie_banner_text} />;
}
