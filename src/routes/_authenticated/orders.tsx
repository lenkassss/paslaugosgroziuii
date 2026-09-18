import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyOrders } from "@/lib/marketplace.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/orders")({
  component: Orders,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Laukiama",
  paid: "Apmokėta",
  shipped: "Išsiųsta",
  delivered: "Pristatyta",
  cancelled: "Atšaukta",
};

function Orders() {
  const fn = useServerFn(listMyOrders);
  const q = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-8">
      <h1 className="font-display text-3xl mb-6">Mano užsakymai</h1>
      {q.isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      )}
      {q.data && q.data.orders.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Užsakymų dar nėra"
          description="Kai užsakysi prekių iš tiekėjų, jos atsiras čia su pristatymo statusu."
          action={
            <Button asChild className="h-11 rounded-2xl gradient-gold text-primary-foreground">
              <Link to="/shop">Į parduotuvę</Link>
            </Button>
          }
        />
      )}
      <div className="space-y-4">
        {q.data?.orders.map((o: any) => (
          <Card key={o.id} className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                  <Badge variant="outline">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">Tiekėjas: {o.profiles?.business_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-semibold">{Number(o.total).toFixed(2)} €</div>
                <div className="text-[10px] text-muted-foreground">iš to platf. mok. {Number(o.platform_fee).toFixed(2)} €</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              {o.order_items?.map((it: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{it.qty} × {it.snapshot_title}</span>
                  <span className="text-muted-foreground">{(Number(it.unit_price) * it.qty).toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
