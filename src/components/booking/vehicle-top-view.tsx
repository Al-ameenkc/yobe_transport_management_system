"use client";

import { cn } from "@/lib/utils";
import {
  getVehicleConfig,
  normalizeVehicleType,
  type VehicleType,
} from "@/lib/constants/vehicles";
import type { Seat, SeatStatus } from "@/types/database";

interface VehicleTopViewProps {
  seats: Seat[];
  vehicleType: VehicleType | string;
  compact?: boolean;
  interactive?: boolean;
  selectedSeatIds?: string[];
  currentUserId?: string;
  onSeatClick?: (seat: Seat) => void;
  showLegend?: boolean;
}

function seatStatusClass(
  status: SeatStatus | "missing",
  isSelected: boolean,
  interactive: boolean,
  heldByCurrentUser?: boolean
) {
  if (status === "missing") {
    return "bg-slate-100 text-slate-400 border-dashed";
  }
  if (isSelected) {
    return "bg-emerald-600 text-white ring-2 ring-emerald-300";
  }
  if (status === "booked") {
    return interactive
      ? "cursor-not-allowed bg-slate-300 text-slate-500"
      : "bg-slate-300 text-slate-500";
  }
  if (status === "held") {
    if (heldByCurrentUser) {
      return interactive
        ? "bg-amber-400 text-amber-900 hover:bg-amber-500"
        : "bg-amber-300 text-amber-900";
    }
    return interactive
      ? "cursor-not-allowed bg-amber-200 text-amber-800"
      : "bg-amber-300 text-amber-900";
  }
  return interactive
    ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-500"
    : "bg-emerald-400 text-emerald-950";
}

export function VehicleTopView({
  seats,
  vehicleType,
  compact = false,
  interactive = false,
  selectedSeatIds = [],
  currentUserId,
  onSeatClick,
  showLegend = true,
}: VehicleTopViewProps) {
  const type = normalizeVehicleType(
    typeof vehicleType === "string" ? vehicleType : vehicleType
  );
  const config = getVehicleConfig(type);
  const seatByNumber = Object.fromEntries(seats.map((s) => [s.seat_number, s]));
  const height = compact ? 220 : 300;

  return (
    <div className="space-y-2">
      <div
        className="relative mx-auto w-full rounded-xl border border-slate-200 bg-white"
        style={{ maxWidth: compact ? 280 : 320, height }}
      >
        <p
          className={cn(
            "absolute left-0 right-0 top-1 z-10 text-center font-medium uppercase tracking-wider text-slate-400",
            compact ? "text-[8px]" : "text-[9px]"
          )}
        >
          Front
        </p>

        <div
          className={cn(
            "absolute z-10 rounded bg-slate-700 font-semibold text-white",
            compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"
          )}
          style={{
            left: `${config.driver.x}%`,
            top: `${config.driver.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          DRV
        </div>

        {config.seats.map((pos) => {
          const seat = seatByNumber[pos.seatNumber];
          const status: SeatStatus | "missing" = seat?.status ?? "missing";
          const isSelected = seat ? selectedSeatIds.includes(seat.id) : false;
          const isDisabled =
            !seat ||
            (interactive &&
              (status === "booked" ||
                (status === "held" && seat.held_by !== currentUserId)));

          const w = pos.w ?? 14;
          const h = pos.h ?? 9;

          const style = {
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: `${w}%`,
            height: `${h}%`,
            transform: "translate(-50%, -50%)",
          };

          const className = cn(
            "absolute z-10 flex items-center justify-center rounded-sm border border-slate-200 font-medium",
            seatStatusClass(
              status,
              isSelected,
              interactive && !!seat,
              seat?.held_by === currentUserId
            )
          );

          const label = (
            <span className={compact ? "text-[8px]" : "text-[10px]"}>
              {pos.seatNumber}
            </span>
          );

          if (interactive && seat && !isDisabled) {
            return (
              <button
                key={pos.seatNumber}
                type="button"
                onClick={() => onSeatClick?.(seat)}
                title={`Seat ${pos.seatNumber} — ${status}`}
                className={cn(className, "transition-colors")}
                style={style}
              >
                {label}
              </button>
            );
          }

          return (
            <div
              key={pos.seatNumber}
              title={
                seat
                  ? `Seat ${pos.seatNumber} — ${status}`
                  : `Seat ${pos.seatNumber} — not loaded`
              }
              className={className}
              style={style}
            >
              {label}
            </div>
          );
        })}
      </div>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Available
          </span>
          {interactive && (
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Selected
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-300" /> Held
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Booked
          </span>
        </div>
      )}
    </div>
  );
}
