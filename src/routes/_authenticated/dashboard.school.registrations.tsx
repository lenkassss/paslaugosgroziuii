import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCourseRegistrations, setRegistrationStatus } from "@/lib/schools.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { statusLabel } from "@/lib/role-labels";
import { CheckCircle2, Mail, Phone, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/school/registrations")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCourseRegistrations);
  const statusFn = useServerFn(setRegistrationStatus);
  const [courseId, setCourseId] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["school-registrations"], queryFn: () => listFn() });

  const mut = useMutation({
    mutationFn: (v: { id: string; payment_status: "paid" | "cancelled" | "pending" }) => statusFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["school-registrations"] }); toast.success("Registracija atnaujinta"); },
    onError: (e) => toastError(e),
  });

  const courses = data?.courses ?? [];
  const registrations = useMemo(
    () => (data?.registrations ?? []).filter((r) => (courseId ? r.course_id === courseId : true)),
    [courseId, data?.registrations],
  );
  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? "Mokymai";
  const seatsTaken = (id: string) =>
    (data?.registrations ?? []).filter((r) => r.course_id === id && r.payment_status !== "cancelled")
      .reduce((sum, r) => sum + (r.seats ?? 1), 0);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl">Mokymų registracijos</h1>
        <p className="text-sm text-muted-foreground">Dalyviai, laisvos vietos ir apmokėjimo būsenos.</p>
      </div>

      {courses.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] sm:items-center">
          <Combobox
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
            value={courseId}
            onChange={setCourseId}
            placeholder="Visi mokymai"
            searchPlaceholder="Ieškoti mokymų..."
            className="h-11 rounded-xl bg-background"
          />
          {courseId && (
            <div className="text-sm text-muted-foreground">
              Užimta {seatsTaken(courseId)} iš {courses.find((c) => c.id === courseId)?.seats ?? 0} vietų
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : registrations.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8" />
          Registracijų dar nėra. Paskelbkite mokymus su data — jie atsiras kalendoriuje.
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{r.name}</span>
                    <Badge variant={r.payment_status === "paid" ? "secondary" : r.payment_status === "cancelled" ? "outline" : "outline"}>
                      {statusLabel(r.payment_status)}
                    </Badge>
                    <Badge variant="outline">{r.seats} v.</Badge>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">{courseTitle(r.course_id)}</div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{r.email}</a>
                    {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" />{r.phone}</a>}
                  </div>
                  {r.note && <p className="mt-2 text-sm text-muted-foreground">{r.note}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.payment_status !== "paid" && (
                    <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate({ id: r.id, payment_status: "paid" })}>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Apmokėta
                    </Button>
                  )}
                  {r.payment_status !== "cancelled" && (
                    <Button size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate({ id: r.id, payment_status: "cancelled" })}>
                      <XCircle className="mr-1 h-4 w-4" /> Atšaukti
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
