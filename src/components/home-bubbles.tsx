import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Styleable } from "@/components/styleable";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { tilesForRole, type BubbleTile } from "@/lib/app-nav";
import { useLanguage } from "@/lib/use-language";
import { uiText } from "@/lib/ui-copy";

/**
 * Tekstiniai burbuliukai. Sąrašas visada sutampa su meniu punktais tai pačiai rolei.
 */
export function BubbleRow({
  tiles,
  keyPrefix = "home.bubble",
  className,
}: {
  tiles: BubbleTile[];
  keyPrefix?: string;
  className?: string;
}) {
  const { lang } = useLanguage();
  if (tiles.length === 0) return null;
  return (
    <div
      data-drag-scroll
      className={cn(
        "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pb-3 pt-2 sm:scroll-pl-6 sm:px-6 md:mx-0 md:flex-wrap md:justify-center md:gap-5 md:overflow-visible md:px-0",
        className,
      )}
    >
      {tiles.map((b, index) => (
        <Styleable key={b.to + b.label} elementKey={`${keyPrefix}:${b.to}`} label={b.label} className="shrink-0 snap-start">
          {(style: CSSProperties) => (
            <Link
              to={b.to as never}
              hash={b.hash}
              style={style}
              className="bubble-enter group flex aspect-square w-[112px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-full border border-border bg-card p-3 text-center shadow-none transition duration-300 ease-out hover:-translate-y-1 hover:border-cyclamen hover:shadow-sm active:scale-[0.94] sm:w-[120px]"
              data-index={index}
            >
              <span className="block text-[12px] font-semibold leading-tight md:text-[13px]">{uiText(b.label, lang)}</span>
              <span className="block text-[9px] leading-tight text-muted-foreground md:text-[10px]">{uiText(b.hint, lang)}</span>
            </Link>
          )}
        </Styleable>
      ))}
    </div>
  );
}

/** Klientinis (B2C) naršymas – pagal rolę: neprisijungęs, klientas ar skelbikas. */
export function HomeBubbles({ className }: { className?: string }) {
  const { role } = useAuth();
  return <BubbleRow tiles={tilesForRole(role)} className={className} />;
}
