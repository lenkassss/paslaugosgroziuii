import { useMemo } from "react";
import { Check } from "lucide-react";

const LABELS = ["Per silpnas", "Silpnas", "Vidutinis", "Stiprus", "Labai stiprus"] as const;

const BARS = [
  "bg-destructive",
  "bg-destructive/70",
  "bg-primary/50",
  "bg-primary",
  "bg-success",
] as const;

const TEXT = [
  "text-destructive",
  "text-destructive",
  "text-muted-foreground",
  "text-primary",
  "text-success",
] as const;

export function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; missing: string[] } {
  const missing: string[] = [];
  if (pw.length < 8) missing.push("bent 8 simboliai");
  if (!/[a-zšžėįųūčą]/.test(pw)) missing.push("mažoji raidė");
  if (!/[A-ZŠŽĖĮŲŪČĄ]/.test(pw)) missing.push("didžioji raidė");
  if (!/\d/.test(pw)) missing.push("skaitmuo");
  if (!/[^\w\s]/.test(pw)) missing.push("specialus simbolis");

  if (!pw) return { score: 0, missing };

  let points = 0;
  if (pw.length >= 8) points += 1;
  if (pw.length >= 12) points += 1;
  if (pw.length >= 16) points += 1;
  if (/[a-zšžėįųūčą]/.test(pw) && /[A-ZŠŽĖĮŲŪČĄ]/.test(pw)) points += 1;
  if (/\d/.test(pw)) points += 1;
  if (/[^\w\s]/.test(pw)) points += 1;

  // Penalise trivial patterns: repeats and pure sequences.
  if (/^(.)\1+$/.test(pw)) points = 0;
  if (/(.)\1{2,}/.test(pw)) points -= 1;
  if (/^\d+$/.test(pw) || /^[a-zšžėįųūčą]+$/.test(pw)) points -= 1;

  const score = Math.max(0, Math.min(4, points - 1)) as 0 | 1 | 2 | 3 | 4;
  return { score, missing };
}

/** Live password strength meter shown under the sign-up password field. */
export function PasswordStrength({ value }: { value: string }) {
  const { score, missing } = useMemo(() => scorePassword(value), [value]);
  const checks = useMemo(
    () => [
      { label: "8+ simboliai", ok: value.length >= 8 },
      { label: "Didžioji raidė", ok: /[A-ZŠŽĖĮŲŪČĄ]/.test(value) },
      { label: "Skaitmuo", ok: /\d/.test(value) },
      { label: "Simbolis", ok: /[^\w\s]/.test(value) },
    ],
    [value],
  );
  if (!value) return null;

  return (
    <div className="mt-2.5 rounded-2xl border border-border/60 bg-secondary/40 p-3" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/70">
            <span
              className={`block h-full rounded-full transition-all duration-500 ease-out ${BARS[score]}`}
              style={{ width: i < Math.max(score, value ? 1 : 0) ? "100%" : "0%" }}
            />
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className={`text-xs font-semibold ${TEXT[score]}`}>{LABELS[score]}</span>
        {missing.length > 0 && (
          <span className="text-[11px] text-muted-foreground">Rekomenduojama: {missing.slice(0, 2).join(", ")}</span>
        )}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((c) => (
          <li
            key={c.label}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${c.ok ? "text-success" : "text-muted-foreground"}`}
          >
            <span
              className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                c.ok ? "border-success bg-success/15" : "border-border"
              }`}
            >
              {c.ok && <Check className="h-2.5 w-2.5" />}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
