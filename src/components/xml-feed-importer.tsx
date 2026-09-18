import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { previewSupplierFeed, importSupplierFeed } from "@/lib/feed-import.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileDown, Loader2, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export function XmlFeedImporter() {
  const qc = useQueryClient();
  const previewFn = useServerFn(previewSupplierFeed);
  const importFn = useServerFn(importSupplierFeed);

  const [feedUrl, setFeedUrl] = useState("");
  const [markup, setMarkup] = useState(30);
  const [limit] = useState(10000);

  const preview = useMutation({
    mutationFn: () => previewFn({ data: { url: feedUrl } }),
    onError: (e) => toastError(e),
  });

  const importMut = useMutation({
    mutationFn: () => importFn({ data: { url: feedUrl, b2cMarkupPct: markup, limit } }),
    onSuccess: (r) => {
      toast.success(`Importuota ${r.imported} prekių${r.skipped ? ` (praleista ${r.skipped})` : ""}`);
      qc.invalidateQueries({ queryKey: ["my-products"] });
      qc.invalidateQueries({ queryKey: ["mp-products"] });
      qc.invalidateQueries({ queryKey: ["mp-facets"] });
    },
    onError: (e) => toastError(e),
  });

  return (
    <Card className="p-5 border-primary/30 bg-gradient-to-br from-primary/5 to-background mb-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg gradient-gold p-2.5 text-primary-foreground shrink-0">
          <FileDown className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg">XML / CSV katalogo importas</h3>
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">iki 10 000 prekių</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Įklijuok tiekėjo XML arba CSV katalogo nuorodą — kainas ir prekes sutvarkysime automatiškai.</p>

          <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground list-decimal pl-4">
            <li>Įklijuok katalogo nuorodą.</li>
            <li>Pasirink kliento kainos antkainį.</li>
            <li>Spausk <span className="text-foreground font-medium">Importuoti</span> — aktyvios prekės iškart atsiras parduotuvėje.</li>
          </ol>


          <div className="mt-4 space-y-3">
            <div>
              <Label className="text-xs">Feed'o URL</Label>
              <Input
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://tavo-tiekejas.lt/feed.xml"
                className="bg-background mt-1"
              />
            </div>
            <div className="max-w-sm">
              <div>
                <Label className="text-xs">B2C antkainis nuo didmeninės kainos (%)</Label>
                <Input type="number" min={0} max={300} value={markup} onChange={(e) => setMarkup(Number(e.target.value) || 0)} className="bg-background mt-1" />
                <p className="text-[10px] text-muted-foreground mt-1">Klientų kaina = didmeninė × (1 + antkainis)</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => preview.mutate()} disabled={!feedUrl || preview.isPending}>
                {preview.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
                Peržiūrėti
              </Button>
              <Button onClick={() => importMut.mutate()} disabled={!feedUrl || importMut.isPending} className="gradient-gold text-primary-foreground">
                {importMut.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importuojama…</> : <><FileDown className="h-4 w-4 mr-1" /> Importuoti</>}
              </Button>
            </div>
          </div>

          {preview.data && (
            <div className="mt-4 rounded-lg border border-border/60 bg-background p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Aptikta <b>{preview.data.count}</b> prekių ({preview.data.format.toUpperCase()} formatu)
              </div>
              {preview.data.sample.length > 0 && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground max-h-40 overflow-auto">
                  {preview.data.sample.map((s: any, i: number) => (
                    <div key={i} className="truncate">
                      • {s.title} {s.brand ? `— ${s.brand}` : ""} {s.price ? `— ${s.price} €` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {importMut.data && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Importuota {importMut.data.imported} prekių</div>
              {importMut.data.cap && (
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" /> Liko {importMut.data.cap.remaining} vietų iki 10 000 limito
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
