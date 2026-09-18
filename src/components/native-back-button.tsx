import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Android hardware back-button handling for the Capacitor build.
 * Closes any open drawer/dialog first, then goes back in history,
 * and only exits the app from the root screen.
 */
export function NativeBackButton() {
  const router = useRouter();

  useEffect(() => {
    let remove: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");

      const handle = await App.addListener("backButton", () => {
        const overlay = document.querySelector<HTMLElement>(
          '[data-state="open"][role="dialog"], [data-vaul-drawer][data-state="open"]',
        );
        if (overlay) {
          const closer = overlay.querySelector<HTMLElement>("[data-dialog-close], button[aria-label*='lose']");
          if (closer) closer.click();
          else document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          return;
        }
        if (window.history.length > 1 && router.state.location.pathname !== "/") {
          router.history.back();
          return;
        }
        void App.exitApp();
      });

      if (cancelled) void handle.remove();
      else remove = () => void handle.remove();
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [router]);

  return null;
}
