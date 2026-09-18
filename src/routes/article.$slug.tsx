import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getArticle, getHome } from "@/lib/feed.functions";
import { getPlacementAds } from "@/lib/ads.functions";
import { TrendingList } from "@/components/feed/feed-cards";
import { SidebarAdCarousel } from "@/components/feed/sidebar-ad-carousel";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Eye, Clock, Share2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAutoTranslate, useAutoTranslateText } from "@/lib/use-auto-translate";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CommentThread } from "@/components/comments/comment-thread";
import { EventRegisterCard } from "@/components/event-register-card";
import { Percent, Timer } from "lucide-react";

const opts = (slug: string) => queryOptions({
  queryKey: ["article", slug],
  queryFn: () => getArticle({ data: { slug } }),
});

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(opts(params.slug));
    } catch {
      throw notFound();
    }
  },
  component: Article,
  errorComponent: ({ error }) => <div className="p-8 text-center text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Straipsnis nerastas</h1>
      <Button asChild className="mt-6"><Link to="/">Į pradžią</Link></Button>
    </div>
  ),
  head: () => ({
    meta: [
      { title: "Straipsnis · PaslaugosGrožiui" },
      { name: "description", content: "Grožio industrijos naujienos, tendencijos ir profesionalų patarimai." },
      { property: "og:type", content: "article" },
    ],
  }),

});

