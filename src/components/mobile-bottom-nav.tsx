import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarCheck, Heart, User, Briefcase } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/use-favorites";
import { isBusinessRole } from "@/lib/access";
import { dashboardPathFor } from "@/lib/dashboard-path";

/**
 * Native-app style fixed bottom tab bar (mobile only).
 * 4 tabs: Pradžia · Rezervacijos · Mėgstami · Profilis.
 * Frosted glass (backdrop-blur), 44px+ touch targets, safe-area aware,
 * animated active pill + press feedback.
 */
export function MobileBottomNav() {
  const { user, role } = useAuth();
  const { count } = useFavorites();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const bookingsPath = user
    ? role === "salon" || role === "staff"
      ? "/dashboard/salon/appointments"
      : "/dashboard/customer"
    : "/auth";

  const profilePath = user ? "/profile" : "/auth";

  const tabs = [
    { to: "/", label: "Pradžia", icon: Home, search: undefined, badge: 0 },
    {
      to: bookingsPath,
      label: "Rezervacijos",
      icon: CalendarCheck,
      search: user ? undefined : ({ mode: "signin" } as const),
      badge: 0,
    },
    isBusinessRole(role)
      ? { to: dashboardPathFor(role), label: "Valdymas", icon: Briefcase, search: undefined, badge: 0 }
      : { to: "/megstami", label: "Mėgstami", icon: Heart, search: undefined, badge: count },
    {
      to: profilePath,
      label: "Profilis",
      icon: User,
      search: user ? undefined : ({ mode: "signin" } as const),
      badge: 0,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Pagrindinė navigacija"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map((tab) => {
          const active = tab.to === "/" ? pathname === "/" : pathname === tab.to || pathname.startsWith(`${tab.to}/`);

          const Icon = tab.icon;
          return (
            <li key={tab.label}>
              <Link
                to={tab.to}
                search={tab.search as never}
                onClick={() => {
                  // Tapping an already-active tab jumps back to the top, like a native app.
                  if (active) window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex h-[var(--app-bottom-nav-height)] touch-target flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all duration-300 ease-out active:scale-90 ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`relative grid h-7 w-11 place-items-center rounded-full transition-all duration-300 ${
                    active ? "bg-accent text-cyclamen" : "bg-transparent"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {tab.badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </span>
                <span className="truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
