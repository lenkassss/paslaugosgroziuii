import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "pg-theme";

function apply(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

/** Reads the stored theme and applies it once on the client. */
export function ThemeBootstrap() {
  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as "light" | "dark" | null) ?? "light";
    apply(stored);
  }, []);
  return null;
}

/** Luxury light / dark switch used in profile settings. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme((localStorage.getItem(KEY) as "light" | "dark" | null) ?? "light");
  }, []);

  const set = (next: "light" | "dark") => {
    setTheme(next);
    localStorage.setItem(KEY, next);
    apply(next);
  };

  return (
    <div className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-1">
      {(["light", "dark"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => set(t)}
          aria-pressed={theme === t}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 active:scale-95 ${
            theme === t ? "bg-background text-foreground shadow-elegant" : "text-muted-foreground"
          }`}
        >
          {t === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {t === "light" ? "Šviesi" : "Tamsi"}
        </button>
      ))}
    </div>
  );
}
