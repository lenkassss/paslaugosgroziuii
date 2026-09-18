import { Link } from "@tanstack/react-router";
import { VerifiedBadge } from "@/components/verified-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Eye, Sparkles, MapPin, TrendingUp, Clock, Megaphone, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { togglePostLike } from "@/lib/feed.functions";
import { bumpAdImpression, bumpAdClick } from "@/lib/ads.functions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { FeedAuthor } from "@/lib/feed.functions";
import { useAutoTranslate } from "@/lib/use-auto-translate";
import { toastError } from "@/lib/error-messages";

/**
 * Strips raw markdown / escaped newlines so cards never leak "##", "**" or "\n".
 */
function clean(text: unknown): string {
  return String(text ?? "")
    .replace(/\\n|\r?\n/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>#]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function readTime(article: any): string {
  const words = String(article?.body ?? article?.excerpt ?? "").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min.`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ką tik";
  if (m < 60) return `prieš ${m} min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `prieš ${h} val.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `prieš ${d} d.`;
  return new Date(iso).toLocaleDateString("lt-LT");
}

function AuthorLine({ author, timestamp, linked = true }: { author: FeedAuthor | undefined; timestamp: string; linked?: boolean }) {
  const name = author?.business_name ?? author?.owner_name ?? "Anonimas";
  const roleLabel = author?.role === "salon" ? "Salonas" : author?.role === "supplier" ? "Tiekėjas" : author?.role === "admin" ? "Redakcija" : "";
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
        <AvatarImage src={author?.avatar_url ?? undefined} />
        <AvatarFallback className="gradient-gold text-primary-foreground text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {author && linked ? (
            <Link to="/salon/$id" params={{ id: author.id }} className="font-semibold text-sm hover:text-primary transition">{name}</Link>
          ) : <span className="font-semibold text-sm">{name}</span>}
          {roleLabel && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{roleLabel}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" /> {timeAgo(timestamp)}
          {author?.city && <><span>·</span><MapPin className="h-3 w-3" />{author.city}</>}
        </div>
      </div>
    </div>
  );
}

export function HeroArticle({ article, author }: { article: any; author: FeedAuthor | undefined }) {
  const [title, sub, cat] = useAutoTranslate([clean(article.title), clean(article.subtitle ?? article.excerpt), article.category ?? ""]);
  return (
    <Link to="/article/$slug" params={{ slug: article.slug }} className="block group">
      <Card className="overflow-hidden border-primary/10 hover:shadow-elegant transition-all duration-500">
        <div className="grid md:grid-cols-[40%_60%] gap-0 md:max-h-[260px]">
          <div className="aspect-[4/3] md:aspect-auto md:h-full relative overflow-hidden bg-muted md:rounded-l-xl">
            {article.cover_url && (
              <img src={article.cover_url} alt={clean(article.title)} className="h-full w-full object-cover md:max-h-[260px] transition-transform duration-700 group-hover:scale-105" loading="eager" />
            )}
            <div className="absolute top-3 left-3">
              <Badge className="gradient-gold text-primary-foreground border-0 shadow-elegant text-[10px]"><Sparkles className="h-3 w-3 mr-1" />Populiariausia</Badge>
            </div>
          </div>
          <div className="p-5 md:p-6 flex flex-col justify-between gap-3">
            <div>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] mb-2">{cat}</Badge>
              <h2 className="font-display text-xl md:text-2xl font-semibold leading-tight tracking-tight line-clamp-3">{title}</h2>
              {sub && <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{sub}</p>}
            </div>
            <div className="flex items-center justify-between gap-3">
              <AuthorLine author={author} timestamp={article.published_at} linked={false} />
              <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0"><Eye className="h-3 w-3" />{article.views.toLocaleString("lt-LT")}</div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ArticleCard({ article, author }: { article: any; author: FeedAuthor | undefined }) {
  const [title, excerpt, cat] = useAutoTranslate([clean(article.title), clean(article.excerpt), article.category ?? ""]);
  return (
    <Link to="/article/$slug" params={{ slug: article.slug }} className="block group">
      <Card className="h-full overflow-hidden rounded-3xl border-border/60 shadow-[0_10px_40px_-28px_oklch(0.35_0.03_60/0.5)] transition-all active:scale-[0.985] hover:border-primary/40 hover:shadow-elegant">
        {article.cover_url && (
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            <img
              src={article.cover_url}
              alt={clean(article.title)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {article.category && (
              <Badge className="absolute left-3 top-3 h-5 border-0 gradient-gold px-2 text-[10px] font-semibold text-primary-foreground shadow-elegant">
                {cat}
              </Badge>
            )}
          </div>
        )}
        <div className="p-4 sm:p-5">
          {!article.cover_url && article.category && (
            <Badge variant="outline" className="mb-2 border-primary/30 text-[10px] text-primary">{cat}</Badge>
          )}
          <h3 className="font-display text-[17px] font-semibold leading-snug line-clamp-2 transition group-hover:text-primary sm:text-lg">{title}</h3>
          {excerpt && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <AuthorLine author={author} timestamp={article.published_at} linked={false} />
            <span className="shrink-0 text-[11px] text-muted-foreground">{readTime(article)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Paid sponsored article — pinned to the top of the feed for the whole
 * purchased period (day / 3 days / week / month). Visually distinct:
 * gold hairline, shimmering "Reklama" label and a warm champagne wash.
 */
export function PromotedArticleCard({ article, author }: { article: any; author: FeedAuthor | undefined }) {
  const [title, excerpt, cat] = useAutoTranslate([clean(article.title), clean(article.excerpt || article.subtitle), article.category ?? ""]);
  return (
    <Link to="/article/$slug" params={{ slug: article.slug }} className="group block">
      <Card className="relative h-full overflow-hidden rounded-3xl border-primary/40 bg-gradient-to-br from-primary/[0.09] via-background to-background shadow-elegant transition-all active:scale-[0.98] hover:border-primary/60">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] gradient-gold" />
        {article.cover_url && (
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            <img
              src={article.cover_url}
              alt={clean(article.title)}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="h-5 border-0 gradient-gold px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              {article.promoted_label || "Reklama"}
            </Badge>
            {article.category && (
              <Badge variant="outline" className="border-primary/30 text-[10px] text-primary">{cat}</Badge>
            )}
          </div>
          <h3 className="font-display text-xl font-semibold leading-snug transition group-hover:text-primary">{title}</h3>
          {excerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
          )}
          <div className="mt-4 border-t border-border/60 pt-4">
            <AuthorLine author={author} timestamp={article.published_at} linked={false} />
          </div>
        </div>
      </Card>
    </Link>
  );
}



export function PostCard({ post, author }: { post: any; author: FeedAuthor | undefined }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count);
  const like = useServerFn(togglePostLike);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => like({ data: { postId: post.id } }),
    onSuccess: (r) => {
      setLiked(r.liked);
      setLikes((n: number) => n + (r.liked ? 1 : -1));
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: Error) => toastError(e),
  });

  return (
    <Card className="p-5 border-border/60 hover:border-primary/30 transition-all">
      <AuthorLine author={author} timestamp={post.created_at} />
      <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap">{post.body}</p>
      {post.image_urls?.length > 0 && (
        <div className={`mt-4 grid gap-2 ${post.image_urls.length === 1 ? "" : "grid-cols-2"}`}>
          {post.image_urls.slice(0, 4).map((url: string, i: number) => (
            <div key={i} className="overflow-hidden rounded-lg bg-muted aspect-[4/3]">
              <img src={url} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
          ))}
        </div>
      )}
      {post.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {post.tags.map((t: string) => <span key={t} className="text-xs text-primary">#{t}</span>)}
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-1">
        <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-primary"
          onClick={() => { if (!user) return toast.error("Prisijunk, kad įvertintum"); m.mutate(); }}
          disabled={m.isPending}>
          <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} /> {likes}
        </Button>
        <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-primary" asChild>
          <Link to="/salon/$id" params={{ id: author?.id ?? "" }}><MessageCircle className="h-4 w-4" /> {post.comments_count}</Link>
        </Button>
        <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-primary ml-auto"
          onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Nuoroda nukopijuota"); }}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

export function AdCard({ ad, author }: { ad: any; author: FeedAuthor | undefined }) {
  const impressionFn = useServerFn(bumpAdImpression);
  const clickFn = useServerFn(bumpAdClick);
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);

  useEffect(() => {
    if (!ref.current || seen.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !seen.current) {
          seen.current = true;
          impressionFn({ data: { id: ad.id } }).catch(() => {});
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ad.id, impressionFn]);

  const onCta = () => { clickFn({ data: { id: ad.id } }).catch(() => {}); };

  return (
    <Card ref={ref} className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/40 relative">
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-background/90 text-foreground border border-primary/30 backdrop-blur text-[10px]"><Megaphone className="h-3 w-3 mr-1" />Rėmėjas</Badge>
      </div>
      <div className="grid sm:grid-cols-[1fr_240px] gap-0">
        <div className="p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-2">{author?.business_name ?? "Rėmėjas"}</div>
            <h3 className="font-display text-xl font-semibold leading-tight">{ad.title}</h3>
            {ad.body && <p className="mt-2 text-sm text-muted-foreground">{ad.body}</p>}
          </div>
          <Button asChild className="gradient-gold text-primary-foreground w-fit btn-press hover:opacity-90">
            <a href={ad.cta_url ?? "#"} onClick={onCta}>{ad.cta_label}</a>
          </Button>
        </div>
        {ad.image_url && (
          <div className="aspect-[4/3] sm:aspect-auto bg-muted overflow-hidden">
            <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function TrendingList({ items }: { items: any[] }) {
  return (
    <Card className="p-5 border-border/60">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-display font-semibold">Populiaru dabar</h3>
      </div>
      <ol className="space-y-3">
        {items.map((a, i) => (
          <li key={a.id}>
            <Link to="/article/$slug" params={{ slug: a.slug }} className="flex items-start gap-3 group">
              <span className="font-display text-2xl font-semibold text-primary/40 leading-none w-6 shrink-0">{i + 1}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-snug group-hover:text-primary transition line-clamp-2">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <span>{a.category}</span>
                  <span>·</span>
                  <Eye className="h-3 w-3" />{a.views.toLocaleString("lt-LT")}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function SalonsList({ salons }: { salons: any[] }) {
  return (
    <Card className="p-5 border-border/60">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-display font-semibold">Rekomenduojami salonai</h3>
      </div>
      <ul className="space-y-3">
        {salons.map((s) => {
          const featured = !!s.is_featured_active;
          return (
            <li key={s.id}>
              <Link
                to="/salon/$id"
                params={{ id: s.id }}
                className={`flex items-center gap-3 group rounded-lg p-1 -m-1 ${featured ? "ring-1 ring-primary/40 bg-gradient-to-r from-primary/10 to-transparent" : ""}`}
              >
                <Avatar className={`h-10 w-10 ${featured ? "ring-2 ring-primary" : ""}`}>
                  <AvatarImage src={s.avatar_url ?? s.cover_url ?? undefined} />
                  <AvatarFallback className="gradient-gold text-primary-foreground text-xs">{(s.business_name ?? "").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium group-hover:text-primary transition truncate flex items-center gap-1">
                    <span className="truncate">{s.business_name}</span>
                    <VerifiedBadge status={s.verification_status} size="xs" />
                    {featured && <Badge className="gradient-gold text-primary-foreground border-0 text-[9px] h-4 px-1 ml-1">VIP</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{s.city}{s.category && ` · ${s.category}`}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <Button variant="outline" size="sm" asChild className="w-full mt-4 border-primary/30">
        <Link to="/search">Visi salonai</Link>
      </Button>
    </Card>
  );
}

export function FeaturedSalonsStrip({ salons }: { salons: any[] }) {
  if (!salons.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-semibold">Atrinkti salonai</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Patvirtinti grožio salonai, kuriuos galima greitai peržiūrėti ir rezervuoti.</p>
        </div>
        <Button variant="outline" size="sm" asChild className="hidden shrink-0 border-primary/30 sm:inline-flex">
          <Link to="/search">Visi salonai <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {salons.slice(0, 4).map((s) => {
          const featured = !!s.is_featured_active;
          return (
            <Link key={s.id} to="/salon/$id" params={{ id: s.id }} className="group block h-full">
              <Card className={`h-full overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-elegant ${featured ? "ring-1 ring-primary/40" : ""}`}>
                <div className="aspect-[16/9] bg-secondary relative overflow-hidden">
                  {s.cover_url || s.avatar_url ? (
                    <img src={s.cover_url ?? s.avatar_url} alt={s.business_name ?? "Salonas"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                      <Sparkles className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                  {featured && <Badge className="absolute left-3 top-3 gradient-gold text-primary-foreground border-0 text-[10px]">VIP</Badge>}
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className={`h-11 w-11 shrink-0 ${featured ? "ring-2 ring-primary" : "ring-1 ring-border"}`}>
                      <AvatarImage src={s.avatar_url ?? s.cover_url ?? undefined} />
                      <AvatarFallback className="gradient-gold text-primary-foreground text-xs">{(s.business_name ?? "SA").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-sm font-semibold group-hover:text-primary transition">{s.business_name}</h3>
                        <VerifiedBadge status={s.verification_status} size="xs" />
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{s.city ?? "Lietuva"}{s.category ? ` · ${s.category}` : ""}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Button variant="outline" size="sm" asChild className="mt-3 w-full border-primary/30 sm:hidden">
        <Link to="/search">Visi salonai <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
      </Button>
    </section>
  );
}

export function SidebarAd({ ad }: { ad: any }) {
  const impressionFn = useServerFn(bumpAdImpression);
  const clickFn = useServerFn(bumpAdClick);
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  useEffect(() => {
    if (!ref.current || seen.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !seen.current) {
          seen.current = true;
          impressionFn({ data: { id: ad.id } }).catch(() => {});
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ad.id, impressionFn]);
  return (
    <Card ref={ref} className="overflow-hidden border-primary/30">
      {ad.image_url && (
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-4">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rėmėjas</div>
        <h4 className="font-display font-semibold text-sm leading-tight">{ad.title}</h4>
        {ad.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ad.body}</p>}
        <Button asChild size="sm" variant="outline" className="w-full mt-3 border-primary/30">
          <a href={ad.cta_url ?? "#"} onClick={() => clickFn({ data: { id: ad.id } }).catch(() => {})}>{ad.cta_label}</a>
        </Button>
      </div>
    </Card>
  );
}
