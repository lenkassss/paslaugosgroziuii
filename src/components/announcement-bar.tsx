import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Megaphone, X, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { listActiveAnnouncements } from "@/lib/announcements.functions";

const KEY = "pg_dismissed_announcements_v1";

const TONE: Record<string, { cls: string; icon: typeof Info }> = {
  info: { cls: "border-primary/30 bg-primary/[0.07] text-foreground", icon: Info },
  success: { cls: "border-emerald-500/30 bg-emerald-500/10 text-foreground", icon: CheckCircle2 },
  warning: { cls: "border-amber-500/40 bg-amber-500/10 text-foreground", icon: AlertTriangle },
  critical: { cls: "border-destructive/40 bg-destructive/10 text-foreground", icon: AlertTriangle },
};

/**
 * Site-wide announcement bar published by the Super Admin broadcast centre.
 * Dismissals are remembered per device.
 */
export function AnnouncementBar() {
  const fetchFn = useServerFn(listActiveAnnouncements);
  const { data } = useQuery({
    queryKey: ["active-announcements"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
  });
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      setDismissed(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setDismissed([]);
    }
  }, []);

  const list = (data?.announcements ?? []).filter((a) => !dismissed.includes(a.id));
  if (!list.length) return null;
  const a = list[0];
  const tone = TONE[a.level] ?? TONE.info;
  const Icon = tone.icon;

  const dismiss = () => {
    const next = [...dismissed, a.id];
    setDismissed(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next.slice(-30)));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`border-b ${tone.cls}`}>
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 md:px-6">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-background/70">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">{a.title}</span>
          {a.body && <span className="ml-2 text-muted-foreground">{a.body}</span>}
        </div>
        <Megaphone className="mt-0.5 hidden h-4 w-4 shrink-0 opacity-50 md:block" />
        <button
          type="button"
          aria-label="Užverti pranešimą"
          onClick={dismiss}
          className="mt-0.5 shrink-0 rounded-full p-1 transition active:scale-90 hover:bg-background/60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
