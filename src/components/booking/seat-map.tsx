"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [seats, setSeats] = useState(initialSeats);
  const supabase = createClient();
  const vehicleType = layout.vehicleType ?? normalizeVehicleType(layout.vehicleType);

  useEffect(() => {
    setSeats(initialSeats);
  }, [initialSeats]);

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
          setSeats((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          );
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
