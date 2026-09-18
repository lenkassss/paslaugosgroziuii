import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listRentalInquiries, markInquiryStatus } from "@/lib/rentals.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Inbox, Mail, Phone, MapPin, Send, CheckCircle2, Loader2, Archive } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { useState } from "react";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/salon/inquiries")({
  component: Page,
});

function Page() {
  const [box, setBox] = useState<"inbox" | "sent">("inbox");
  const listFn = useServerFn(listRentalInquiries);
  const markFn = useServerFn(markInquiryStatus);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["rental-inquiries", box],
    queryFn: () => listFn({ data: { box } }),
    staleTime: 30_000,
  });

  const mark = useMutation({
    mutationFn: (v: { id: string; status: "read" | "handled" | "archived" }) => markFn({ data: v }),
    onSuccess: () => {
      toast.success("Atnaujinta");
      qc.invalidateQueries({ queryKey: ["rental-inquiries"] });
    },
    onError: (e) => toastError(e),
  });

  const items = (q.data?.items ?? []) as any[];

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Inbox className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl">Nuomos užklausos</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gaunamos ir siųstos užklausos dėl tavo patalpų nuomos skelbimų.
        </p>
      </div>

      <Tabs value={box} onValueChange={(v) => setBox(v as any)}>
        <TabsList>
          <TabsTrigger value="inbox">Gautos</TabsTrigger>
          <TabsTrigger value="sent">Išsiųstos</TabsTrigger>
        </TabsList>
        <TabsContent value={box} className="mt-4">
          {q.isLoading ? (
            <div className="py-14 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-display text-lg">
                {box === "inbox" ? "Negauta užklausų" : "Nėra išsiųstų užklausų"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {box === "inbox"
                  ? "Kai kas nors susidomės tavo patalpa, pamatysi žinutę čia."
                  : "Naršyk /feed/patalpos ir siųsk užklausas nuomotojams."}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((it) => {
                const rental = it.rental_listings;
                const sender = it.sender;
                const name = sender?.business_name ?? sender?.owner_name ?? "Naudotojas";
                return (
                  <Card key={it.id} className={`p-5 ${it.status === "new" && box === "inbox" ? "border-primary/40 bg-primary/5" : ""}`}>
                    <div className="flex items-start gap-4 flex-wrap">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarImage src={sender?.avatar_url ?? undefined} />
                        <AvatarFallback className="gradient-gold text-primary-foreground text-xs">
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{name}</span>
                          {sender?.city && (
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />{sender.city}
                            </span>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {it.status === "new" ? "Nauja" : it.status === "read" ? "Peržiūrėta" : it.status === "handled" ? "Sutvarkyta" : "Archyvuota"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {rental?.title ?? "Skelbimas"} · {fmtDate(it.created_at)}
                        </div>
                        <p className="mt-3 text-sm whitespace-pre-wrap">{it.message}</p>
                        {box === "inbox" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {sender?.email && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={`mailto:${sender.email}?subject=Dėl patalpos: ${encodeURIComponent(rental?.title ?? "")}`}>
                                  <Mail className="h-3 w-3 mr-1" />{sender.email}
                                </a>
                              </Button>
                            )}
                            {sender?.phone && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={`tel:${sender.phone}`}><Phone className="h-3 w-3 mr-1" />{sender.phone}</a>
                              </Button>
                            )}
                            {it.status !== "handled" && (
                              <Button size="sm" onClick={() => mark.mutate({ id: it.id, status: "handled" })} className="gradient-gold text-primary-foreground">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Pažymėti kaip sutvarkyta
                              </Button>
                            )}
                            {it.status === "new" && (
                              <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: it.id, status: "read" })}>
                                <Send className="h-3 w-3 mr-1" /> Peržiūrėta
                              </Button>
                            )}
                            {it.status !== "archived" && (
                              <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: it.id, status: "archived" })}>
                                <Archive className="h-3 w-3 mr-1" /> Archyvuoti
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
