import { Link } from "@tanstack/react-router";
import { BadgeCheck, Check, ChevronRight, ShieldCheck } from "lucide-react";
import type { AppRole } from "@/lib/auth-context";
import { roleLabel } from "@/lib/role-labels";
import { Card } from "@/components/ui/card";

type RoleSummary = {
  title: string;
  responsibilities: string[];
  manageTo?: string;
  manageLabel?: string;
};

const ROLE_SUMMARIES: Record<AppRole, RoleSummary> = {
  client: {
    title: "Asmeninė paskyra",
    responsibilities: ["Valdyti savo rezervacijas", "Saugoti pasirinktus salonus", "Tvarkyti pranešimus ir privatumą"],
    manageTo: "/dashboard/customer",
    manageLabel: "Mano rezervacijos",
  },
  salon: {
    title: "Salono valdymas",
    responsibilities: ["Tvarkyti saloną, komandą ir paslaugas", "Valdyti rezervacijas ir klientus", "Prižiūrėti viešą profilį ir darbo laiką"],
    manageTo: "/dashboard/salon/profile",
    manageLabel: "Redaguoti salono profilį",
  },
  staff: {
    title: "Meistrės darbo vieta",
    responsibilities: ["Valdyti savo kalendorių", "Prižiūrėti savo paslaugas ir klientus", "Atnaujinti viešą meistrės profilį"],
    manageTo: "/dashboard/salon/profile",
    manageLabel: "Redaguoti meistrės profilį",
  },
  supplier: {
    title: "Tiekėjo valdymas",
    responsibilities: ["Tvarkyti įmonės informaciją", "Skelbti produktus ir pasiūlymus", "Valdyti seminarus profesionalams"],
    manageTo: "/dashboard/supplier/profile",
    manageLabel: "Redaguoti įmonės profilį",
  },
  school: {
    title: "Mokyklos valdymas",
    responsibilities: ["Kurti ir atnaujinti mokymus", "Valdyti dalyvių registracijas", "Prižiūrėti mokyklos informaciją"],
    manageTo: "/dashboard/school/courses",
    manageLabel: "Valdyti mokyklą ir kursus",
  },
  advertiser: {
    title: "Skelbiko darbo vieta",
    responsibilities: ["Kurti ir tvarkyti skelbimus", "Stebėti aktyvius skelbimų paketus", "Valdyti paskyros kontaktus"],
    manageTo: "/skelbimai",
    manageLabel: "Valdyti skelbimus",
  },
  admin: {
    title: "Administravimo teisės",
    responsibilities: ["Prižiūrėti vartotojus ir patvirtinimus", "Tvarkyti platformos turinį", "Peržiūrėti sistemos veiksmus"],
    manageTo: "/admin",
    manageLabel: "Atidaryti administravimą",
  },
  super_admin: {
    title: "Visos sistemos valdymas",
    responsibilities: ["Valdyti platformą ir administratorių sritis", "Redaguoti svetainės turinį ir išvaizdą", "Prižiūrėti finansus, kopijas ir transliacijas"],
    manageTo: "/super-admin",
    manageLabel: "Atidaryti visos sistemos valdymą",
  },
};

export function AccountRoleSummary({ role }: { role: AppRole | null }) {
  if (!role) return null;
  const summary = ROLE_SUMMARIES[role];

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 p-0 shadow-none">
      <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyclamen/10 text-cyclamen">
          {role === "admin" || role === "super_admin" ? <ShieldCheck className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">Aktyvi paskyros rolė</p>
          <h2 className="font-display text-lg font-semibold">{roleLabel(role)}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{summary.title}</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Atsakomybės ir prieigos</h3>
        <ul className="mt-3 space-y-2.5">
          {summary.responsibilities.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      {summary.manageTo && (
        <Link to={summary.manageTo} className="flex min-h-12 items-center gap-2 border-t border-border/60 px-5 text-sm font-semibold text-cyclamen hover:bg-secondary">
          <span className="flex-1">{summary.manageLabel}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </Card>
  );
}