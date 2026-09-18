import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";

import appCss from "../styles.css?url";
import { reportClientError } from "../lib/error-reporting";
import { AuthProvider } from "@/lib/auth-context";
import "@/lib/i18n";
import { useLanguage } from "@/lib/use-language";
import { HeaderStack } from "@/components/header-stack";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { NativeBackButton } from "@/components/native-back-button";
import { RoleSwitcher } from "@/components/role-switcher";
import { InlineCmsBar } from "@/components/inline-cms";
import { UniversalCms } from "@/components/universal-editor";
import { LipsIcon } from "@/components/lips-icon";

import { OfflineBanner } from "@/components/offline-banner";
import { LocationConsentPrompt } from "@/components/location-consent";
import { ThemeBootstrap } from "@/components/theme-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { AppErrorBoundary, RouteErrorScreen } from "@/components/app-error-boundary";


import { MaintenanceGate } from "@/components/maintenance-gate";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { GlobalAutoTranslate } from "@/components/global-auto-translate";


import { supabase } from "@/integrations/supabase/client";
import { installNativeKeyboard } from "@/lib/native-keyboard";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-slide-up">
        <h1 className="text-8xl font-display text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-display text-foreground">Puslapis nerastas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ieškomas puslapis neegzistuoja arba buvo perkeltas.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md gradient-gold px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant btn-press"
          >
            Į pradžią
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportClientError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div>
      <RouteErrorScreen error={error} />
      <div className="pb-10 text-center">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded-xl border border-border/60 bg-background px-5 py-2.5 text-sm font-medium transition active:scale-95"
        >
          Bandyti dar kartą
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#000000" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "PaslaugosGrožiui" },
      { title: "PaslaugosGrožiui – grožio paslaugos Lietuvoje" },
      { name: "description", content: "Prabangi grožio paslaugų platforma: rezervuok manikiūrą, kirpimą, makiažą ir kitas paslaugas geriausiuose Lietuvos salonuose. B2B tinklas verslui." },
      { name: "author", content: "PaslaugosGrožiui" },
      { property: "og:title", content: "PaslaugosGrožiui – rezervuok grožį akimirksniu" },
      { property: "og:description", content: "Prabangi grožio paslaugų platforma su interaktyviu žemėlapiu, gyva rezervacija ir B2B verslo tinklu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="lt">
      <head>
        <HeadContent />
      </head>
      <body>
        <div id="native-boot-splash" aria-hidden="true">
          <div className="native-boot-mark"><LipsIcon className="h-9 w-7" /></div>
          <div className="native-boot-name">PaslaugosGrožiui</div>
          <div className="native-boot-line"><span /></div>
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Re-keying the tree on language change guarantees every screen re-translates.
  const { lang } = useLanguage();
  useEffect(() => {
    installNativeKeyboard();
  }, []);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

  // Immersive, native-app style screens: article reader + auth run chrome-free on mobile.
  const immersive = pathname.startsWith("/article/") || pathname.startsWith("/auth");
  const fullscreen = pathname.startsWith("/auth");

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MaintenanceGate>
            <div key={lang} className="flex min-h-dvh flex-col overflow-x-hidden">
              {immersive ? (
                <div className="hidden md:block">
                  <HeaderStack showAnnouncement={!fullscreen} />
                </div>
              ) : (
                <HeaderStack showAnnouncement={!fullscreen} />
              )}

              <main
                key={pathname}
                className={`flex-1 animate-page-enter ${fullscreen ? "" : "pb-[env(safe-area-inset-bottom)]"}`}
              >
                <Outlet />
              </main>

              {/* Footer is desktop-only — the bottom tab bar replaces it in the app. */}
              <div className="hidden md:block">
                <SiteFooter />
              </div>
            </div>
          </MaintenanceGate>
          <Toaster position="top-center" closeButton />
          <NativeBackButton />
          <OfflineBanner />
          <LocationConsentPrompt />
          <ThemeBootstrap />
          <ThemeProvider />
          <RoleSwitcher />
          <InlineCmsBar />
          <UniversalCms />
          <AnalyticsScripts />
          <GlobalAutoTranslate />
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
