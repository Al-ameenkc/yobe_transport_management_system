import { getAdminClient } from "@/lib/admin/session";
import { createDriver, deleteDriver } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDriversPage() {
  const supabase = await getAdminClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*, company:companies(name)")
    .order("full_name");

  const { data: companies } = await supabase.from("companies").select("id, name");

  return (
    <div>
      <h1 className="text-2xl font-bold">Driver Management</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Add Driver</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDriver} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <Label>Full Name</Label>
              <Input name="full_name" required className="mt-1" />
            </div>
            <div>
              <Label>License Number</Label>
              <Input name="license_number" required className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" className="mt-1" />
            </div>
            <div className="flex items-end">
              <Button type="submit">Add Driver</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        {(drivers ?? []).map((driver) => (
          <Card key={driver.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-semibold">{driver.full_name}</p>
                <p className="text-sm text-slate-500">
                  {driver.company?.name} · {driver.license_number}
                  {driver.phone && ` · ${driver.phone}`}
                </p>
              </div>
              <form action={deleteDriver.bind(null, driver.id)}>
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

