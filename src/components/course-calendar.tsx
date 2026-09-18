import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import type { CalendarCourse } from "@/lib/schools.functions";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("lt-LT", { month: "long", year: "numeric" });
}

/**
 * 6 mėnesių mokymų kalendorius. Kairėje – mėnesio tinklelis su dienomis, kuriose
 * yra mokymų; apačioje – pasirinktos dienos (arba viso mėnesio) mokymų sąrašas.
 */
export function CourseCalendar({
  courses,
  months = 6,
  isLoading,
}: {
  courses: CalendarCourse[];
  months?: number;
  isLoading?: boolean;
}) {
  const monthOptions = useMemo(() => {
    const base = new Date();
    return Array.from({ length: months }, (_, i) => new Date(base.getFullYear(), base.getMonth() + i, 1));
  }, [months]);
  const [monthIndex, setMonthIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Automatiškai atidarom pirmą mėnesį, kuriame yra paskelbtų mokymų.
  const jumped = useRef("");
  useEffect(() => {
    if (!courses.length) return;
    const signature = courses.map((c) => c.id).join(",");
    if (jumped.current === signature) return;
    jumped.current = signature;
    const keys = new Set(courses.map((c) => monthKey(new Date(c.starts_at))));
    const idx = monthOptions.findIndex((m) => keys.has(monthKey(m)));
    if (idx > 0) { setMonthIndex(idx); setSelectedDay(null); }
  }, [courses, monthOptions]);

  const activeMonth = monthOptions[monthIndex] ?? monthOptions[0]!;
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarCourse[]>();
    for (const course of courses) {
      const key = new Date(course.starts_at).toISOString().slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), course]);
    }
    return map;
  }, [courses]);

  const monthCourses = courses.filter((c) => monthKey(new Date(c.starts_at)) === monthKey(activeMonth));
  const visible = selectedDay ? (byDay.get(selectedDay) ?? []) : monthCourses;

  const firstWeekday = (new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            type="button" size="icon" variant="ghost" aria-label="Ankstesnis mėnuo"
            disabled={monthIndex === 0}
            onClick={() => { setMonthIndex((i) => Math.max(0, i - 1)); setSelectedDay(null); }}
          ><ChevronLeft className="h-4 w-4" /></Button>
          <div className="min-w-0 text-center">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mokymų kalendorius</div>
            <div className="truncate font-display text-base capitalize">{monthLabel(activeMonth)}</div>
          </div>
          <Button
            type="button" size="icon" variant="ghost" aria-label="Kitas mėnuo"
            disabled={monthIndex >= monthOptions.length - 1}
            onClick={() => { setMonthIndex((i) => Math.min(monthOptions.length - 1, i + 1)); setSelectedDay(null); }}
          ><ChevronRight className="h-4 w-4" /></Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-muted-foreground">
          {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), i + 1);
            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const count = (byDay.get(key) ?? []).length;
            const on = selectedDay === key;
            return (
              <button
                key={key}
                type="button"
                disabled={!count}
                onClick={() => setSelectedDay(on ? null : key)}
                className={cn(
                  "grid h-10 place-items-center rounded-xl border text-sm transition",
                  count ? "border-cyclamen/40 bg-cyclamen/10 font-semibold hover:border-cyclamen" : "border-transparent text-muted-foreground/50",
                  on && "border-cyclamen bg-cyclamen text-primary-foreground",
                )}
              >
                <span>{i + 1}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {selectedDay
            ? <>Rodoma pasirinkta diena. <button type="button" className="text-primary underline" onClick={() => setSelectedDay(null)}>Rodyti visą mėnesį</button></>
            : "Pasirinkite dieną, kad matytumėte tos dienos mokymus."}
        </p>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)
        ) : visible.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            <CalendarDays className="mx-auto mb-2 h-8 w-8" />
            Šiuo laikotarpiu paskelbtų mokymų nėra — pasirinkite kitą mėnesį.
          </Card>
        ) : (
          visible.map((course) => (
            <Card key={course.id} className="p-4 transition hover:border-primary/40">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {new Date(course.starts_at).toLocaleDateString("lt-LT", { day: "numeric", month: "short" })}
                      {" · "}
                      {new Date(course.starts_at).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })}
                    </Badge>
                    {course.category && <Badge variant="secondary" className="text-[11px]">{course.category}</Badge>}
                  </div>
                  <h3 className="mt-1.5 truncate font-display text-lg">{course.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="truncate">{course.school_name}</span>
                    {course.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{course.city}</span>}
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration_hours} val.</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{course.seats} vietų</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <span className="font-display text-lg font-semibold">{course.price.toFixed(2)} €</span>
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:opacity-90">
                    {course.kind === "event" && course.article_slug ? (
                      <Link to="/article/$slug" params={{ slug: course.article_slug }}>Registruotis</Link>
                    ) : (
                      <Link to="/mokyklos/$slug" params={{ slug: course.school_slug }}>Registruotis</Link>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
