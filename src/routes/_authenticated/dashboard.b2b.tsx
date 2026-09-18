import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getB2BFeed, createB2BPost, replyB2B } from "@/lib/platform.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MessageCircle, Send, Phone, Mail, Lock } from "lucide-react";
import { initials } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/b2b")({
  component: B2BFeed,
  head: () => ({
    meta: [
      { title: "Profesionalų bendruomenė – PaslaugosGrožiui" },
      { name: "description", content: "Grožio salonų, meistrų ir tiekėjų profesionalų bendruomenė." },
      { property: "og:title", content: "Profesionalų bendruomenė" },
      { property: "og:description", content: "Grožio industrijos profesionalų bendruomenė." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function B2BFeed() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["b2b-feed"],
    queryFn: () => getB2BFeed({ data: undefined }),
    retry: false,
  });

  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [contactInfo, setContactInfo] = useState<{ business_name: string; phone: string | null; email: string | null } | null>(null);

  const postFn = useServerFn(createB2BPost);
  const replyFn = useServerFn(replyB2B);
  const postMut = useMutation({
    mutationFn: () => postFn({ data: { content: text, imageUrl: "" } }),
    onSuccess: () => { setText(""); toast.success("Įrašas paskelbtas"); qc.invalidateQueries({ queryKey: ["b2b-feed"] }); },
    onError: (e) => toastError(e),
  });
  const replyMut = useMutation({
    mutationFn: (postId: string) => replyFn({ data: { postId, message: replyText } }),
    onSuccess: () => { setReplyText(""); setReplyingTo(null); qc.invalidateQueries({ queryKey: ["b2b-feed"] }); },
    onError: (e) => toastError(e),
  });

  useEffect(() => {
    const ch = supabase.channel("b2b").on("postgres_changes", { event: "*", schema: "public", table: "b2b_feed" }, () => qc.invalidateQueries({ queryKey: ["b2b-feed"] })).subscribe();
    const ch2 = supabase.channel("b2b-replies").on("postgres_changes", { event: "*", schema: "public", table: "b2b_replies" }, () => qc.invalidateQueries({ queryKey: ["b2b-feed"] })).subscribe();
    return () => { supabase.removeChannel(ch); supabase.removeChannel(ch2); };
  }, [qc]);

  if (error) {
    return (
      <DashboardShell>
        <Card className="p-10 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary mb-3" />
          <h2 className="font-display text-xl">Profesionalų bendruomenė užrakinta</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Šis tinklas prieinamas tik salonams, meistrėms ir tiekėjams su aktyvia Pro naryste.</p>
          <Button asChild className="mt-4 gradient-gold text-primary-foreground">
            <Link to="/dashboard/salon/membership">Aktyvuoti narystę</Link>
          </Button>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Profesionalų bendruomenė</h1>
        <p className="text-sm text-muted-foreground">Salonai, meistrės ir tiekėjai vienoje vietoje</p>
      </div>

      <Card className="p-4 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); postMut.mutate(); }}>
          <Textarea placeholder="Kuo pasidalinsi? Ieškai medžiagų, rangovų, patarimų?" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex justify-end mt-2">
            <Button type="submit" disabled={!text.trim() || postMut.isPending} className="gradient-gold text-primary-foreground btn-press">
              <Send className="mr-2 h-4 w-4" /> Skelbti
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6"><div className="h-24 skeleton rounded" /></Card>)}
        {data?.posts.map((p) => {
          const author = data.authors[p.author_id];
          const replies = data.replies[p.id] ?? [];
          return (
            <Card key={p.id} className="p-6 hover-lift">
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-primary/20 text-primary">{initials(author?.business_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium">{author?.business_name ?? "—"}</div>
                    {author?.role === "supplier"
                      ? <Badge className="bg-chart-3/20 text-chart-3 border-0">Tiekėjas</Badge>
                      : author?.role === "staff"
                        ? <Badge className="bg-pink-500/10 text-pink-600 border-0">Meistrė</Badge>
                        : <Badge className="bg-primary/20 text-primary border-0">Salonas</Badge>}
                    <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("lt-LT")}</div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{p.content_text}</p>
                  {p.image_url && <img src={p.image_url} alt="" className="mt-3 rounded-lg max-h-80 object-cover" />}
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(replyingTo === p.id ? null : p.id)}>
                      <MessageCircle className="h-4 w-4 mr-1" /> {replies.length} atsakymai
                    </Button>
                    {author && (author.phone || author.email) && (
                      <Button variant="outline" size="sm" onClick={() => setContactInfo({ business_name: author.business_name, phone: author.phone, email: author.email })}>
                        Susisiekti privačiai
                      </Button>
                    )}
                  </div>

                  {replies.length > 0 && (
                    <div className="mt-4 space-y-2 pl-4 border-l-2 border-primary/20">
                      {replies.map((r) => {
                        const a = data.authors[r.replier_id];
                        return (
                          <div key={r.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{a?.business_name ?? "—"}</span>
                              {a?.role === "supplier" && <Badge variant="outline" className="text-[10px]">Tiekėjas</Badge>}
                            </div>
                            <div className="text-muted-foreground">{r.message}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {replyingTo === p.id && (
                    <form onSubmit={(e) => { e.preventDefault(); replyMut.mutate(p.id); }} className="mt-3 flex gap-2">
                      <Textarea placeholder="Parašyk savo pasiūlymą..." rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                      <Button type="submit" disabled={!replyText.trim()} className="gradient-gold text-primary-foreground self-end btn-press">Atsakyti</Button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {data && data.posts.length === 0 && <Card className="p-10 text-center text-muted-foreground">Kol kas nėra įrašų. Būk pirmas!</Card>}
      </div>

      <Dialog open={!!contactInfo} onOpenChange={(o) => !o && setContactInfo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{contactInfo?.business_name}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            {contactInfo?.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {contactInfo.phone}</div>}
            {contactInfo?.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {contactInfo.email}</div>}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
