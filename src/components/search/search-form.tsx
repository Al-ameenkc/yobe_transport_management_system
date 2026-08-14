"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { getYobeLGAs } from "@/lib/constants/lgas";
import { todayDateString, type TripScope } from "@/lib/constants/routes";
import { VEHICLE_CONFIGS, VEHICLE_TYPES } from "@/lib/constants/vehicles";

interface SearchFormProps {
  destinations: string[];
  lgas?: string[];
  defaultScope?: TripScope;
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDate?: string;
  defaultVehicleType?: string;
  showAllOption?: boolean;
}

export function SearchForm({
  destinations,
  lgas = getYobeLGAs(),
  defaultScope = "outside",
  defaultOrigin = "",
  defaultDestination = "",
  defaultDate = "",
  defaultVehicleType = "",
  showAllOption = true,
}: SearchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scope, setScope] = useState<TripScope>(defaultScope);
  const today = todayDateString();

  function navigate(path: string) {
    startTransition(() => {
      router.push(path);
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const date = (form.get("date") as string) || today;
    const vehicleType = form.get("vehicleType") as string;
    const tripScope = form.get("scope") as TripScope;
    const origin = form.get("origin") as string;

    const params = new URLSearchParams({ date, scope: tripScope });
    if (origin) params.set("origin", origin);

    if (tripScope === "within") {
      const destination = form.get("lgaDestination") as string;
      if (destination) params.set("destination", destination);
    } else {
      const destination = form.get("destination") as string;
      if (destination) params.set("destination", destination);
    }

    if (vehicleType) params.set("vehicleType", vehicleType);
    navigate(`/search?${params.toString()}`);
  }

  function showAllToday() {
    navigate(`/search?date=${today}&scope=${scope}`);
  }

  return (
    <Card className="mx-auto w-full max-w-4xl text-left text-slate-900">
      <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="scope">Trip Type</Label>
            <Select
              id="scope"
              name="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as TripScope)}
              className="mt-1"
              disabled={isPending}
            >
              <option value="outside">Outside Yobe (to other states)</option>
              <option value="within">Within Yobe (between LGAs)</option>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="origin">From (town / LGA)</Label>
              <Select
                id="origin"
                name="origin"
                defaultValue={defaultOrigin || "Damaturu"}
                className="mt-1"
                disabled={isPending}
              >
                {lgas.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </Select>
            </div>

            {scope === "within" ? (
              <div>
                <Label htmlFor="lgaDestination">To (LGA)</Label>
                <Select
                  id="lgaDestination"
                  name="lgaDestination"
                  defaultValue={defaultDestination}
                  className="mt-1"
                  disabled={isPending}
                >
                  {showAllOption && <option value="">All LGAs</option>}
                  {lgas.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="destination">To (State)</Label>
                <Select
                  id="destination"
                  name="destination"
                  defaultValue={defaultDestination}
                  className="mt-1"
                  disabled={isPending}
                >
                  {showAllOption && <option value="">All states</option>}
                  {destinations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select
                id="vehicleType"
                name="vehicleType"
                defaultValue={defaultVehicleType}
                className="mt-1"
                disabled={isPending}
              >
                <option value="">All vehicles</option>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {VEHICLE_CONFIGS[type].displayName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                min={today}
                defaultValue={defaultDate || today}
                className="mt-1"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <Button type="submit" className="w-full sm:w-auto" loading={isPending}>
              {scope === "within" ? "Find Local Buses" : "Find Buses"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto"
              onClick={showAllToday}
              loading={isPending}
            >
              {scope === "within"
                ? "Show all within-Yobe buses today"
                : "Show all interstate buses today"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