/** Cleans raw feed artifacts (escaped newlines, stray markdown) before parsing. */
function normalizeMd(md: string) {
  return (md ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\/n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function Article() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(opts(slug));
  const a = data.article;
  const author = data.author;
  const [progress, setProgress] = useState(0);
  const { data: meta } = useQuery({ queryKey: ["home", "meta"], queryFn: () => getHome(), staleTime: 60_000 });
  const { data: sideAds } = useQuery({
    queryKey: ["ads", "placement", "article_sidebar"],
    queryFn: () => getPlacementAds({ data: { placement: "home_sidebar", limit: 3 } }),
    staleTime: 60_000,
  });

  const body = normalizeMd(a.body_md);
  const [tTitle, tSub, tCat] = useAutoTranslate([a.title, a.subtitle ?? "", a.category ?? ""]);
  const tBody = useAutoTranslateText(body);
  const readMins = Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

  const share = async () => {
    const url = window.location.href;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try {
      if (typeof nav.share === "function") {
        await nav.share({ title: a.title, text: a.subtitle ?? a.title, url });
        return;
      }
      await nav.clipboard.writeText(url);
      toast.success("Nuoroda nukopijuota");
    } catch {
      /* user dismissed the share sheet */
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <article className="min-h-[100dvh] overflow-x-hidden pb-24 md:pb-0">
      {/* Reading progress — pinned to the very top on mobile (no header), under it on desktop */}
      <div className="fixed left-0 top-[calc(env(safe-area-inset-top)+3rem)] z-50 h-0.5 w-full bg-transparent md:top-16">
        <div className="h-full gradient-gold transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {/* Native-style reader bar — sits under the status bar, never over the clock */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 pt-[env(safe-area-inset-top)] backdrop-blur-2xl backdrop-saturate-150 md:hidden">
        <div className="flex h-12 items-center gap-2 px-3">
          <Link
            to="/"
            aria-label="Atgal į srautą"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/50 bg-background/60 transition-transform duration-200 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">{tCat}</span>
          <button
            type="button"
            aria-label="Dalintis"
            onClick={share}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/50 bg-background/60 transition-transform duration-200 active:scale-95"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <header className="mx-auto max-w-3xl px-5 pb-8 pt-[calc(env(safe-area-inset-top)+4.5rem)] md:px-6 md:pt-8">
        <Button asChild variant="ghost" size="sm" className="mb-6 hidden text-muted-foreground md:inline-flex">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Į srautą</Link>
        </Button>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/40 text-primary">{tCat}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <BookOpen className="h-3 w-3" /> {readMins} min skaitymo
          </span>
        </div>
        <h1 className="font-display text-[30px] font-semibold leading-[1.12] tracking-normal animate-fade-in md:text-5xl">{tTitle}</h1>
        {tSub && <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground animate-fade-in md:text-xl">{tSub}</p>}

        <div className="mt-6 flex items-center justify-between gap-4 flex-wrap border-y border-border/60 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={author?.avatar_url ?? undefined} />
              <AvatarFallback className="gradient-gold text-primary-foreground text-xs">{(author?.business_name ?? "AG").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              {author ? (
                <Link to="/salon/$id" params={{ id: author.id }} className="font-semibold text-sm hover:text-primary">{author.business_name ?? author.owner_name}</Link>
              ) : <span className="font-semibold text-sm">Redakcija</span>}
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" />{new Date(a.published_at).toLocaleDateString("lt-LT", { day: "numeric", month: "long", year: "numeric" })}
                <span>·</span><Eye className="h-3 w-3" />{a.views.toLocaleString("lt-LT")}
              </div>
            </div>
          </div>
          <Button size="icon" variant="outline" onClick={share} aria-label="Dalintis">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {a.cover_url && (
        <div className="mx-auto max-w-5xl px-3 md:px-6">
          <div className="relative overflow-hidden rounded-[22px] shadow-elegant animate-scale-in md:rounded-3xl">
            <img loading="eager" decoding="async" src={a.cover_url} alt={a.title} className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-[1.03] md:aspect-[16/9]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-9 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {a.kind === "promo" && (
            <div className="mb-8 p-5 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent flex items-center gap-4">
              <div className="h-16 w-16 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-display text-2xl font-bold">
                −{a.promo_discount_pct ?? 0}%
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">Speciali akcija</div>
                {a.promo_ends_at && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Timer className="h-3.5 w-3.5" /> Galioja iki {new Date(a.promo_ends_at).toLocaleDateString("lt-LT")}
                  </div>
                )}
              </div>
              {author && (
                <Button asChild size="sm" className="gradient-gold text-primary-foreground">
                  <Link to="/salon/$id" params={{ id: author.id }}>Rezervuoti</Link>
                </Button>
              )}
            </div>
          )}

          {a.kind === "event" && (
            <div className="mb-8 lg:hidden"><EventRegisterCard article={a} /></div>
          )}

          <div className="prose prose-stone dark:prose-invert article-body max-w-none break-words text-[17px] leading-[1.8] prose-headings:font-display prose-headings:tracking-normal prose-headings:leading-tight prose-p:my-5 prose-a:text-primary prose-img:rounded-2xl prose-blockquote:rounded-r-xl prose-blockquote:border-l-primary/60 prose-blockquote:bg-secondary/60 prose-blockquote:px-5 prose-blockquote:py-2 prose-blockquote:not-italic">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{tBody}</ReactMarkdown>
          </div>

          {a.tags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap gap-2">
              {a.tags.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">#{t}</Badge>)}
            </div>
          )}

          <CommentThread articleId={a.id} />

          {data.more.length > 0 && (
            <div className="mt-14 border-t border-border/60 pt-8">
              <h2 className="mb-5 font-display text-2xl font-semibold">Skaityti toliau</h2>
              <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:px-0">
                {data.more.map((m) => (
                  <Link key={m.id} to="/article/$slug" params={{ slug: m.slug }} className="group w-[76vw] max-w-[280px] shrink-0 md:w-auto md:max-w-none">
                    <Card className="h-full overflow-hidden rounded-2xl border-border/60 transition hover:shadow-elegant">
                      {m.cover_url && <div className="aspect-[4/3] overflow-hidden bg-muted"><img loading="lazy" decoding="async" src={m.cover_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition" /></div>}
                      <div className="p-4">
                        <div className="text-[10px] text-primary uppercase tracking-wider">{m.category}</div>
                        <div className="mt-1 text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary">{m.title}</div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="hidden space-y-5 lg:sticky lg:top-20 lg:block lg:self-start">
          {a.kind === "event" ? (
            <EventRegisterCard article={a} />
          ) : a.kind === "promo" ? (
            <Card className="p-6 border-primary/30 sticky top-20">
              <div className="text-center">
                <Percent className="h-10 w-10 mx-auto text-primary mb-3" />
                <div className="font-display text-4xl font-bold text-primary">−{a.promo_discount_pct}%</div>
                <div className="text-sm text-muted-foreground mt-1">Nuolaida</div>
                {a.promo_ends_at && <div className="text-xs text-muted-foreground mt-3">Galioja iki {new Date(a.promo_ends_at).toLocaleDateString("lt-LT")}</div>}
                {author && (
                  <Button asChild className="mt-5 w-full gradient-gold text-primary-foreground">
                    <Link to="/salon/$id" params={{ id: author.id }}>Rezervuoti su nuolaida</Link>
                  </Button>
                )}
              </div>
            </Card>
          ) : null}

          {/* Recommended salons & specialists */}
          {(meta?.salons?.length ?? 0) > 0 && (
            <Card className="rounded-3xl border-border/60 p-5">
              <h3 className="font-display text-lg font-semibold leading-tight">Rekomenduojami salonai ir meistrai</h3>
              <div className="mt-4 grid gap-3">
                {meta!.salons.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                    <Avatar className="h-11 w-11 shrink-0 ring-1 ring-primary/20">
                      <AvatarImage src={s.avatar_url ?? s.cover_url ?? undefined} alt="" />
                      <AvatarFallback>{(s.business_name ?? "S").slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{s.business_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{[s.city, s.category].filter(Boolean).join(" · ")}</div>
                    </div>
                    <Button asChild size="sm" className="shrink-0 gradient-gold text-primary-foreground btn-press">
                      <Link to="/salon/$id" params={{ id: s.id }}>Rezervuoti</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Featured / most read articles */}
          {(meta?.trending?.length ?? 0) > 0 && <TrendingList items={meta!.trending} />}

          {/* Partner / promo banner */}
          {(sideAds?.items?.length ?? 0) > 0 && <SidebarAdCarousel ads={sideAds!.items} />}
        </aside>
      </div>
    </article>
  );
}
