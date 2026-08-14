import { getAdminClient } from "@/lib/admin/session";
import { createRoute, deleteRoute } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getYobeLGAs } from "@/lib/constants/lgas";
import { YOBE_DESTINATIONS } from "@/lib/constants/routes";

export default async function AdminRoutesPage() {
  const supabase = await getAdminClient();
  const { data: routes } = await supabase
    .from("routes")
    .select("*, company:companies(name)")
    .order("origin");

  const { data: companies } = await supabase.from("companies").select("id, name");

  return (
    <div>
      <h1 className="text-2xl font-bold">Route Management</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Create Route</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRoute} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Company</Label>
              <Select name="company_id" className="mt-1" required>
                {(companies ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Origin (town / LGA)</Label>
              <Select name="origin" className="mt-1" required defaultValue="Damaturu">
                {getYobeLGAs().map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Destination (LGA or state)</Label>
              <Select name="destination" className="mt-1" required>
                <optgroup label="Yobe LGAs">
                  {getYobeLGAs().map((lga) => (
                    <option key={`lga-${lga}`} value={lga}>
                      {lga}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other states">
                  {YOBE_DESTINATIONS.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </div>
            <div>
              <Label>Distance (km)</Label>
              <Input name="distance_km" type="number" step="0.1" required className="mt-1" />
            </div>
            <div>
              <Label>Base Fare (₦)</Label>
              <Input name="base_fare" type="number" required className="mt-1" />
            </div>
            <div className="flex items-end">
              <Button type="submit">Create Route</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        {(routes ?? []).map((route) => (
          <Card key={route.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-semibold">
                  {route.origin} → {route.destination}
                </p>
                <p className="text-sm text-slate-500">
                  {route.company?.name} · {route.distance_km} km ·{" "}
                  {formatCurrency(route.base_fare)}
                </p>
              </div>
              <form action={deleteRoute.bind(null, route.id)}>
                <Button variant="destructive" size="sm" type="submit">
                  Remove
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

