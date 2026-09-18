import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getForumThread, replyToThread } from "@/lib/forum.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Lock } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/forumas/tema/$id")({
  component: Thread,
  head: () => ({
    meta: [
      { title: "Forumo tema · PaslaugosGrožiui bendruomenė" },
      { name: "description", content: "Grožio bendruomenės diskusija: klausimai, atsakymai ir patirtis iš meistrių, salonų bei tiekėjų." },
      { property: "og:title", content: "Forumo tema · PaslaugosGrožiui" },
      { property: "og:description", content: "Skaityk ir dalyvauk grožio profesionalų diskusijoje." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function initials(s?: string) { return (s ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(); }

function Thread() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fn = useServerFn(getForumThread);
  const replyFn = useServerFn(replyToThread);
  const q = useQuery({ queryKey: ["forum-thread", id], queryFn: () => fn({ data: { id } }) });
  const [body, setBody] = useState("");
  const reply = useMutation({
    mutationFn: () => replyFn({ data: { threadId: id, body } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["forum-thread", id] }); },
    onError: (e) => toastError(e),
  });

  if (q.isLoading) return <div className="p-20 text-center text-muted-foreground">Kraunama…</div>;
  if (q.isError || !q.data) return <div className="p-20 text-center">Tema nerasta. <Link to="/forumas" className="text-primary underline">Į forumą</Link></div>;

  const t = q.data.thread;
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
      <Link to="/forumas/$slug" params={{ slug: (t as any).category?.slug ?? "naujienos" }} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="h-4 w-4" /> {(t as any).category?.label ?? "Kategorija"}
      </Link>
      <Card className="p-5 mb-6">
        <div className="flex items-start gap-3">
          <Avatar><AvatarImage src={(t as any).profiles?.avatar_url} /><AvatarFallback>{initials((t as any).profiles?.business_name || (t as any).profiles?.owner_name)}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl">{t.title}</h1>
            <div className="text-xs text-muted-foreground mt-1">{(t as any).profiles?.business_name ?? (t as any).profiles?.owner_name ?? "Vartotojas"} · {new Date(t.created_at).toLocaleString("lt-LT")}</div>
            <div className="mt-4 text-sm whitespace-pre-wrap">{t.body}</div>
          </div>
        </div>
      </Card>

      <h2 className="font-display text-xl mb-3">Atsakymai ({q.data.replies.length})</h2>
      <div className="space-y-3 mb-6">
        {q.data.replies.map((r: any) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8"><AvatarImage src={r.profiles?.avatar_url} /><AvatarFallback>{initials(r.profiles?.business_name || r.profiles?.owner_name)}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{r.profiles?.business_name ?? r.profiles?.owner_name ?? "Vartotojas"} · {new Date(r.created_at).toLocaleString("lt-LT")}</div>
                <div className="mt-1 text-sm whitespace-pre-wrap">{r.body}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {t.is_locked ? (
        <Card className="p-4 text-center text-muted-foreground"><Lock className="h-4 w-4 inline mr-1" /> Tema užrakinta.</Card>
      ) : user ? (
        <Card className="p-4">
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Parašyk atsakymą…" />
          <div className="mt-2 flex justify-end">
            <Button onClick={() => reply.mutate()} disabled={body.length < 2 || reply.isPending} className="gradient-gold text-primary-foreground">Atsakyti</Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 text-center"><Link to="/auth" search={{ mode: "signin" }} className="text-primary underline">Prisijunk</Link>, kad galėtum atsakyti.</Card>
      )}
    </div>
  );
}
