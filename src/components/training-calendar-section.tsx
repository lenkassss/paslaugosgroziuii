import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { CitySelect } from "@/components/city-select";
import { CourseCalendar } from "@/components/course-calendar";
import { listTrainingCalendar } from "@/lib/schools.functions";
import { listBrandsInUse } from "@/lib/provider-brands.functions";
import { SERVICE_CATEGORY_LABELS } from "@/lib/service-taxonomy";
import { cn } from "@/lib/utils";

const HORIZONS = [3, 6, 12] as const;

/**
 * Vienas mokymų kalendorius verslui: mokyklų kursai ir tiekėjų seminarai.
 * Filtrai – miestas, paslaugų sritis arba prekinis ženklas; horizontas 3/6/12 mėn.
 */
export function TrainingCalendarSection() {
  const [months, setMonths] = useState<number>(6);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [brandId, setBrandId] = useState("");

  const cityFilter = city && city !== "Visi" ? city : "";
  const trainings = useQuery({
    queryKey: ["training-calendar", months, cityFilter, category, brandId],
    queryFn: () => listTrainingCalendar({
      data: {
        months,
        ...(cityFilter ? { city: cityFilter } : {}),
        ...(category ? { category } : {}),
        ...(brandId ? { brandId } : {}),
      },
    }),
    staleTime: 60_000,
  });
  const { data: brandData } = useQuery({
    queryKey: ["brands-in-use"],
    queryFn: () => listBrandsInUse(),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 md:grid-cols-3">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Miestas</div>
          <CitySelect value={city} onChange={setCity} className="h-11 rounded-xl bg-background" />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Paslaugų sritis</div>
          <Combobox
            options={SERVICE_CATEGORY_LABELS.map((label) => ({ value: label, label }))}
            value={category}
            onChange={setCategory}
            placeholder="Visos sritys"
            searchPlaceholder="Ieškoti srities..."
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Prekinis ženklas</div>
          <Combobox
            options={(brandData?.brands ?? []).map((b) => ({ value: b.id, label: b.name }))}
            value={brandId}
            onChange={setBrandId}
            placeholder="Visi ženklai"
            searchPlaceholder="Ieškoti ženklo..."
            emptyText="Prekės ženklų nerasta."
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div className="md:col-span-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Laikotarpis</span>
          {HORIZONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setMonths(h)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                months === h ? "border-cyclamen bg-cyclamen text-primary-foreground" : "border-border hover:border-cyclamen/60",
              )}
            >
              {h} mėn.
            </button>
          ))}
        </div>
      </Card>

      <CourseCalendar
        key={months}
        courses={trainings.data?.courses ?? []}
        months={months}
        isLoading={trainings.isLoading}
      />
    </div>
  );
}
