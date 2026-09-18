import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listForumCategories, listForumThreads } from "@/lib/forum.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessagesSquare, MessageCircle, Pin, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useStoreAccess } from "@/lib/use-store-access";
import { B2BOnlyNotice } from "@/components/b2b-only-notice";
import { useSection } from "@/lib/use-site-content";
import { SiteBlocks } from "@/components/site-blocks";

export const Route = createFileRoute("/forumas")({
  component: Forum,
  head: () => ({
    meta: [
      { title: "Forumas · PaslaugosGrožiui bendruomenė" },
      { name: "description", content: "Grožio meistrų, salonų, mokyklų ir klientų bendruomenės forumas — patarimai, produktai, karjera." },
      { property: "og:title", content: "Forumas · PaslaugosGrožiui bendruomenė" },
      { property: "og:description", content: "Bendruomenės diskusijos ir patarimai." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function Forum() {
  const { user } = useAuth();
  const access = useStoreAccess();
  const catsFn = useServerFn(listForumCategories);
  const threadsFn = useServerFn(listForumThreads);
  const block = useSection("forumas", "intro");
  const cats = useQuery({ queryKey: ["forum-cats"], queryFn: () => catsFn(), enabled: access.canForum, retry: false });
  const recent = useQuery({ queryKey: ["forum-recent"], queryFn: () => threadsFn({ data: {} }), enabled: access.canForum, retry: false });

  if (!access.loading && !access.canForum) {
    return (
      <B2BOnlyNotice
        title="Forumas skirtas grožio profesionalams"
        description="Diskusijos prieinamos patvirtintiems salonams, meistrėms ir tiekėjams. Prisijunk su profesionalo paskyra arba užsiregistruok."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-10">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-12 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="gradient-gold text-primary-foreground border-0"><MessagesSquare className="h-3 w-3 mr-1" /> Forumas</Badge>
        </div>
        <h1 className="font-display text-3xl md:text-5xl">{block?.title || (<>Bendruomenės <span className="text-gradient-gold">diskusijos</span></>)}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{block?.subtitle || "Klausk, dalinkis patirtimi, rask atsakymus iš meistrių, salonų savininkų ir tiekėjų."}</p>
        {user && cats.data?.categories.length ? (
          <Button asChild className="mt-6 gradient-gold text-primary-foreground">
            <Link to="/forumas/$slug" params={{ slug: cats.data.categories[0].slug }}>Rašyti naują temą</Link>
          </Button>
        ) : !user && (
          <Button asChild className="mt-6 gradient-gold text-primary-foreground">
            <Link to="/auth" search={{ mode: "signin" }}>Prisijungti ir dalyvauti</Link>
          </Button>
        )}
      </div>

      <h2 className="font-display text-2xl mb-4">Kategorijos</h2>
      <div className="grid md:grid-cols-2 gap-3 mb-10">
        {(cats.data?.categories ?? []).map((c: any) => (
          <Link key={c.id} to="/forumas/$slug" params={{ slug: c.slug }}>
            <Card className="p-5 hover:border-primary/40 transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg">{c.label}</h3>
                  {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                </div>
                <Badge variant="outline">{c.thread_count} temų</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="font-display text-2xl mb-4">Naujausios temos</h2>
      {(recent.data?.threads.length ?? 0) === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Kol kas nėra temų. Pradėk pirmą diskusiją!</Card>
      ) : (
        <div className="space-y-2">
          {recent.data!.threads.map((t: any) => (
            <Link key={t.id} to="/forumas/tema/$id" params={{ id: t.id }}>
              <Card className="p-4 hover:border-primary/40 transition flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                    {t.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span className="font-medium truncate">{t.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{t.profiles?.business_name ?? t.profiles?.owner_name ?? "Vartotojas"} · {new Date(t.last_reply_at).toLocaleDateString("lt-LT")}</div>
                </div>
                <Badge variant="outline" className="shrink-0"><MessageCircle className="h-3 w-3 mr-1" /> {t.reply_count}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <SiteBlocks page="forumas" />
    </div>
  );
}
