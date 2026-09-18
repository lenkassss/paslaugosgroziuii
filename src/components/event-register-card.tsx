import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Euro, CheckCircle2, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { registerForEvent, getEventStats } from "@/lib/events.functions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export function EventRegisterCard({ article }: { article: any }) {
  const { user } = useAuth();
  const register = useServerFn(registerForEvent);
  const stats = useServerFn(getEventStats);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const statsQ = useQuery({
    queryKey: ["event-stats", article.id],
    queryFn: () => stats({ data: { article_id: article.id } }),
    staleTime: 30_000,
  });

  const m = useMutation({
    mutationFn: () => register({ data: {
      article_id: article.id, name, email, phone: phone || undefined, seats, note: note || undefined,
      user_id: user?.id ?? null,
    } }),
    onSuccess: () => { setDone(true); toast.success("Registracija priimta!"); statsQ.refetch(); },
    onError: (e: Error) => toastError(e),
  });

  const used = statsQ.data?.used ?? 0;
  const total = article.event_seats ?? null;
  const remaining = total ? Math.max(total - used, 0) : null;
  const soldOut = total !== null && remaining === 0;
  const starts = article.event_starts_at ? new Date(article.event_starts_at) : null;

  return (
    <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/30 shadow-elegant sticky top-20">
      <div className="flex items-center gap-2 mb-4">
        <Badge className="gradient-gold text-primary-foreground border-0"><Sparkles className="h-3 w-3 mr-1" />Registracija</Badge>
      </div>
      <div className="space-y-2 text-sm mb-5">
        {starts && (
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />
            <span>{starts.toLocaleDateString("lt-LT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
        {article.event_location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span>{article.event_location}</span></div>}
        {article.event_price_eur !== null && article.event_price_eur !== undefined && (
          <div className="flex items-center gap-2"><Euro className="h-4 w-4 text-primary" />
            <span className="font-semibold">{Number(article.event_price_eur) === 0 ? "Nemokamas" : `${Number(article.event_price_eur).toFixed(2)} €`}</span>
          </div>
        )}
        {total !== null && (
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />
            <span>{remaining} laisvos / {total} vietų</span>
          </div>
        )}
      </div>

      {!done && !soldOut && article.event_price_eur !== null && article.event_price_eur !== undefined && Number(article.event_price_eur) > 0 && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Vieta × {seats}</span><span>{(Number(article.event_price_eur) * seats).toFixed(2)} €</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tarpininkavimo mokestis</span><span>0,49 €</span></div>
          <div className="flex justify-between font-semibold text-sm pt-1 border-t border-primary/20"><span>Iš viso</span><span>{(Number(article.event_price_eur) * seats + 0.49).toFixed(2)} €</span></div>
        </div>
      )}

      {done ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-2" />
          <div className="font-semibold">Ačiū! Susisieksime</div>
          <div className="text-xs text-muted-foreground mt-1">Patvirtinimą siųsime į {email}</div>
        </div>
      ) : soldOut ? (
        <div className="text-center py-6 text-muted-foreground">Visos vietos užimtos.</div>
      ) : (
        <div className="space-y-3">
          <div><Label className="text-xs">Vardas *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label className="text-xs">El. paštas *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label className="text-xs">Telefonas</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Label className="text-xs">Dalyvių</Label><Input type="number" min={1} max={remaining ?? 20} value={seats} onChange={(e) => setSeats(Number(e.target.value) || 1)} /></div>
          <div><Label className="text-xs">Pastaba</Label><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Klausimai, dietos ir kt." /></div>
          <Button
            className="w-full gradient-gold text-primary-foreground btn-press"
            disabled={m.isPending || !name.trim() || !email.trim()}
            onClick={() => m.mutate()}
          >
            {m.isPending ? "Siunčiama..." : "Registruotis"}
          </Button>
        </div>
      )}
    </Card>
  );
}
