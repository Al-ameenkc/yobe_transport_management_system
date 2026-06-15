import { Suspense } from "react";
import { getAdminClient } from "@/lib/admin/session";
import { getAdminBuses } from "@/lib/admin/queries";
import { createBus, deleteBus } from "@/lib/admin/actions";
import { BusCreateForm } from "@/components/admin/bus-create-form";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { AdminPagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getVehicleLabel, normalizeVehicleType } from "@/lib/constants/vehicles";
import { unwrapRelation } from "@/lib/supabase/helpers";

interface AdminBusesPageProps {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}

export default async function AdminBusesPage({ searchParams }: AdminBusesPageProps) {
  const params = await searchParams;
  const { buses, total, page, error } = await getAdminBuses(params);

  const supabase = await getAdminClient();
  const { data: companies } = await supabase.from("companies").select("id, name");

  const toolbarParams = { q: params.q, type: params.type };

  return (
    <div>
      <h1 className="text-2xl font-bold">Bus Management</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Add Bus</CardTitle>
        </CardHeader>
        <CardContent>
          <BusCreateForm companies={companies ?? []} createBus={createBus} />
        </CardContent>
      </Card>

      <div className="mt-6">
        <Suspense fallback={null}>
          <AdminListToolbar
            placeholder="Search plate number or model…"
            typeOptions={[
              { value: "bus", label: "Toyota Bus" },
              { value: "sienna", label: "Sienna" },
              { value: "sharon", label: "Sharon" },
              { value: "golf", label: "Golf" },
            ]}
          />
        </Suspense>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 space-y-3">
        {buses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              No buses found. Add a bus or adjust your search filters.
            </CardContent>
          </Card>
        ) : (
          buses.map((bus) => {
            const company = unwrapRelation(bus.company);
            const vehicleType = normalizeVehicleType(bus.vehicle_type ?? bus.model);
            return (
              <Card key={bus.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-semibold">{bus.plate_number}</p>
                    <p className="text-sm text-slate-500">
                      {company?.name} · {getVehicleLabel(vehicleType)} · {bus.capacity} seats
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{bus.status}</Badge>
                    <form action={deleteBus.bind(null, bus.id)}>
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
        basePath="/admin/buses"
        page={page}
        total={total}
        params={toolbarParams}
      />
    </div>
  );
}
