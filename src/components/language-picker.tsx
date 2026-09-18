import { Check, Globe } from "lucide-react";
import { LANGS, useLanguage } from "@/lib/use-language";

/**
 * Native-friendly language switcher (plain buttons — works reliably inside
 * the Capacitor webview where dropdown menus can swallow taps).
 */
export function LanguagePicker({ className = "" }: { className?: string }) {
  const { lang, setLanguage } = useLanguage();

  return (
    <div className={`grid gap-1.5 ${className}`}>
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            aria-pressed={active}
            className={`touch-manip flex touch-target items-center gap-3 rounded-2xl border px-4 py-3 text-[15px] font-medium transition-all duration-300 active:scale-[0.97] ${
              active
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border/50 bg-background/60 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            <span className="grid h-7 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background/70 text-[11px] font-semibold tracking-wide">{l.short}</span>
            <span className="flex-1 truncate text-left">{l.label}</span>
            {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <Globe className="h-4 w-4 shrink-0 opacity-40" />}
          </button>
        );
      })}
    </div>
  );
}
