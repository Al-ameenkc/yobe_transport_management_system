"use client";

import { useState } from "react";
import {
  VEHICLE_TYPES,
  getVehicleConfig,
  getVehicleLabel,
  type VehicleType,
} from "@/lib/constants/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface Company {
  id: string;
  name: string;
}

interface BusCreateFormProps {
  companies: Company[];
  createBus: (formData: FormData) => Promise<void>;
}

export function BusCreateForm({ companies, createBus }: BusCreateFormProps) {
  const [vehicleType, setVehicleType] = useState<VehicleType>("bus");
  const config = getVehicleConfig(vehicleType);

  return (
    <form action={createBus} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label>Company</Label>
        <Select name="company_id" className="mt-1" required>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Plate Number</Label>
        <Input name="plate_number" required className="mt-1" placeholder="YBE-BUS-03" />
      </div>

      <div>
        <Label>Vehicle Type</Label>
        <Select
          name="vehicle_type"
          className="mt-1"
          required
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value as VehicleType)}
        >
          {VEHICLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {getVehicleLabel(type)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Capacity (auto)</Label>
        <Input
          name="capacity"
          type="number"
          readOnly
          value={config.capacity}
          className="mt-1 bg-slate-50"
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <Label>Seat arrangement (auto)</Label>
        <p className="mt-1 rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {config.seatNumbers.join(", ")}
        </p>
      </div>

      <div className="flex items-end sm:col-span-2 lg:col-span-3">
        <Button type="submit">Add Bus</Button>
      </div>
    </form>
  );
}
