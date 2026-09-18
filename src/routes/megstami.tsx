import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MapPin, Trash2, Search } from "lucide-react";
import { useFavorites } from "@/lib/use-favorites";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/megstami")({
  component: FavoritesPage,
  head: () => ({
    meta: [
      { title: "Mėgstami salonai ir meistrai – PaslaugosGrožiui" },
      { name: "description", content: "Tavo išsaugoti grožio salonai ir meistrai. Greitas priėjimas prie mėgstamų vietų ir rezervacijos vienu paspaudimu." },
      { property: "og:title", content: "Mėgstami – PaslaugosGrožiui" },
      { property: "og:description", content: "Išsaugoti salonai ir meistrai vienoje vietoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function FavoritesPage() {
  const { items, remove, clear } = useFavorites();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-gold text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold sm:text-3xl">Mėgstami</h1>
            <p className="text-xs text-muted-foreground">{items.length} išsaugota</p>
          </div>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" className="shrink-0 active:scale-95" onClick={clear}>
            Išvalyti
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <Card className="mt-8 rounded-3xl p-8 text-center glass">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-4 font-display text-xl">Kol kas nieko neišsaugojai</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Paspausk širdelę prie salono ar meistro — jis atsiras čia, kad galėtum greitai rezervuoti.
          </p>
          <Button asChild className="mt-6 h-12 w-full rounded-2xl gradient-gold text-primary-foreground active:scale-95">
            <Link to="/search">
              <Search className="mr-2 h-4 w-4" /> Ieškoti paslaugų
            </Link>
          </Button>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((f) => (
            <li key={f.id}>
              <Card className="overflow-hidden rounded-3xl border-border/60 p-3 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 shrink-0 rounded-2xl">
                    <AvatarImage src={f.image ?? undefined} className="rounded-2xl object-cover" />
                    <AvatarFallback className="rounded-2xl gradient-gold text-primary-foreground">
                      {f.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{f.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {f.city ?? "Lietuva"}
                        {f.category ? ` · ${f.category}` : ""}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Pašalinti"
                    className="shrink-0 active:scale-90"
                    onClick={() => remove(f.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <Button asChild className="mt-3 h-11 w-full rounded-2xl gradient-gold text-primary-foreground active:scale-95">
                  <Link to="/salon/$id" params={{ id: f.id }}>Rezervuoti</Link>
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
