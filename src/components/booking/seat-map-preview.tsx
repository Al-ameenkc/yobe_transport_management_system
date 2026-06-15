import { VehicleTopView } from "@/components/booking/vehicle-top-view";
import { normalizeVehicleType } from "@/lib/constants/vehicles";
import type { Seat, SeatLayout } from "@/types/database";

interface SeatMapPreviewProps {
  seats: Seat[];
  layout: SeatLayout;
  compact?: boolean;
  showLegend?: boolean;
}

export function SeatMapPreview({
  seats,
  layout,
  compact = false,
  showLegend = true,
}: SeatMapPreviewProps) {
  const vehicleType = layout.vehicleType ?? normalizeVehicleType(layout.vehicleType);

  return (
    <VehicleTopView
      seats={seats}
      vehicleType={vehicleType}
      compact={compact}
      showLegend={showLegend}
    />
  );
}
