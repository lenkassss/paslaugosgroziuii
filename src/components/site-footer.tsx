import { Link } from "@tanstack/react-router";
import { LipsIcon } from "@/components/lips-icon";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, sectionVisible } from "@/lib/settings.functions";
import { useSection } from "@/lib/use-site-content";

export function SiteFooter() {
  const { t } = useTranslation();
  const { data: settings } = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings(), staleTime: 60_000 });
  const block = useSection("footer", "main");
  const name = settings?.site_name || settings?.brand_name || "PaslaugosGrožiui";
  const tagline = block?.body_text || settings?.footer_text || t("home.tagline");

  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={name} className="h-8 w-auto" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-gold">
                <LipsIcon className="h-3.5 w-[19px] text-primary-foreground drop-shadow-sm" />
              </div>
            )}
            <span className="font-display text-lg font-semibold">{name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs">{tagline}</p>
          <p className="text-xs text-muted-foreground mt-2">© {new Date().getFullYear()} {name} · {t("footer.rights")}</p>
        </div>
        {sectionVisible(settings, "footer_nav") && (
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Link to="/about" className="hover:text-primary">{t("footer.about")}</Link>
            <Link to="/duk" className="hover:text-primary">{t("footer.faq")}</Link>
            <Link to="/contact" className="hover:text-primary">{t("footer.contact")}</Link>
            <Link to="/privatumas" className="hover:text-primary">{t("footer.privacy")}</Link>
            <Link to="/pricing" className="hover:text-primary">{t("footer.pricing")}</Link>
            <Link to="/for-business" className="hover:text-primary">{t("footer.forBusiness")}</Link>
          </nav>
        )}
      </div>
    </footer>
  );
}
