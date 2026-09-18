import { Link, useRouter } from "@tanstack/react-router";
import { Globe, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { LANGS, useLanguage } from "@/lib/use-language";

import { NotificationsBell } from "@/components/notifications-bell";


import { LipsIcon } from "@/components/lips-icon";
import { dashboardPathFor } from "@/lib/dashboard-path";

export { LipsIcon };




export function SiteHeader() {
  const { t } = useTranslation();
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const { lang, setLanguage } = useLanguage();

  const pickLang = (next: string) => setLanguage(next);

  const dashboardPath = dashboardPathFor(role);

  const doSignOut = async () => {
    await signOut();
    router.navigate({ to: "/" });
  };

  return (
    <header className="w-full border-b border-border/50 glass-strong pt-[env(safe-area-inset-top)]">
      {/* Viršuje – tik logotipas, kalba, pranešimai, paskyra ir meniu. Naršymas gyvena burbuluose ir meniu. */}
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-1">
          <Link to="/" className="flex min-w-0 items-center gap-2 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground transition-transform duration-300 group-hover:scale-105">
              <LipsIcon className="h-4 w-[22px] text-primary-foreground drop-shadow-sm" />
            </div>
            <span className="hidden truncate font-display text-lg font-semibold tracking-tight min-[360px]:block sm:text-xl">
               Paslaugos<span className="text-cyclamen">Grožiui</span>
            </span>
          </Link>
        </div>


        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2 justify-self-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 px-1.5 sm:px-2">
                <Globe className="h-4 w-4" />
                <span className="uppercase text-xs font-semibold">{lang}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGS.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => pickLang(l.code)}>
                  <span className={lang === l.code ? "font-semibold text-primary" : ""}>{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>


          {user && <NotificationsBell />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-1.5 sm:gap-2 sm:px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {initials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs max-w-[90px] truncate">{user.email?.split("@")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.navigate({ to: dashboardPath })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.dashboard")}
                </DropdownMenuItem>
                {(role === "admin" || role === "super_admin") && (
                  <DropdownMenuItem onClick={() => router.navigate({ to: "/admin" })}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> {t("nav.admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={doSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                <Link to="/auth" search={{ mode: "signin" }}>{t("nav.signIn")}</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex gradient-gold text-primary-foreground btn-press hover:opacity-90">
                <Link to="/auth" search={{ mode: "signup" }}>{t("nav.signUp")}</Link>
              </Button>
            </>
          )}

          <AppMenuDrawer className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
