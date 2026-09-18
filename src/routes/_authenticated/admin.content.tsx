import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetContent, adminDeletePost, adminDeleteReview } from "@/lib/platform.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: AdminContent,
});

function AdminContent() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-content"], queryFn: () => adminGetContent({ data: undefined }) });
  const delPost = useServerFn(adminDeletePost);
  const delReview = useServerFn(adminDeleteReview);
  const delPostMut = useMutation({ mutationFn: (id: string) => delPost({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-content"] }); toast.success("Ištrinta"); } });
  const delReviewMut = useMutation({ mutationFn: (id: string) => delReview({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-content"] }); toast.success("Ištrinta"); } });

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-6">Turinio moderavimas</h1>
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">B2B įrašai ({data?.posts.length ?? 0})</TabsTrigger>
          <TabsTrigger value="reviews">Atsiliepimai ({data?.reviews.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-3 mt-4">
          {data?.posts.map((p) => (
            <Card key={p.id} className="p-4 flex justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{p.author_name} · {fmtDate(p.created_at)}</div>
                <p className="mt-1 text-sm">{p.content_text}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => delPostMut.mutate(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="reviews" className="space-y-3 mt-4">
          {data?.reviews.map((r) => (
            <Card key={r.id} className="p-4 flex justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {r.reviewer_name} · {r.salon_name} ·
                  <span className="flex">{Array.from({length: r.rating_stars}).map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}</span>
                </div>
                <p className="mt-1 text-sm">{r.text_comment}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => delReviewMut.mutate(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
