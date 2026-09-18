/**
 * Native keyboard ergonomics (Capacitor).
 *
 * - Configures the keyboard to resize the body (see `capacitor.config.ts`).
 * - Keeps the focused input visible: on focus we scroll the field into the
 *   middle of the viewport once the keyboard animation settles.
 * - Adds a CSS class + custom property so layouts can react to the keyboard.
 *
 * Safe to import anywhere: everything is guarded and installs only once.
 */

import { isNativeRuntime } from "@/lib/native-backend";

let installed = false;

const FIELD_SELECTOR = "input, textarea, [contenteditable='true'], select";

function scrollFocusedIntoView(target: Element | null) {
  if (!target || !(target instanceof HTMLElement)) return;
  window.setTimeout(() => {
    try {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      /* older WebViews */
    }
  }, 260);
}

export function installNativeKeyboard(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const syncViewport = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--app-viewport-height", `${Math.round(height)}px`);
  };
  syncViewport();
  window.visualViewport?.addEventListener("resize", syncViewport);
  window.visualViewport?.addEventListener("scroll", syncViewport);
  window.addEventListener("orientationchange", syncViewport);

  // Focus-based scrolling helps on web + native alike (no-op cost when unused).
  document.addEventListener(
    "focusin",
    (e) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.(FIELD_SELECTOR)) scrollFocusedIntoView(el.closest(FIELD_SELECTOR));
    },
    true,
  );

  if (!isNativeRuntime()) return;

  void (async () => {
    try {
      const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
      await Keyboard.setScroll({ isDisabled: false }).catch(() => {});
      await Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});

      Keyboard.addListener("keyboardWillShow", (info) => {
        document.documentElement.classList.add("keyboard-open");
        document.documentElement.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
        scrollFocusedIntoView(document.activeElement);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        document.documentElement.classList.remove("keyboard-open");
        document.documentElement.style.setProperty("--keyboard-height", "0px");
      });
    } catch {
      /* plugin unavailable (web build) */
    }
  })();
}
