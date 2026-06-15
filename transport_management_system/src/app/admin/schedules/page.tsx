import { Suspense } from "react";
import { getAdminClient } from "@/lib/admin/session";
import { getAdminSchedules } from "@/lib/admin/queries";
import { createSchedule, deleteSchedule } from "@/lib/admin/actions";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { AdminPagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { unwrapRelation } from "@/lib/supabase/helpers";

interface AdminSchedulesPageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function AdminSchedulesPage({ searchParams }: AdminSchedulesPageProps) {
  const params = await searchParams;
  const { schedules, total, page, error } = await getAdminSchedules(params);

  const supabase = await getAdminClient();
  const { data: routes } = await supabase.from("routes").select("id, origin, destination");
  const { data: buses } = await supabase.from("buses").select("id, plate_number");

  const toolbarParams = { q: params.q, status: params.status };

  return (
    <div>
      <h1 className="text-2xl font-bold">Schedule Management</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Create Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSchedule} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Route</Label>
              <Select name="route_id" className="mt-1" required>
                {(routes ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.origin} → {r.destination}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Bus</Label>
              <Select name="bus_id" className="mt-1" required>
                {(buses ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.plate_number}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Departure</Label>
              <Input name="departure_at" type="datetime-local" required className="mt-1" />
            </div>
            <div>
              <Label>Arrival</Label>
              <Input name="arrival_at" type="datetime-local" required className="mt-1" />
            </div>
            <div>
              <Label>Fare Override (optional)</Label>
              <Input name="fare_override" type="number" className="mt-1" />
            </div>
            <div className="flex items-end">
              <Button type="submit">Create Schedule</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Suspense fallback={null}>
          <AdminListToolbar
            placeholder="Search route, company, or bus plate…"
            statusOptions={[
              { value: "scheduled", label: "Scheduled" },
              { value: "boarding", label: "Boarding" },
              { value: "departed", label: "Departed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </Suspense>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 space-y-3">
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              No schedules found. Create a schedule or adjust your search filters.
            </CardContent>
          </Card>
        ) : (
          schedules.map((s) => {
            const route = unwrapRelation(s.route);
            const company = unwrapRelation(route?.company);
            const bus = unwrapRelation(s.bus);
            return (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-semibold">
                      {route?.origin} → {route?.destination}
                    </p>
                    <p className="text-sm text-slate-500">
                      {company?.name} · {bus?.plate_number} · {formatDateTime(s.departure_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{s.status}</Badge>
                    <form action={deleteSchedule.bind(null, s.id)}>
                      <Button variant="destructive" size="sm" type="submit">
                        Remove
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AdminPagination
        basePath="/admin/schedules"
        page={page}
        total={total}
        params={toolbarParams}
      />
    </div>
  );
}
