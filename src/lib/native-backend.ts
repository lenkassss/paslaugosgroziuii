/**
 * Native (Capacitor) runtime bridge.
 *
 * In the native package the app is served from `capacitor://localhost` (or
 * `file://`), so relative paths like `/_serverFn/...` or `/api/...` have no
 * server behind them. This module rewrites those requests to the published
 * backend origin and is safe to import from client code (all browser access is
 * guarded and only runs once).
 */

const RAW_ORIGIN =
  (typeof import.meta !== "undefined" &&
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[
      "VITE_BACKEND_ORIGIN"
    ]) ||
  "https://www.testinispuslapis.online";

export const BACKEND_ORIGIN = RAW_ORIGIN.replace(/\/+$/, "");

const BACKEND_PATH = /^\/(_serverFn|api)(\/|$)/;

type CapacitorGlobal = { isNativePlatform?: () => boolean; getPlatform?: () => string };

/** Sync native detection — works before `@capacitor/core` is dynamically imported. */
export function isNativeRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  const proto = window.location.protocol;
  if (proto === "capacitor:" || proto === "ionic:" || proto === "file:") return true;
  return document.documentElement.classList.contains("capacitor-native");
}

function toAbsolute(pathname: string, search: string) {
  return BACKEND_ORIGIN + pathname + search;
}

let installed = false;

/**
 * Patch `fetch` (both `window` and `globalThis`) so every backend call uses an
 * absolute URL on device. Idempotent; a no-op on the web where relative paths
 * already work.
 */
export function installNativeBackendBridge(): void {
  if (installed || typeof window === "undefined") return;
  if (!isNativeRuntime()) return;
  installed = true;

  document.documentElement.classList.add("capacitor-native");
  (window as unknown as { __BACKEND_ORIGIN__?: string }).__BACKEND_ORIGIN__ = BACKEND_ORIGIN;

  const base = window.fetch.bind(window);
  const patched = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === "string") {
        const u = new URL(input, window.location.href);
        if (u.origin === window.location.origin && BACKEND_PATH.test(u.pathname)) {
          input = toAbsolute(u.pathname, u.search);
        }
      } else if (input instanceof URL) {
        if (input.origin === window.location.origin && BACKEND_PATH.test(input.pathname)) {
          input = new URL(toAbsolute(input.pathname, input.search));
        }
      } else if (input instanceof Request) {
        const u = new URL(input.url, window.location.href);
        if (u.origin === window.location.origin && BACKEND_PATH.test(u.pathname)) {
          input = new Request(toAbsolute(u.pathname, u.search), input);
        }
      }
    } catch {
      /* fall through with the original input */
    }
    return base(input as RequestInfo | URL, init);
  };

  window.fetch = patched;
  // Some bundled libraries capture `globalThis.fetch` instead of `window.fetch`.
  try {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = patched as typeof fetch;
  } catch {
    /* read-only in exotic runtimes — window patch is enough */
  }
}

// Install as early as the module is evaluated so no request escapes the bridge.
installNativeBackendBridge();


/**
 * Hash history needs a hash to boot from. A cold native launch opens
 * `capacitor://localhost/` (no hash), which would leave the router without a
 * location — force the root route before the router is created.
 */
export function ensureNativeRootHash(): void {
  if (typeof window === "undefined" || !isNativeRuntime()) return;
  const h = window.location.hash;
  if (!h || h === "#" || !h.startsWith("#/")) {
    window.history.replaceState(null, "", `${window.location.pathname}#/`);
  }
}
