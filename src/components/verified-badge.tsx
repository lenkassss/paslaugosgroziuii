import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Auksinė „Patvirtinta" varnelė — rodoma tik salonams, kurių
 * verification_status = 'verified'. Skirta pabrėžti, kad platformos
 * administracija patikrino verslo dokumentus ir savininko tapatybę.
 */
export function VerifiedBadge({
  status,
  size = "sm",
  showLabel = false,
  className,
}: {
  status?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  if (status !== "verified") return null;
  const dims = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];
  if (showLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
          className,
        )}
        title="PaslaugosGrožiui · patvirtinta administracijos"
      >
        <BadgeCheck className={dims} />
        Patvirtinta
      </span>
    );
  }
  return (
    <span title="PaslaugosGrožiui · patvirtinta administracijos" className={cn("inline-flex", className)}>
      <BadgeCheck
        className={cn("text-primary drop-shadow-sm", dims)}
        aria-label="Patvirtintas salonas"
      />
    </span>
  );
}
