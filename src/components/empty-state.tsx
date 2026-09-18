import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Luxury empty state — soft champagne halo, icon, copy and a call to action.
 * Used everywhere a list can be empty so no screen ever looks broken.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`relative overflow-hidden rounded-3xl border-border/60 p-8 text-center glass ${className}`}>
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent shadow-glow">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <h3 className="mt-5 font-display text-xl">{title}</h3>
        {description && <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </Card>
  );
}
