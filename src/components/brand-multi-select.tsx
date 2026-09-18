import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { listBrands, suggestBrand } from "@/lib/brands.functions";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

/**
 * Multi-select for "Naudojama produkcija / Prekės ženklai".
 * Values are global_brands ids. Unknown brands can be suggested inline.
 * On mobile it opens a browse-first sheet: the list shows immediately and the
 * keyboard only appears after the user explicitly taps "Ieškoti".
 */
export function BrandMultiSelect({
  value,
  onChange,
  placeholder = "Pasirink prekės ženklus…",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [open, setOpenState] = useState(false);
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggest = useServerFn(suggestBrand);

  const { data } = useQuery({ queryKey: ["brands"], queryFn: () => listBrands(), staleTime: 5 * 60_000 });
  const brands = data?.brands ?? [];
  const selected = brands.filter((b) => value.includes(b.id));

  const setOpen = (v: boolean) => {
    setOpenState(v);
    if (!v) {
      setSearching(false);
      setTerm("");
    }
  };

  const addMut = useMutation({
    mutationFn: (name: string) => suggest({ data: { name } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      const id = (res as { brand?: { id?: string } }).brand?.id;
      if (id && !value.includes(id)) onChange([...value, id]);
      setTerm("");
      toast.success("Prekės ženklas pridėtas");
    },
    onError: (e: Error) => toastError(e),
  });

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const exactExists = brands.some((b) => b.name.toLowerCase() === term.trim().toLowerCase());

  const filtered = useMemo(() => {
    const needle = term.trim().toLocaleLowerCase("lt");
    if (!needle) return brands;
    return brands.filter((b) => b.name.toLocaleLowerCase("lt").includes(needle));
  }, [brands, term]);

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      onClick={isMobile ? () => setOpen(true) : undefined}
      className="h-12 w-full justify-between font-normal"
    >
      <span className="truncate">{selected.length ? `${selected.length} pasirinkta` : placeholder}</span>
      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const chips = selected.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {selected.map((b) => (
        <Badge key={b.id} variant="secondary" className="gap-1 pr-1">
          {b.name}
          <button type="button" aria-label="Pašalinti" onClick={() => toggle(b.id)} className="grid h-6 w-6 place-items-center rounded hover:bg-background/60">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );

  const addRow = term.trim().length >= 2 && !exactExists && (
    <Button
      type="button"
      variant="ghost"
      className="h-12 w-full justify-start"
      disabled={addMut.isPending}
      onClick={() => addMut.mutate(term.trim())}
    >
      <Plus className="mr-2 h-4 w-4" /> Pridėti „{term.trim()}"
    </Button>
  );

  if (isMobile) {
    return (
      <div className="space-y-2">
        {trigger}
        <Drawer open={open} onOpenChange={setOpen} repositionInputs={false}>
          <DrawerContent className="max-h-[var(--sheet-max-height)]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="font-display text-xl">Prekės ženklai</DrawerTitle>
              <DrawerDescription>Pasirink iš sąrašo arba įjunk paiešką.</DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {!searching ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mb-3 h-12 w-full shrink-0 justify-start rounded-2xl text-muted-foreground"
                  onClick={() => {
                    setSearching(true);
                    window.setTimeout(() => searchRef.current?.focus(), 80);
                  }}
                >
                  <Search className="mr-2 h-4 w-4" /> Ieškoti prekės ženklo
                </Button>
              ) : (
                <div className="relative mb-3 shrink-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Ieškoti prekės ženklo…"
                    className="h-12 rounded-2xl pl-9 pr-11"
                  />
                  <button
                    type="button"
                    aria-label="Uždaryti paiešką"
                    onClick={() => { setSearching(false); setTerm(""); }}
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nieko nerasta.</p>}
                <ul className="space-y-1">
                  {filtered.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => toggle(b.id)}
                        className="flex min-h-[3rem] w-full items-center gap-3 rounded-2xl px-3 text-left text-sm transition active:scale-[0.99] hover:bg-accent"
                      >
                        <Check className={`h-4 w-4 shrink-0 text-primary ${value.includes(b.id) ? "opacity-100" : "opacity-0"}`} />
                        <span className="min-w-0 flex-1 truncate">{b.name}</span>
                        {!b.is_verified && <span className="shrink-0 text-[10px] text-muted-foreground">(naujas)</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {addRow && <div className="shrink-0 border-t border-border/60 pt-2">{addRow}</div>}
              {selected.length > 0 && <div className="shrink-0 pt-3">{chips}</div>}
            </div>
          </DrawerContent>
        </Drawer>
        {chips}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter>
            <CommandInput placeholder="Ieškoti prekės ženklo…" value={term} onValueChange={setTerm} />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-sm text-muted-foreground">Nieko nerasta.</div>
              </CommandEmpty>
              <CommandGroup>
                {brands.map((b) => (
                  <CommandItem key={b.id} value={b.name} onSelect={() => toggle(b.id)}>
                    <Check className={`mr-2 h-4 w-4 ${value.includes(b.id) ? "opacity-100" : "opacity-0"}`} />
                    {b.name}
                    {!b.is_verified && <span className="ml-2 text-[10px] text-muted-foreground">(naujas)</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {addRow && <div className="border-t border-border p-2">{addRow}</div>}
        </PopoverContent>
      </Popover>
      {chips}
    </div>
  );
}
