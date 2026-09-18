import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  listComments, createComment, voteComment, deleteComment,
  reportComment, moderateComment, getMyVotes, updateComment,
  type CommentRow,
} from "@/lib/comments.functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { ArrowUp, ArrowDown, MessageCircle, Flag, Trash2, Pencil, EyeOff, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const SORT_TABS = [
  { key: "hot", label: "Aktyvūs" },
  { key: "top", label: "Geriausi" },
  { key: "new", label: "Naujausi" },
] as const;

type Sort = typeof SORT_TABS[number]["key"];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "ką tik";
  if (diff < 3600) return `prieš ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `prieš ${Math.floor(diff / 3600)} val`;
  if (diff < 2592000) return `prieš ${Math.floor(diff / 86400)} d.`;
  return new Date(iso).toLocaleDateString("lt-LT");
}

function collectIds(list: CommentRow[]): string[] {
  const out: string[] = [];
  const walk = (nodes: CommentRow[]) => {
    for (const n of nodes) {
      out.push(n.id);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(list);
  return out;
}

export function CommentThread({ articleId }: { articleId: string }) {
  const [sort, setSort] = useState<Sort>("hot");
  const { user } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(listComments);
  const votesFn = useServerFn(getMyVotes);
  const createFn = useServerFn(createComment);

  const { data, isLoading } = useQuery({
    queryKey: ["article-comments", articleId, sort],
    queryFn: () => listFn({ data: { articleId, sort } }),
    staleTime: 30_000,
  });

  const commentIds = data ? collectIds(data.comments) : [];
  const votesQuery = useQuery({
    queryKey: ["comment-votes", articleId, user?.id, commentIds.length],
    queryFn: () => votesFn({ data: { commentIds } }),
    enabled: !!user && commentIds.length > 0,
    staleTime: 30_000,
  });

  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) { toast.error("Prisijunk komentuoti"); return; }
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await createFn({ data: { articleId, body } });
      setBody("");
      toast.success("Komentaras paskelbtas");
      qc.invalidateQueries({ queryKey: ["article-comments", articleId] });
    } catch (e) {
      toastError(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 border-t border-border/60 pt-8" id="komentarai">
      <div className="mb-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <MessageCircle className="h-5 w-5 text-primary" />
          Diskusija {data ? <span className="text-muted-foreground text-lg">({data.total})</span> : null}
        </h2>
        <div className="grid min-w-0 grid-cols-3 rounded-xl bg-secondary p-1">
          {SORT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSort(t.key)}
              className={cn(
                "min-h-9 min-w-0 truncate rounded-lg px-2 py-1 text-xs font-medium transition sm:px-3",
                sort === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {user ? (
        <div className="mb-8 rounded-2xl border border-border/60 bg-card p-3 shadow-elegant">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Pasidalink mintimis..."
            className="min-h-[96px] resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0"
            maxLength={2000}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{body.length}/2000</span>
            <Button size="sm" onClick={submit} disabled={submitting || !body.trim()} className="gradient-gold text-primary-foreground">
              {submitting ? "Skelbiama..." : "Skelbti"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center text-sm">
          <Link to="/auth" search={{ mode: "signin" }} className="text-primary font-semibold hover:underline">Prisijunk</Link>
          {" "}kad galėtum komentuoti ir balsuoti.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-2"><div className="h-3 w-32 bg-muted rounded" /><div className="h-4 w-full bg-muted rounded" /><div className="h-4 w-3/4 bg-muted rounded" /></div>
            </div>
          ))}
        </div>
      ) : data && data.comments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Dar niekas nekomentavo. Būk pirmas!</div>
      ) : (
        <div className="divide-y divide-border/50">
          {data?.comments.map((c) => (
            <CommentItem key={c.id} c={c} articleId={articleId} depth={0} myVotes={votesQuery.data?.votes ?? {}} />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentItem({
  c, articleId, depth, myVotes,
}: { c: CommentRow; articleId: string; depth: number; myVotes: Record<string, number> }) {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const voteFn = useServerFn(voteComment);
  const createFn = useServerFn(createComment);
  const delFn = useServerFn(deleteComment);
  const editFn = useServerFn(updateComment);
  const reportFn = useServerFn(reportComment);
  const modFn = useServerFn(moderateComment);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(c.body);
  const [collapsed, setCollapsed] = useState(c.score <= -5);

  const myVote = myVotes[c.id] ?? 0;
  const isOwner = user?.id === c.user_id;
  const isAdmin = role === "admin";
  const displayName = c.author?.business_name || c.author?.owner_name || "Vartotojas";
  const hidden = c.status === "hidden" || c.status === "deleted";

  const invalidate = () => qc.invalidateQueries({ queryKey: ["article-comments", articleId] });

  const voteMut = useMutation({
    mutationFn: async (value: -1 | 0 | 1) => voteFn({ data: { id: c.id, value } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["article-comments", articleId] });
      qc.invalidateQueries({ queryKey: ["comment-votes", articleId] });
    },
    onError: (e: unknown) => toastError(e),
  });

  const vote = (v: 1 | -1) => {
    if (!user) return toast.error("Prisijunk balsuoti");
    voteMut.mutate((myVote === v ? 0 : v) as -1 | 0 | 1);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      await createFn({ data: { articleId, parentId: c.id, body: replyText } });
      setReplyText(""); setReplyOpen(false);
      toast.success("Atsakymas paskelbtas");
      invalidate();
    } catch (e) { toastError(e); }
  };

  const submitEdit = async () => {
    try {
      await editFn({ data: { id: c.id, body: editText } });
      setEditing(false);
      toast.success("Atnaujinta");
      invalidate();
    } catch (e) { toastError(e); }
  };

  const doDelete = async () => {
    if (!confirm("Ištrinti komentarą?")) return;
    await delFn({ data: { id: c.id } });
    invalidate();
  };

  const doReport = async () => {
    const reason = prompt("Kodėl pranešate apie šį komentarą?");
    if (!reason) return;
    try {
      await reportFn({ data: { id: c.id, reason } });
      toast.success("Skundas išsiųstas");
    } catch (e) { toastError(e); }
  };

  const doMod = async (action: "hide" | "restore" | "delete") => {
    await modFn({ data: { id: c.id, action } });
    toast.success("Atlikta");
    invalidate();
  };

  if (collapsed) {
    return (
      <div className={cn("py-2 text-xs text-muted-foreground italic", depth > 0 && "ml-10 border-l border-border/60 pl-4")}>
        Komentaras paslėptas dėl žemo įvertinimo ({c.score}).{" "}
        <button className="text-primary hover:underline" onClick={() => setCollapsed(false)}>Vis tiek rodyti</button>
      </div>
    );
  }

  return (
     <div className={cn("py-5", depth > 0 && "ml-4 border-l border-border/60 pl-4 md:ml-10")}>
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={c.author?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs bg-primary/15 text-primary">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-foreground">{displayName}</span>
            <span className="text-muted-foreground">· {timeAgo(c.created_at)}</span>
            {c.edited_at && <span className="text-muted-foreground italic">(redaguota)</span>}
            {c.status === "pending" && <Badge variant="outline" className="text-[10px] py-0 border-orange-400 text-orange-500">laukia peržiūros</Badge>}
            {c.status === "hidden" && <Badge variant="outline" className="text-[10px] py-0 border-destructive text-destructive">paslėpta</Badge>}
          </div>

          {editing ? (
            <div className="mt-2">
              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={2000} className="min-h-[80px]" />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={submitEdit}>Išsaugoti</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditText(c.body); }}>Atšaukti</Button>
              </div>
            </div>
          ) : (
            <p className={cn("mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words", hidden && "italic text-muted-foreground")}>{c.body}</p>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs">
            <div className="flex items-center rounded-full bg-secondary">
              <button
                onClick={() => vote(1)}
                className={cn("p-1 rounded-l-full hover:bg-primary/10 transition", myVote === 1 && "text-primary")}
                aria-label="Balsuoti už"
              ><ArrowUp className="h-3.5 w-3.5" /></button>
              <span className={cn("px-1.5 font-semibold text-xs", c.score > 0 && "text-primary", c.score < 0 && "text-destructive")}>{c.score}</span>
              <button
                onClick={() => vote(-1)}
                className={cn("p-1 rounded-r-full hover:bg-destructive/10 transition", myVote === -1 && "text-destructive")}
                aria-label="Balsuoti prieš"
              ><ArrowDown className="h-3.5 w-3.5" /></button>
            </div>

            {user && !hidden && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setReplyOpen((v) => !v)}>
                <MessageCircle className="h-3 w-3" /> Atsakyti
              </Button>
            )}

            {(isOwner || isAdmin || user) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">•••</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {isOwner && !hidden && (
                    <>
                      <DropdownMenuItem onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5 mr-2" />Redaguoti</DropdownMenuItem>
                      <DropdownMenuItem onClick={doDelete} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Ištrinti</DropdownMenuItem>
                    </>
                  )}
                  {!isOwner && user && (
                    <DropdownMenuItem onClick={doReport}><Flag className="h-3.5 w-3.5 mr-2" />Pranešti</DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <>
                      {c.status !== "hidden" && <DropdownMenuItem onClick={() => doMod("hide")}><EyeOff className="h-3.5 w-3.5 mr-2" />Slėpti</DropdownMenuItem>}
                      {c.status !== "visible" && <DropdownMenuItem onClick={() => doMod("restore")}><RotateCcw className="h-3.5 w-3.5 mr-2" />Atstatyti</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => doMod("delete")} className="text-destructive"><ShieldAlert className="h-3.5 w-3.5 mr-2" />Šalinti</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {replyOpen && (
            <div className="mt-3">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Atsakyti..." className="min-h-[70px]" maxLength={2000} />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={submitReply} disabled={!replyText.trim()}>Atsakyti</Button>
                <Button size="sm" variant="ghost" onClick={() => { setReplyOpen(false); setReplyText(""); }}>Atšaukti</Button>
              </div>
            </div>
          )}

          {c.children && c.children.length > 0 && (
            <div className="mt-4 space-y-4">
              {c.children.map((child) => (
                <CommentItem key={child.id} c={child} articleId={articleId} depth={depth + 1} myVotes={myVotes} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
