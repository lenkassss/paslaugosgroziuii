import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/error-reporting";

/** True for fetch/network-layer failures ("Load failed", "Failed to fetch", offline). */
export function isNetworkError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    msg.includes("load failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("fetch failed") ||
    msg.includes("timeout")
  );
}

function ErrorDetails({ error }: { error: unknown }) {
  const err = error instanceof Error ? error : new Error(String(error));
  const network = isNetworkError(err);
  return (
    <div className="mx-auto w-full max-w-lg px-5">
      <div className="animate-slide-up rounded-3xl border border-border/60 bg-background/70 p-6 backdrop-blur-xl shadow-elegant">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-gold text-primary-foreground shadow-glow">
          <span className="text-xl">!</span>
        </div>
        <h1 className="mt-4 text-center font-display text-2xl">
          {network ? "Nepavyko prisijungti" : "Kažkas nutiko"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {network
            ? "Patikrink interneto ryšį — duomenų nepavyko užkrauti. Pabandyk dar kartą po kelių sekundžių."
            : "Įvyko klaida kraunant šį ekraną."}
        </p>

        {!network && (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-destructive">
              {err.name}
            </div>
            <div className="mt-1 break-words text-sm font-medium text-foreground">{err.message}</div>
            {err.stack && (
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-relaxed text-muted-foreground">
                {err.stack}
              </pre>
            )}
          </div>
        )}


        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-95"
          >
            Perkrauti
          </button>
          <a
            href={window.location.hash ? "#/" : "/"}
            className="rounded-xl border border-border/60 bg-background px-5 py-2.5 text-sm font-medium transition active:scale-95"
          >
            Į pradžią
          </a>
        </div>
      </div>
    </div>
  );
}

/** TanStack Router route-level error screen (also used as defaultErrorComponent). */
export function RouteErrorScreen({ error }: { error: unknown }) {
  console.error("[route-error]", error);
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background py-10">
      <ErrorDetails error={error} />
    </div>
  );
}

type State = { error: unknown | null };

/**
 * Root React error boundary: catches render/effect crashes anywhere in the tree
 * so a broken screen shows the real error instead of a blank background
 * (critical inside the native WebView where devtools are unavailable).
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[app-error-boundary]", error, info.componentStack);
    reportClientError(error, { boundary: "app_root_error_boundary" });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-background py-10">
          <ErrorDetails error={this.state.error} />
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Auth failures on public screens (no bearer token yet) are not user-facing errors.
 */
export function isAuthError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    msg.includes("unauthorized") ||
    msg.includes("no authorization header") ||
    msg.includes("401") ||
    msg.includes("jwt expired") ||
    msg.includes("invalid claim")
  );
}
