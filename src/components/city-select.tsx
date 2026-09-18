import { Combobox } from "@/components/ui/combobox";
import { LT_CITIES } from "@/lib/lt-cities";

// Miestai rikiuojami pagal dydį (didmiesčiai pirmi), o ne abėcėlės tvarka.
const OPTIONS = LT_CITIES.map((c) => ({ value: c, label: c }));

export function CitySelect({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  return (
    <Combobox
      options={OPTIONS}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? "Visi miestai"}
      searchPlaceholder={searchPlaceholder ?? "Ieškoti miesto..."}
      className={className}
    />
  );
}
