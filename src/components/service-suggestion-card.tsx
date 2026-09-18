import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import { listMyServiceSuggestions, submitServiceSuggestion } from "@/lib/service-suggestions.functions";

const STATUS_LABEL: Record<string, string> = {
  new: "Pateikta",
  reviewed: "Peržiūrėta",
  added: "Įtraukta",
  declined: "Neįtraukta",
};

/** Verslo paskyra pasiūlo paslaugą, kurios nėra sąraše, arba pateikia patarimą. */
export function ServiceSuggestionCard() {
  const qc = useQueryClient();
  const [suggestion, setSuggestion] = useState("");
  const [note, setNote] = useState("");

  const submit = useServerFn(submitServiceSuggestion);
  const mineFn = useServerFn(listMyServiceSuggestions);
  const { data } = useQuery({ queryKey: ["my-service-suggestions"], queryFn: () => mineFn() });

  const mut = useMutation({
    mutationFn: () => submit({ data: { suggestion, note: note || undefined } }),
    onSuccess: () => {
      toast.success("Pasiūlymas išsiųstas — peržiūrėsime ir informuosime");
      setSuggestion("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["my-service-suggestions"] });
    },
    onError: (e) => toastError(e),
  });

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg">Nėra tavo paslaugos sąraše?</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Parašyk, kokios paslaugos trūksta arba ką patobulinti — gausime pranešimą ir įtrauksime.
      </p>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (suggestion.trim().length < 3) {
            toast.error("Įrašyk paslaugos pavadinimą");
            return;
          }
          mut.mutate();
        }}
      >
        <div>
          <Label>Paslauga arba patarimas</Label>
          <Input value={suggestion} onChange={(e) => setSuggestion(e.target.value)} placeholder="Pvz. Japoniškas manikiūras" />
        </div>
        <div>
          <Label>Komentaras (nebūtina)</Label>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kaip ši paslauga turėtų vadintis, kuriai sričiai priklauso…" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={mut.isPending} className="btn-press">
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Siųsti pasiūlymą
          </Button>
        </div>
      </form>

      {!!data?.items?.length && (
        <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
          {data.items.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{s.suggestion}</span>
              <Badge variant="secondary" className="shrink-0 text-[10px]">{STATUS_LABEL[s.status] ?? s.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
