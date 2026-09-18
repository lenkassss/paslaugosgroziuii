import { Link } from "@tanstack/react-router";
import { useSiteContent } from "@/lib/use-site-content";
import type { SiteContentBlock } from "@/lib/site-content.functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAutoTranslate } from "@/lib/use-auto-translate";

/**
 * Super administratoriaus sukurti laisvi blokai.
 * Rodomi pasirinktame puslapyje pagal eilės numerį – tekstas, antraštės,
 * nuotraukos, mygtukai ar atskyrimo linijos, be jokio kodo redagavimo.
 */
export function SiteBlocks({ page, className }: { page: string; className?: string }) {
  const all = useSiteContent();
  const blocks = all
    .filter((b) => b.page_slug === page && b.is_custom)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (blocks.length === 0) return null;

  return (
    <div className={cn("mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6", className)}>
      {blocks.map((b) => <SiteBlock key={b.id} block={b} />)}
    </div>
  );
}

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

function SiteBlock({ block }: { block: SiteContentBlock }) {
  const align = ALIGN[block.align ?? "left"] ?? ALIGN.left;
  const [title, subtitle, body, buttonText] = useAutoTranslate([
    block.title, block.subtitle, block.body_text, block.button_text,
  ]);

  if (block.block_kind === "divider") {
    return <hr className="border-border" />;
  }

  const wrap = cn(
    align,
    block.style === "card" && "rounded-3xl border border-border bg-card p-6 shadow-elegant md:p-8",
    block.style === "highlight" && "rounded-3xl border border-primary/30 bg-primary/5 p-6 md:p-8",
    block.style === "muted" && "rounded-3xl bg-secondary/50 p-6 md:p-8",
  );

  return (
    <section className={wrap}>
      {title && (
        <h2 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{title}</h2>
      )}
      {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}

      {block.block_kind === "image" && block.image_url && (
        <img
          src={block.image_url}
          alt={block.title ?? ""}
          loading="lazy"
          className="mt-4 w-full rounded-2xl border border-border object-cover"
        />
      )}

      {body && (
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}

      {block.button_text && block.button_link && (
        <div className={cn("mt-5", block.align === "center" && "flex justify-center", block.align === "right" && "flex justify-end")}>
          {block.button_link.startsWith("http") ? (
            <Button asChild className="btn-press">
              <a href={block.button_link} target="_blank" rel="noreferrer">{buttonText}</a>
            </Button>
          ) : (
            <Button asChild className="btn-press">
              <Link to={block.button_link as any}>{buttonText}</Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
