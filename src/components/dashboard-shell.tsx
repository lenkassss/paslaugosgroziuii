import { Link, useRouterState } from "@tanstack/react-router";
import { LipsIcon } from "@/components/lips-icon";
import { LayoutDashboard, Settings, ShieldCheck, LogOut, ChevronDown, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { roleLabel } from "@/lib/role-labels";
import { useIsPro } from "@/components/pro-gate";
import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { buildNavItems, navSections, isActivePath, GROUP_BADGES, G_MANAGE, type NavItem } from "@/lib/app-nav";
import { useLanguage } from "@/lib/use-language";
import { uiText } from "@/lib/ui-copy";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { role, user, signOut } = useAuth();
  const { lang } = useLanguage();
  const copy = (value: string) => uiText(value, lang);
  const state = useRouterState();
  const pathname = state.location.pathname;
  const { isPro } = useIsPro();

  const { data: isSuper } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    enabled: !!user?.id && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase.rpc("is_super_admin", { _user_id: user!.id });
      return !!data;
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["shell-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_primary_owner, business_name, owner_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const items = buildNavItems({ role, isSuper: !!isSuper, isPrimaryOwner: !!profile?.is_primary_owner });
  const lockedItems = items.map((n) => (n.pro && !isPro ? { ...n, locked: true } : n)) as Array<NavItem & { locked?: boolean }>;
  const sections = navSections(lockedItems);
  const activeItem = lockedItems.find((n) => isActivePath(pathname, n.to)) ?? lockedItems[0];
  const ActiveIcon = activeItem?.icon ?? LayoutDashboard;

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const activeGroup = activeItem?.group ?? "";
  const isOpen = (title: string) => open[title] ?? (title === "" || title === activeGroup || title === G_MANAGE);
  const toggle = (title: string) => setOpen((p) => ({ ...p, [title]: !isOpen(title) }));

  const accountName = profile?.owner_name || profile?.business_name || user?.email || "Paskyra";
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <div className="mx-auto grid min-w-0 max-w-7xl gap-4 px-4 py-4 md:grid-cols-[240px_minmax(0,1fr)] md:gap-6 md:px-6 md:py-8">
      <aside className="min-w-0 max-w-full">
        <Card className="hidden max-w-full overflow-hidden rounded-2xl border-border/70 p-0 shadow-none md:block">
          <div className="border-b border-border/60 px-4 py-4">
            <p className="mb-4 font-display text-lg font-semibold">{copy("Valdymas")}</p>
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foreground">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={accountName} className="h-full w-full object-cover" />
                ) : role === "admin" || role === "super_admin" ? (
                  <ShieldCheck className="h-4 w-4 text-background" />
                ) : (
                  <LipsIcon className="h-3.5 w-[19px] text-background" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{accountName}</div>
                <div className="truncate text-[11px] text-muted-foreground">{roleLabel(role)}</div>
              </div>
            </div>
          </div>
          <nav className="space-y-3 px-3 py-4">
            {sections.map((s, si) => (
              <div key={s.title || `s-${si}`} className="space-y-1">
                {s.title && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggle(s.title)}
                    aria-expanded={isOpen(s.title)}
                    className="min-h-10 w-full justify-between rounded-xl px-3 text-[10px] font-semibold uppercase text-muted-foreground"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-left">
                      <span className="truncate">{copy(s.title)}</span>
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[9px] normal-case text-foreground">{GROUP_BADGES[s.title]}</span>
                    </span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", !isOpen(s.title) && "-rotate-90")} />
                  </Button>
                )}
                {isOpen(s.title) && s.list.map((n) => {
                  const active = isActivePath(pathname, n.to);
                  return (
                    <Link
                      key={`${n.to}-${n.label}`}
                      to={(n.locked ? "/dashboard/addons" : n.to) as never}
                      hash={n.locked ? undefined : n.hash}
                      className={cn(
                        "relative flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                        active && !n.locked
                          ? "bg-cyclamen/10 font-semibold text-cyclamen before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-cyclamen"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        n.locked && "opacity-70",
                      )}
                    >
                      <n.icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{copy(n.label)}</span>
                      {n.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-primary/70" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="border-t border-border/60 p-3">
            <Button asChild variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
              <Link to="/profile"><Settings className="mr-2 h-4 w-4" />{copy("Profilis ir paskyra")}</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="mt-1 w-full justify-start text-muted-foreground">
              <LogOut className="mr-2 h-4 w-4" /> {copy("Atsijungti")}
            </Button>
          </div>
        </Card>

        {/* Telefone visas valdymas – tik slystančiame meniu. */}
        <Card className="max-w-full overflow-hidden rounded-2xl border-border/70 p-3 shadow-none md:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foreground">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={accountName} className="h-full w-full object-cover" />
                ) : role === "admin" || role === "super_admin" ? (
                  <ShieldCheck className="h-4 w-4 text-background" />
                ) : (
                  <LipsIcon className="h-3.5 w-[19px] text-background" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs text-muted-foreground">{accountName}</div>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                  <ActiveIcon className="h-4 w-4 shrink-0 text-primary" />
                   <span className="truncate">{copy(activeItem?.label ?? "Valdymas")}</span>
                </div>
              </div>
            </div>
            <AppMenuDrawer className="h-11 w-11 shrink-0 rounded-xl border border-border/70" />
          </div>
        </Card>
      </aside>
      <main className="min-w-0 animate-fade-in">{children}</main>
    </div>
  );
}
