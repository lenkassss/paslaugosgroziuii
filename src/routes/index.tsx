import { createFileRoute } from "@tanstack/react-router";
import { infiniteQueryOptions, queryOptions, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getFeed, getHome } from "@/lib/feed.functions";
import { HeroArticle, ArticleCard, PostCard, AdCard, PromotedArticleCard } from "@/components/feed/feed-cards";
import { HomeBubbles } from "@/components/home-bubbles";
import { BusinessHomeBubbles } from "@/components/business-home-bubbles";
import { useAuth } from "@/lib/auth-context";
import { worldFor } from "@/lib/access";



import { HeroSearchBar } from "@/components/hero-search-bar";
import { InfiniteSentinel } from "@/components/feed/infinite-sentinel";
import { FeedPageSkeleton } from "@/components/feed/feed-skeletons";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { FeedCategoryFilter, matchesFeedCategory } from "@/components/feed/feed-category-filter";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, sectionVisible } from "@/lib/settings.functions";
import { useSection } from "@/lib/use-site-content";
import { SiteBlocks } from "@/components/site-blocks";
import { EditableText } from "@/components/inline-cms";



const FEED_LIMIT = 12;

const feedOptions = (audience: "b2c" | "b2b" = "b2c") => infiniteQueryOptions({
  queryKey: ["feed", "home", audience],
  queryFn: ({ pageParam }) => getFeed({ data: { page: pageParam as number, limit: FEED_LIMIT, audience } }),
  initialPageParam: 0,
  getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  staleTime: 60_000,
  gcTime: 30 * 60_000,
});
const homeOptions = () => queryOptions({
  queryKey: ["home", "meta"],
  queryFn: () => getHome(),
  staleTime: 60_000,
});
export const Route = createFileRoute("/")({

  loader: ({ context }) => {
    context.queryClient.ensureInfiniteQueryData(feedOptions());
    context.queryClient.ensureQueryData(homeOptions());
  },


  component: Home,

  errorComponent: ({ error }) => <div className="p-8 text-center text-muted-foreground">{error.message}</div>,
  head: () => ({
    meta: [
      { title: "PaslaugosGrožiui – grožio industrijos naujienos ir rezervacijos" },
      { name: "description", content: "Grožio salonų ir tiekėjų naujienos, tendencijos, patarimai, akcijos, seminarai. Rezervuok paslaugas ir sek profesionalus vienoje vietoje." },
      { property: "og:title", content: "PaslaugosGrožiui – grožio industrijos pulsas" },
      { property: "og:description", content: "Straipsniai, tendencijos, meistrų darbai, akcijos ir mokymai vienoje platformoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type FeedItem = { kind: "article" | "post" | "ad"; data: any; authorId: string };

function buildStream(pages: Awaited<ReturnType<typeof getFeed>>[], skipHeroId?: string): { items: FeedItem[]; authors: Record<string, any> } {
  const items: FeedItem[] = [];
  const authors: Record<string, any> = {};
  let adCounter = 0;
  for (const page of pages) {
    Object.assign(authors, page.authors);
    const arts = page.articles.filter((a) => a.id !== skipHeroId);
    const posts = page.posts.slice();
    const ads = page.ads.slice();
    const maxLen = Math.max(arts.length, posts.length);
    for (let i = 0; i < maxLen; i++) {
      if (arts[i]) items.push({ kind: "article", data: arts[i], authorId: arts[i].author_id });
      if (posts[i]) items.push({ kind: "post", data: posts[i], authorId: posts[i].author_id });
      if (ads.length && (items.length + 1) % 6 === 0) {
        const ad = ads[adCounter % ads.length];
        items.push({ kind: "ad", data: ad, authorId: ad.advertiser_id });
        adCounter++;
      }
    }
  }
  return { items, authors };
}


function Home() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const isB2B = worldFor(role) === "b2b";
  const feedQ = useSuspenseInfiniteQuery(feedOptions(isB2B ? "b2b" : "b2c"));
  const { data: meta } = useSuspenseQuery(homeOptions());
  const { data: settings } = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings(), staleTime: 60_000 });
  const heroBlock = useSection("home", "hero");
  const show = (id: string) => sectionVisible(settings, id);


  const [category, setCategory] = useState<string>("all");
  const { items: allItems, authors } = buildStream(feedQ.data.pages, meta.hero?.id);
  const items =
    category === "all"
      ? allItems
      : allItems.filter((i) => i.kind !== "article" || matchesFeedCategory(category, i.data.category));
  const promoted: any[] = (feedQ.data.pages[0] as any)?.promoted ?? [];

  const firstFourArticles = items.filter((i) => i.kind === "article").slice(0, 4);
  const firstFourIds = new Set(firstFourArticles.map((i) => i.data.id));
  const rest = items.filter((i) => !(i.kind === "article" && firstFourIds.has(i.data.id)));

  return (
    <div className="min-h-dvh">
      {/* Naršymo burbulai – iškart po fiksuota antgalvio zona */}
      <section
        className="sticky z-30 border-b border-border bg-background/95 backdrop-blur-xl"
        style={{ top: "var(--app-chrome-top, 0px)" }}
      >
        <div className="mx-auto max-w-7xl px-4 pb-2 pt-3 md:px-6 md:pb-3 md:pt-4">
          {show("bubbles") && (isB2B ? <BusinessHomeBubbles /> : <HomeBubbles />)}
        </div>
      </section>

      {isB2B ? (
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-7 md:px-6 md:py-12">
            <EditableText
              page="home"
              section="hero_b2b_eyebrow"
              fallback="Grožio industrija"
              as="p"
              className="mb-2 block text-xs font-semibold uppercase text-cyclamen"
            />
            <EditableText
              page="home"
              section="hero_b2b"
              field="title"
              fallback="Tavo verslo erdvė grožio industrijoje."
              as="h1"
              className="block max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl"
            />
            <EditableText
              page="home"
              section="hero_b2b"
              field="subtitle"
              fallback="Tiekėjų pasiūlymai, mokymai, skelbimai ir papildomos paslaugos vienoje vietoje."
              as="p"
              className="mt-3 block max-w-2xl text-sm text-muted-foreground"
            />
          </div>
        </section>
      ) : (
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-7 md:px-6 md:py-12">
            <EditableText
              page="home"
              section="hero_eyebrow"
              fallback="Grožio paslaugos vienoje vietoje"
              as="p"
              className="mb-2 block text-xs font-semibold uppercase text-cyclamen"
            />
            <EditableText
              page="home"
              section="hero"
              field="title"
              fallback="Rezervuok paslaugą — greitai ir patogiai."
              as="h1"
              className="block max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl"
            />
            {heroBlock?.subtitle && (
              <EditableText
                page="home"
                section="hero"
                field="subtitle"
                fallback={heroBlock.subtitle}
                as="p"
                className="mt-3 block max-w-2xl text-sm text-muted-foreground"
              />
            )}
            {show("hero_search") && <div className="mt-5 max-w-4xl"><HeroSearchBar /></div>}
          </div>
        </section>
      )}

      <div id="aktualijos" className="mx-auto max-w-7xl px-4 pb-4 pt-4 md:px-6 md:py-8">




        {show("hero_article") && meta.hero && (
          <div className="mb-8 hidden md:block">
            <HeroArticle article={meta.hero} author={meta.authors[meta.hero.author_id]} />
          </div>
        )}

        <div>
          <div className="space-y-6 min-w-0">
            {show("promoted") && promoted.length > 0 && (
              <div className="space-y-4">
                {promoted.map((p) => (
                  <PromotedArticleCard key={`pr-${p.id}`} article={p} author={authors[p.author_id]} />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <h2 className="truncate font-display text-xl font-semibold sm:text-2xl">{t("home.latest")}</h2>
            </div>

            <FeedCategoryFilter active={category} onChange={setCategory} />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {firstFourArticles.map((i, idx) => (
                <ArticleCard key={`ac-${i.data.id}-${idx}`} article={i.data} author={authors[i.authorId]} />
              ))}
            </div>


            <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
              {rest.map((i, idx) => {
                if (i.kind === "article") return <ArticleCard key={`a-${i.data.id}-${idx}`} article={i.data} author={authors[i.authorId]} />;
                if (i.kind === "post") return <PostCard key={`p-${i.data.id}-${idx}`} post={i.data} author={authors[i.authorId]} />;
                return <AdCard key={`ad-${i.data.id}-${idx}`} ad={i.data} author={authors[i.authorId]} />;
              })}
              {feedQ.isFetchingNextPage && <FeedPageSkeleton count={4} />}
            </div>

            <InfiniteSentinel
              hasNextPage={!!feedQ.hasNextPage}
              isFetchingNextPage={feedQ.isFetchingNextPage}
              fetchNextPage={() => feedQ.fetchNextPage()}
            />
          </div>
        </div>
      </div>
      <SiteBlocks page="home" />
    </div>
  );
}
