import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Bell, Check, MessageCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
} from "@/lib/notifications.functions";
import { cn } from "@/lib/utils";

type Payload = {
  comment_id?: string;
  article_id?: string;
  article_slug?: string;
  article_title?: string;
  excerpt?: string;
  action?: string;
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "ką tik";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} val`;
  return `${Math.floor(diff / 86400)} d.`;
}

const TITLES: Record<string, string> = {
  comment_reply: "atsakė į tavo komentarą",
  comment_on_article: "pakomentavo tavo straipsnį",
  comment_removed: "tavo komentaras pašalintas",
  comment_vote: "įvertino tavo komentarą",
  rental_inquiry: "nauja nuomos užklausa",
  system: "sistemos pranešimas",
  admin_classified_pending: "naujas skelbimas tvirtinimui",
  admin_supplier_pending: "nauja tiekėjo paraiška",
  admin_course_pending: "naujas mokymų kursas tvirtinimui",
  listing_approved: "tavo paraiška patvirtinta",
  listing_rejected: "tavo paraiška atmesta",
};

export function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(listNotifications);
  const countFn = useServerFn(getUnreadCount);
  const readFn = useServerFn(markNotificationRead);
  const readAllFn = useServerFn(markAllNotificationsRead);

  const count = useQuery({
    queryKey: ["notif-count", user?.id],
    queryFn: () => countFn(),
    enabled: !!user,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ["notif-list", user?.id],
    queryFn: () => listFn({ data: { limit: 20 } }),
    enabled: !!user && open,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["notif-count"] });
        qc.invalidateQueries({ queryKey: ["notif-list"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  if (!user) return null;
  const unread = count.data?.count ?? 0;

  const markRead = async (id: string) => {
    await readFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["notif-count"] });
    qc.invalidateQueries({ queryKey: ["notif-list"] });
  };

  const markAll = async () => {
    await readAllFn();
    qc.invalidateQueries({ queryKey: ["notif-count"] });
    qc.invalidateQueries({ queryKey: ["notif-list"] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-1.5">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold text-sm">Pranešimai</div>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="h-3 w-3" /> Pažymėti visus
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {list.isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Kraunama...</div>
          ) : (list.data?.notifications ?? []).length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Kol kas nėra pranešimų</div>
          ) : (
            list.data!.notifications.map((n) => {
              const p = (n.payload ?? {}) as Payload;
              const Icon = n.type === "comment_removed" ? ShieldAlert : MessageCircle;
              const isUnread = !n.read_at;
              return (
                <Link
                  key={n.id}
                  to={n.type === "rental_inquiry" ? "/dashboard/salon/inquiries" : p.article_slug ? "/article/$slug" : "/"}
                  params={n.type !== "rental_inquiry" && p.article_slug ? { slug: p.article_slug } : undefined}
                  hash={n.type === "rental_inquiry" ? undefined : "komentarai"}
                  onClick={() => { if (isUnread) markRead(n.id); setOpen(false); }}
                  className={cn(
                    "flex gap-3 px-4 py-3 hover:bg-secondary transition border-b last:border-0",
                    isUnread && "bg-primary/5",
                  )}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", isUnread ? "text-primary" : "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs">
                      <span className="font-semibold">Kažkas </span>
                      {TITLES[n.type] ?? "atnaujinimas"}
                    </div>
                    {p.article_title && <div className="text-xs text-muted-foreground truncate">„{p.article_title}"</div>}
                    {p.excerpt && <div className="text-xs mt-0.5 line-clamp-2 text-muted-foreground italic">{p.excerpt}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
