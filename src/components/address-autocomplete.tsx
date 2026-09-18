import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { suggestAddress, type AddressSuggestion } from "@/lib/geo.functions";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function AddressAutocomplete({
  value,
  city,
  onChange,
  onPick,
  placeholder,
  className,
}: {
  value: string;
  city?: string;
  onChange: (v: string) => void;
  onPick: (s: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [term, setTerm] = useState(value);
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setTerm(value), [value]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 350);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const enabled = debounced.length >= 3;
  const { data, isFetching } = useQuery({
    queryKey: ["address-suggest", debounced, city ?? ""],
    queryFn: () => suggestAddress({ data: { q: debounced, city: city || undefined } }),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const items = data?.suggestions ?? [];

  return (
    <div ref={box} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          value={term}
          onChange={(e) => { setTerm(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? t("address.placeholder")}
          className="h-11 pl-9 pr-9"
          autoComplete="off"
        />
        {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {open && enabled && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-elegant animate-fade-in">
          {items.length === 0 && !isFetching && (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">{t("address.empty")}</div>
          )}
          {items.map((s: AddressSuggestion) => (
            <button
              key={`${s.label}-${s.lat}-${s.lng}`}
              type="button"
              onClick={() => { setTerm(s.label); onChange(s.label); onPick(s); setOpen(false); }}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-accent"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.label}</span>
                {s.postcode && <span className="block text-xs text-muted-foreground">{s.postcode}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{t("address.hint")}</p>
    </div>
  );
}
