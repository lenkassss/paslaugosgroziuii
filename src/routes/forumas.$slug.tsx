import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listForumCategories, listForumThreads, createForumThread } from "@/lib/forum.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MessageCircle, Pin } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/forumas/$slug")({
  component: Category,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} diskusijos · PaslaugosGrožiui forumas` },
      { name: "description", content: "Grožio profesionalų ir klientų diskusijos: patarimai, produktai, karjera ir salonų valdymas." },
      { property: "og:title", content: "PaslaugosGrožiui forumo kategorija" },
      { property: "og:description", content: "Prisijunk prie grožio bendruomenės diskusijų." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Category() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const catsFn = useServerFn(listForumCategories);
  const threadsFn = useServerFn(listForumThreads);
  const newFn = useServerFn(createForumThread);

  const cats = useQuery({ queryKey: ["forum-cats"], queryFn: () => catsFn() });
  const threads = useQuery({ queryKey: ["forum-threads", slug], queryFn: () => threadsFn({ data: { categorySlug: slug } }) });
  const category = cats.data?.categories.find((c: any) => c.slug === slug);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const create = useMutation({
    mutationFn: () => newFn({ data: { categoryId: category!.id, title, body } }),
    onSuccess: () => { toast.success("Tema sukurta"); setOpen(false); setTitle(""); setBody(""); qc.invalidateQueries({ queryKey: ["forum-threads"] }); },
    onError: (e) => toastError(e),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-8">
      <Link to="/forumas" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"><ChevronLeft className="h-4 w-4" /> Visos kategorijos</Link>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl">{category?.label ?? slug}</h1>
          {category?.description && <p className="text-sm text-muted-foreground mt-1">{category.description}</p>}
        </div>
        {user ? (
          <Button onClick={() => setOpen((v) => !v)} className="gradient-gold text-primary-foreground">+ Nauja tema</Button>
        ) : (
          <Button asChild variant="outline"><Link to="/auth" search={{ mode: "signin" }}>Prisijunk, kad rašytum</Link></Button>
        )}
      </div>

      {open && (
        <Card className="p-5 mb-6 border-primary/40">
          <div className="space-y-3">
            <div><Label>Temos pavadinimas</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Turinys</Label><Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button onClick={() => create.mutate()} disabled={title.length < 4 || body.length < 10 || create.isPending} className="gradient-gold text-primary-foreground">Skelbti</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Atšaukti</Button>
            </div>
          </div>
        </Card>
      )}

      {threads.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (threads.data?.threads.length ?? 0) === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Kol kas nėra temų šioje kategorijoje.</Card>
      ) : (
        <div className="space-y-2">
          {threads.data!.threads.map((t: any) => (
            <Link key={t.id} to="/forumas/tema/$id" params={{ id: t.id }}>
              <Card className="p-4 hover:border-primary/40 transition flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {t.is_pinned && <Pin className="h-3 w-3 text-primary" />}
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
    </div>
  );
}
