import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Lock, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LipsIcon } from "@/components/lips-icon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useIsPro } from "@/components/pro-gate";
import { roleLabel } from "@/lib/role-labels";
import { cn } from "@/lib/utils";
import { buildNavItems, navSections, isActivePath, GROUP_BADGES, G_MARKET, G_OTHER, type NavItem } from "@/lib/app-nav";
import { QuickPurchaseList } from "@/components/quick-purchase";
import { addonsForRole } from "@/lib/addons";
import { useLanguage } from "@/lib/use-language";
import { uiText } from "@/lib/ui-copy";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Vienas visos programėlės meniu: visas valdymas gyvena tik čia. */
export function AppMenuDrawer({ className }: { className?: string }) {
  const { role, user, signOut } = useAuth();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const copy = (value: string) => uiText(value, lang);
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPro } = useIsPro();
  const [open, setOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({});
  const [gateOpen, setGateOpen] = useState(false);

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

  const items = buildNavItems({
    role,
    isSuper: !!isSuper,
    isPrimaryOwner: !!profile?.is_primary_owner,
    signedIn: !!user,
  });
  const locked = items.map((n) => (n.pro && !isPro ? { ...n, locked: true } : n)) as Array<NavItem & { locked?: boolean }>;
  const baseSections = navSections(locked);
  // Papildomos paslaugos rodomos ir tada, kai rolė neturi atskiro navigacijos punkto šioje skiltyje.
  const hasPurchasableAddons = addonsForRole(role).length > 0;
  const sections = user && hasPurchasableAddons && !baseSections.some((section) => section.title === G_MARKET)
    ? [
        ...baseSections.filter((section) => section.title !== "Informacija ir pagalba"),
        { title: G_MARKET, list: [] },
        ...baseSections.filter((section) => section.title === "Informacija ir pagalba"),
      ]
    : baseSections;
  const activeGroup = locked.find((n) => isActivePath(pathname, n.to))?.group ?? "";
  // Visos skiltys – akordeonai. Atidaryta tik ta, kurioje esame.
  const isOpen = (title: string) => groupsOpen[title] ?? title === activeGroup;
  const toggle = (title: string) => setGroupsOpen((p) => ({ ...p, [title]: !isOpen(title) }));

  const displayName = profile?.owner_name || profile?.business_name || user?.email?.split("@")[0] || "Sveiki";

  const doSignOut = async () => {
    setOpen(false);
    await signOut();
    router.navigate({ to: "/" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-10 w-10 active:rotate-3 active:scale-90", className)} aria-label={copy("Atverti meniu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[88vw] max-w-sm flex-col gap-0 border-l border-border/60 bg-background p-0">
        <SheetHeader className="border-b border-border/60 bg-card px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-left">
          <SheetTitle className="sr-only">{copy("Programėlės meniu")}</SheetTitle>
          <SheetDescription className="sr-only">{copy("Valdymas, paslaugos ir paskyros nustatymai")}</SheetDescription>
          {user ? (
            <SheetClose asChild>
              <Link to="/profile" className="flex items-center gap-3 rounded-2xl transition active:scale-[0.98]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-foreground">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : role === "admin" || role === "super_admin" ? (
                    <ShieldCheck className="h-5 w-5 text-background" />
                  ) : (
                    <LipsIcon className="h-4 w-[22px] text-background" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{displayName}</span>
                  {profile?.business_name && <span className="block truncate text-xs text-muted-foreground">{profile.business_name}</span>}
                  <span className="block truncate text-[11px] text-muted-foreground">{roleLabel(role)}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-cyclamen">
                    {copy("Žiūrėti savo profilį")} <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </span>
              </Link>
            </SheetClose>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground">
                <LipsIcon className="h-4 w-[22px] text-background" />
              </span>
              <div className="min-w-0">
                <div className="truncate font-display text-lg font-semibold">Paslaugos<span className="text-cyclamen">Grožiui</span></div>
                <SheetClose asChild>
                  <Link to="/auth" search={{ mode: "signin" }} className="text-xs font-semibold text-cyclamen">{copy("Prisijungti")}</Link>
                </SheetClose>
              </div>
            </div>
          )}
        </SheetHeader>

        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Programėlės skiltys">
          {sections.map((s, si) => {
            const title = s.title || G_OTHER;
            return (
            <div key={s.title || `s-${si}`} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggle(title)}
                aria-expanded={isOpen(title)}
                className="flex h-auto min-h-13 w-full items-center justify-start gap-2 rounded-none px-4 py-3 text-left active:scale-[0.98]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{copy(title)}</span>
                  {user && GROUP_BADGES[title] && <span className="block text-[11px] text-muted-foreground">{GROUP_BADGES[title]}</span>}
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", !isOpen(title) && "-rotate-90")} />
              </Button>
              <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", isOpen(title) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="min-h-0 overflow-hidden">
                <div className="divide-y divide-border/60 border-t border-border/60">
                  {s.list.map((n) => {
                    const active = isActivePath(pathname, n.to) && !n.locked;
                    const rowClass = cn(
                      "flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm transition duration-200 active:scale-[0.99]",
                      active ? "bg-cyclamen/10 font-semibold text-cyclamen" : "text-foreground hover:bg-secondary",
                      n.locked && "opacity-70",
                    );
                    // Neprisijungusiam vartotojui uždaryta skiltis atveria prisijungimo langą.
                    if (n.gated && !user) {
                      return (
                        <button
                          key={`${n.to}-${n.label}`}
                          type="button"
                          onClick={() => { setOpen(false); setGateOpen(true); }}
                          className={rowClass}
                        >
                          <n.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{copy(n.label)}</span>
                          <Lock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                        </button>
                      );
                    }
                    return (
                      <SheetClose asChild key={`${n.to}-${n.label}`}>
                        <Link to={(n.locked ? "/dashboard/addons" : n.to) as never} hash={n.locked ? undefined : n.hash} className={rowClass}>
                          <n.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{copy(n.label)}</span>
                          {n.locked ? <Lock className="h-3.5 w-3.5 shrink-0 text-primary/70" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
                        </Link>
                      </SheetClose>
                    );
                  })}
                  {s.title === G_MARKET && user && (
                    <div className="space-y-2 bg-background p-3">
                      <QuickPurchaseList role={role} />
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>
            );
          })}
        </nav>

        <div className="border-t border-border/60 bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {user ? (
            <Button variant="outline" onClick={doSignOut} className="h-12 w-full rounded-2xl active:scale-95">
              <LogOut className="mr-2 h-4 w-4" /> {t("nav.signOut")}
            </Button>
          ) : (
            <SheetClose asChild>
              <Link to="/auth" search={{ mode: "signup" }} className="flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background active:scale-95">
                {copy("Sukurti paskyrą")}
              </Link>
            </SheetClose>
          )}
        </div>
      </SheetContent>

      <AlertDialog open={gateOpen} onOpenChange={setGateOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy("Prisijunkite")}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy("Norėdami matyti išskirtinius pasiūlymus bei nuolaidas, prisijunkite arba susikurkite nemokamą paskyrą.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link to="/auth" search={{ mode: "signin" }} onClick={() => setGateOpen(false)}>{copy("Prisijungti")}</Link>
            </Button>
            <Button asChild className="h-11 rounded-xl">
              <Link to="/auth" search={{ mode: "signup" }} onClick={() => setGateOpen(false)}>{copy("Registruotis")}</Link>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
