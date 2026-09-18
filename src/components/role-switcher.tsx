import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserCog, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/role-labels";

const ROLES: Array<{ v: AppRole; label: string; hint: string }> = [
  { v: "client", label: "Klientas", hint: "Rezervavimai, mėgstami meistrai" },
  { v: "staff", label: "Meistrė", hint: "Asmeninis kalendorius" },
  { v: "salon", label: "Salonas", hint: "Visas verslo pultas" },
  { v: "supplier", label: "Tiekėjas", hint: "Produktų valdymas" },
  { v: "school", label: "Grožio mokykla", hint: "Kursai ir studentai" },
  { v: "advertiser", label: "Skelbikas", hint: "Tik skelbimų lenta" },
  { v: "admin", label: "Administratorius", hint: "Platformos valdymas" },
];

export function RoleSwitcher() {
  const { user, realRole, role, setDemoRole } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Administrators and the salon owner can preview every account experience.
  const { data: canUse } = useQuery({
    queryKey: ["can-role-switch", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (realRole === "admin" || realRole === "super_admin" || realRole === "salon") return true;
      if (!user?.id) return false;
      const { data: p } = await supabase.from("profiles").select("is_primary_owner").eq("id", user.id).maybeSingle();
      return !!p?.is_primary_owner;
    },
  });

  if (!user || !canUse) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <Card className="w-[280px] p-3 shadow-elegant border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserCog className="h-4 w-4 text-primary" />
              Demo rolė
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-7 w-7 rounded-md">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
            Tikra rolė: <span className="font-medium text-foreground">{realRole ?? "—"}</span>
          </div>
          <div className="space-y-1 max-h-[320px] overflow-auto">
            {ROLES.map((r) => (
              <Button
                type="button"
                variant="outline"
                key={r.v}
                onClick={() => {
                  setDemoRole(r.v === realRole ? null : r.v);
                  setOpen(false);
                  router.navigate({ to: "/" });
                }}
                className={cn(
                  "h-auto w-full justify-start rounded-md border px-2.5 py-2 text-left text-xs transition",
                  role === r.v ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-accent",
                )}
              >
                <div className="font-medium">{r.label}</div>
                <div className="text-[10px] text-muted-foreground">{r.hint}</div>
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setDemoRole(null)}>
            Grąžinti savo rolę
          </Button>
        </Card>
      ) : (
        <Button
          type="button"
          variant="default"
          onClick={() => setOpen(true)}
          className="h-10 rounded-full px-4 text-xs font-medium shadow-sm"
        >
          <UserCog className="h-4 w-4" />
          {role !== realRole ? `Demo: ${roleLabel(role, true)}` : "Keisti rolę"}
        </Button>
      )}
    </div>
  );
}
