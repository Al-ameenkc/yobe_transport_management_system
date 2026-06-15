"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { VehicleTopView } from "@/components/booking/vehicle-top-view";
import { normalizeVehicleType } from "@/lib/constants/vehicles";
import type { Seat, SeatLayout } from "@/types/database";

interface SeatMapProps {
  scheduleId: string;
  seats: Seat[];
  layout: SeatLayout;
  selectedSeatIds: string[];
  onSelectionChange: (seatIds: string[]) => void;
  currentUserId?: string;
}

export function SeatMap({
  scheduleId,
  seats: initialSeats,
  layout,
  selectedSeatIds,
  onSelectionChange,
  currentUserId,
}: SeatMapProps) {
  const [seatPatches, setSeatPatches] = useState<Record<string, Seat>>({});
  const supabase = createClient();
  const vehicleType = layout.vehicleType ?? normalizeVehicleType(layout.vehicleType);

  const seats = useMemo(
    () => initialSeats.map((seat) => seatPatches[seat.id] ?? seat),
    [initialSeats, seatPatches]
  );

  useEffect(() => {
    const channel = supabase
      .channel(`seats-${scheduleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seats",
          filter: `schedule_id=eq.${scheduleId}`,
        },
        (payload) => {
          const updated = payload.new as Seat;
          setSeatPatches((prev) => ({ ...prev, [updated.id]: updated }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scheduleId, supabase]);

  const toggleSeat = useCallback(
    (seat: Seat) => {
      const isSelectable =
        seat.status === "available" ||
        (seat.status === "held" && seat.held_by === currentUserId);

      if (!isSelectable) return;

      const isSelected = selectedSeatIds.includes(seat.id);
      if (isSelected) {
        onSelectionChange(selectedSeatIds.filter((id) => id !== seat.id));
      } else {
        onSelectionChange([...selectedSeatIds, seat.id]);
      }
    },
    [selectedSeatIds, onSelectionChange, currentUserId]
  );

  return (
    <VehicleTopView
      seats={seats}
      vehicleType={vehicleType}
      interactive
      selectedSeatIds={selectedSeatIds}
      currentUserId={currentUserId}
      onSeatClick={toggleSeat}
      showLegend
    />
  );
}
