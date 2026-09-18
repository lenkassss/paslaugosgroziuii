import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

/** Šalių kodai + kiek skaitmenų turi nacionalinis numeris (be kodo). */
export const PHONE_COUNTRIES = [
  { code: "+370", name: "Lietuva", digits: [8] },
  { code: "+371", name: "Latvija", digits: [8] },
  { code: "+372", name: "Estija", digits: [7, 8] },
  { code: "+48", name: "Lenkija", digits: [9] },
  { code: "+49", name: "Vokietija", digits: [10, 11] },
  { code: "+44", name: "Jungtinė Karalystė", digits: [10] },
  { code: "+353", name: "Airija", digits: [9] },
  { code: "+46", name: "Švedija", digits: [7, 8, 9] },
  { code: "+47", name: "Norvegija", digits: [8] },
  { code: "+358", name: "Suomija", digits: [9, 10] },
  { code: "+45", name: "Danija", digits: [8] },
  { code: "+31", name: "Nyderlandai", digits: [9] },
  { code: "+32", name: "Belgija", digits: [9] },
  { code: "+33", name: "Prancūzija", digits: [9] },
  { code: "+34", name: "Ispanija", digits: [9] },
  { code: "+39", name: "Italija", digits: [9, 10] },
  { code: "+43", name: "Austrija", digits: [10, 11] },
  { code: "+41", name: "Šveicarija", digits: [9] },
  { code: "+420", name: "Čekija", digits: [9] },
  { code: "+380", name: "Ukraina", digits: [9] },
  { code: "+1", name: "JAV / Kanada", digits: [10] },
] as const;

export function isValidPhone(dial: string, national: string) {
  const country = PHONE_COUNTRIES.find((c) => c.code === dial);
  const digits = national.replace(/\D/g, "");
  if (!country) return false;
  return (country.digits as readonly number[]).includes(digits.length);
}

/** Grupuoja skaitmenis po 3, kad numeris būtų lengvai skaitomas. */
function format(national: string) {
  const digits = national.replace(/\D/g, "");
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export function PhoneInput({
  dial,
  value,
  onDialChange,
  onChange,
  required,
}: {
  dial: string;
  value: string;
  onDialChange: (dial: string) => void;
  onChange: (national: string) => void;
  required?: boolean;
}) {
  const options = useMemo(
    () => PHONE_COUNTRIES.map((c) => ({ value: c.code, label: c.code, keywords: c.name })),
    [],
  );
  const country = PHONE_COUNTRIES.find((c) => c.code === dial);
  const digits = value.replace(/\D/g, "");
  const valid = isValidPhone(dial, value);
  const touched = digits.length > 0;

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-2">
        <Combobox
          options={options}
          value={dial}
          onChange={onDialChange}
          allowClear={false}
          placeholder="Kodas"
          searchPlaceholder="Ieškoti šalies..."
          className="h-13 rounded-2xl bg-background/70 px-3 text-base"
        />
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          value={format(value)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 12))}
          placeholder={country ? "6".padEnd((country.digits as readonly number[])[0], "0") : "612 34 567"}
          className={cn(
            "h-13 rounded-2xl bg-background/70 px-4 text-base",
            touched && (valid ? "border-emerald-500/60" : "border-destructive/60"),
          )}
          aria-invalid={touched && !valid}
        />
      </div>
      {touched && (
        <p className={cn("mt-1.5 flex items-center gap-1 text-[11px]", valid ? "text-emerald-600" : "text-destructive")}>
          {valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {valid
            ? `Numeris tinkamas: ${dial} ${format(value)}`
            : `${country?.name ?? "Šalis"} — reikia ${(country?.digits as readonly number[] | undefined)?.join(" arba ") ?? "9"} skaitmenų (įvesta ${digits.length})`}
        </p>
      )}
    </div>
  );
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
}
