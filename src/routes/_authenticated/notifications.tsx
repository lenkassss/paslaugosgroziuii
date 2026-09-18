import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, ShieldAlert, CalendarCheck, CalendarX, Bell, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

type Payload = {
  article_slug?: string; article_title?: string; excerpt?: string;
  rental_id?: string; rental_title?: string;
  salon_name?: string; service_name?: string; appointment_date?: string; time_slot?: string;
  reason?: string; ends_at?: string;
};

const TITLES: Record<string, string> = {
  comment_reply: "Naujas atsakymas",
  comment_on_article: "Naujas komentaras tavo straipsniui",
  comment_removed: "Tavo komentaras pašalintas",
  comment_vote: "Kažkas įvertino tavo komentarą",
  rental_inquiry: "Nauja nuomos užklausa",
  system: "Sistemos pranešimas",
  b2b_order_new: "Naujas B2B užsakymas",
  b2b_order_shipped: "B2B užsakymas išsiųstas",
  booking_confirmed: "Rezervacija patvirtinta",
  booking_cancelled: "Rezervacija atšaukta",
  booking_reminder: "Priminimas apie vizitą",
  promotion_active: "Reklama aktyvi",
  promotion_expiring: "Reklama baigiasi",
  admin_classified_pending: "Naujas skelbimas tvirtinimui",
  admin_supplier_pending: "Nauja tiekėjo paraiška",
  admin_course_pending: "Naujas mokymų kursas tvirtinimui",
  listing_approved: "Paraiška patvirtinta",
  listing_rejected: "Paraiška atmesta",
};

const ICONS: Record<string, typeof MessageCircle> = {
  comment_removed: ShieldAlert,
  booking_confirmed: CalendarCheck,
  booking_cancelled: CalendarX,
  booking_reminder: Bell,
  promotion_active: Pin,
  promotion_expiring: Pin,
};

function NotificationsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listNotifications);
  const readFn = useServerFn(markNotificationRead);
  const readAllFn = useServerFn(markAllNotificationsRead);

  const { data, isLoading } = useQuery({ queryKey: ["notif-page"], queryFn: () => listFn({ data: { limit: 50 } }) });

  const markAll = async () => {
    await readAllFn();
    qc.invalidateQueries({ queryKey: ["notif-page"] });
    qc.invalidateQueries({ queryKey: ["notif-count"] });
    qc.invalidateQueries({ queryKey: ["notif-list"] });
  };
  const markOne = async (id: string) => {
    await readFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["notif-page"] });
    qc.invalidateQueries({ queryKey: ["notif-count"] });
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Pranešimai</h1>
        <Button variant="outline" size="sm" onClick={markAll}><Check className="h-4 w-4 mr-2" />Pažymėti visus</Button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : (data?.notifications ?? []).length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Kol kas pranešimų nėra"
          description="Čia atsiras rezervacijų patvirtinimai, priminimai ir atsakymai į tavo komentarus."
          action={
            <Button asChild className="h-11 rounded-2xl gradient-gold text-primary-foreground">
              <Link to="/search">Ieškoti paslaugų</Link>
            </Button>
          }
        />
      ) : (
      <Card className="divide-y">
        {data!.notifications.map((n) => {
            const p = (n.payload ?? {}) as Payload;
            const unread = !n.read_at;
            const Icon = ICONS[n.type] ?? MessageCircle;
            const booking = n.type.startsWith("booking_");
            const inner = (
              <div className={cn("flex gap-3 p-4 hover:bg-secondary/50 transition", unread && "bg-primary/5")}>
                <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", unread ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{TITLES[n.type] ?? "Pranešimas"}</div>
                  {p.article_title && <div className="text-xs text-muted-foreground">„{p.article_title}"</div>}
                  {booking && (
                    <div className="text-xs text-muted-foreground">
                      {[p.salon_name, p.service_name].filter(Boolean).join(" · ")}
                      {p.appointment_date ? ` · ${p.appointment_date}${p.time_slot ? ` ${p.time_slot.slice(0, 5)}` : ""}` : ""}
                    </div>
                  )}
                  {p.reason && <div className="text-xs italic text-destructive">{p.reason}</div>}
                  {p.ends_at && <div className="text-xs text-muted-foreground">Galioja iki {new Date(p.ends_at).toLocaleDateString("lt-LT")}</div>}
                  {p.excerpt && <div className="text-xs italic text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("lt-LT")}</div>
                </div>
                {unread && <button onClick={(e) => { e.preventDefault(); markOne(n.id); }} className="text-xs text-primary self-start">pažymėti</button>}
              </div>
            );
            return booking ? (
              <Link key={n.id} to="/dashboard/customer" onClick={() => unread && markOne(n.id)}>
                {inner}
              </Link>
            ) : n.type.startsWith("promotion_") ? (
              <Link key={n.id} to="/dashboard/salon/promote" onClick={() => unread && markOne(n.id)}>
                {inner}
              </Link>
            ) : n.type === "rental_inquiry" ? (
              <Link key={n.id} to="/dashboard/salon/inquiries" onClick={() => unread && markOne(n.id)}>
                {inner}
              </Link>
            ) : p.article_slug ? (
              <Link key={n.id} to="/article/$slug" params={{ slug: p.article_slug }} hash="komentarai" onClick={() => unread && markOne(n.id)}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
        })}
      </Card>
      )}
    </DashboardShell>
  );
}
