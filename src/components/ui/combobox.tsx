import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

export type ComboboxOption = { value: string; label: string; /** Papildomi paieškos žodžiai (nerodomi trigeryje). */ keywords?: string };

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Pasirinkti...",
  emptyText = "Nieko nerasta.",
  searchPlaceholder = "Ieškoti...",
  allowClear = true,
  className,
  open: openProp,
  onOpenChange,
  disabled = false,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}) {
  const [openState, setOpenState] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const open = openProp ?? openState;
  const setOpen = (v: boolean) => {
    setOpenState(v);
    if (!v) { setSearching(false); setQuery(""); }
    onOpenChange?.(v);
  };
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("lt");
    return needle ? options.filter((option) => `${option.label} ${option.keywords ?? ""}`.toLocaleLowerCase("lt").includes(needle)) : options;
  }, [options, query]);

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      onClick={() => isMobile && !disabled && setOpen(true)}
      className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
    >
      <span className="truncate">{selected?.label ?? placeholder}</span>
      <div className="flex shrink-0 items-center gap-1">
        {allowClear && value && (
          <span
            role="button"
            aria-label="Išvalyti"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full opacity-50 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </div>
    </Button>
  );

  if (isMobile) return (
    <>
      {trigger}
      <Drawer open={open} onOpenChange={setOpen} repositionInputs={false}>
        <DrawerContent className="max-h-[var(--sheet-max-height)]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display text-xl">{placeholder}</DrawerTitle>
            <DrawerDescription>Pasirink iš sąrašo arba įjunk paiešką.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {!searching ? (
              <Button
                type="button"
                variant="outline"
                className="mb-3 h-12 w-full justify-start rounded-2xl text-muted-foreground"
                onClick={() => {
                  setSearching(true);
                  window.setTimeout(() => searchRef.current?.focus(), 80);
                }}
              >
                <Search className="mr-2 h-4 w-4" /> {searchPlaceholder}
              </Button>
            ) : (
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-12 rounded-2xl pl-9 pr-10"
                />
                <Button type="button" variant="ghost" size="icon" aria-label="Uždaryti paiešką" onClick={() => { setSearching(false); setQuery(""); }} className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="max-h-[calc(var(--sheet-max-height)-9rem)] overflow-y-auto overscroll-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filtered.length ? filtered.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant="ghost"
                  onClick={() => { onChange(opt.value === value ? "" : opt.value); setOpen(false); }}
                  className={cn("grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center justify-normal gap-3 rounded-none border-b border-border/60 px-2 text-left text-sm", value === opt.value && "font-semibold text-primary")}
                >
                  <span className="truncate">{opt.keywords ? `${opt.label} · ${opt.keywords}` : opt.label}</span>
                  <Check className={cn("h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                </Button>
              )) : <div className="py-10 text-center text-sm text-muted-foreground">{emptyText}</div>}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        avoidCollisions
        className="z-[70] w-[--radix-popover-trigger-width] min-w-[15rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border-border/60 bg-card/95 p-0 shadow-elegant backdrop-blur-xl"
      >
        <Command className="bg-transparent">
          <CommandInput placeholder={searchPlaceholder} className="h-11" />
          <CommandList className="max-h-[min(18rem,45vh)] overscroll-contain px-1 py-1">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{emptyText}</CommandEmpty>
            <CommandGroup className="p-0">
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.keywords ?? ""}`}
                  onSelect={() => { onChange(opt.value === value ? "" : opt.value); setOpen(false); }}
                  className="my-0.5 cursor-pointer rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-accent"
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0 text-primary", value === opt.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{opt.keywords ? `${opt.label} · ${opt.keywords}` : opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
