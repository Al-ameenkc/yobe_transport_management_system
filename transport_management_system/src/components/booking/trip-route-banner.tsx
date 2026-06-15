"use client";

import { ArrowRight, Bus, Clock, Route } from "lucide-react";
import { RouteMap } from "@/components/map/route-map";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { formatDriveDuration } from "@/lib/maps/route-distance";

interface TripRouteBannerProps {
  origin: string;
  destination: string;
  isWithin: boolean;
  distanceKm?: number;
  driveDurationMinutes?: number;
  departureAt?: string;
  arrivalAt?: string;
  companyName?: string;
  fare?: number;
  plateNumber?: string;
  vehicleLabel?: string;
  /** card = map in header right; page = map below details */
  layout?: "card" | "page";
}

function estimateDurationFromDistance(distanceKm: number) {
  const minutes = Math.max(1, Math.round((distanceKm / 55) * 60));
  return formatDriveDuration(minutes);
}

export function TripRouteBanner({
  origin,
  destination,
  isWithin,
  distanceKm,
  driveDurationMinutes,
  departureAt,
  arrivalAt,
  companyName,
  fare,
  plateNumber,
  vehicleLabel,
  layout = "page",
}: TripRouteBannerProps) {
  const isCard = layout === "card";
  const driveLabel =
    driveDurationMinutes != null
      ? formatDriveDuration(driveDurationMinutes)
      : distanceKm != null
        ? estimateDurationFromDistance(distanceKm)
        : null;

  const statsGrid = (
    <div
      className={`grid gap-x-6 text-emerald-100 sm:grid-cols-2 ${
        isCard ? "mt-4 gap-y-3 text-xs sm:text-sm" : "mt-5 gap-x-8 gap-y-4 text-sm sm:text-base"
      }`}
    >
      {distanceKm != null && (
        <div className="space-y-1">
          <p
            className={`uppercase tracking-wide text-emerald-200/80 ${
              isCard ? "text-[10px]" : "text-xs"
            }`}
          >
            Distance
          </p>
          <p>
            <strong className={`text-white ${isCard ? "text-base" : "text-lg"}`}>
              {distanceKm} km
            </strong>
            <span className="ml-1.5 text-emerald-100">road distance</span>
          </p>
        </div>
      )}
      {driveLabel != null && (
        <div className="space-y-1">
          <p
            className={`uppercase tracking-wide text-emerald-200/80 ${
              isCard ? "text-[10px]" : "text-xs"
            }`}
          >
            Est. drive
          </p>
          <p className={`font-medium text-white ${isCard ? "text-base" : "text-lg"}`}>
            ~{driveLabel}
          </p>
        </div>
      )}
      {departureAt && (
        <div className="space-y-1">
          <p
            className={`uppercase tracking-wide text-emerald-200/80 ${
              isCard ? "text-[10px]" : "text-xs"
            }`}
          >
            Departure
          </p>
          <p className={`flex items-start gap-1.5 font-medium text-white ${isCard ? "" : "text-base"}`}>
            <Clock className={`mt-0.5 shrink-0 ${isCard ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
            <span>{formatDateTime(departureAt)}</span>
          </p>
        </div>
      )}
      {arrivalAt && (
        <div className="space-y-1">
          <p
            className={`uppercase tracking-wide text-emerald-200/80 ${
              isCard ? "text-[10px]" : "text-xs"
            }`}
          >
            Arrival
          </p>
          <p className={`font-medium text-white ${isCard ? "" : "text-base"}`}>
            {formatDateTime(arrivalAt)}
          </p>
        </div>
      )}
    </div>
  );

  const operatorRow =
    companyName || plateNumber || vehicleLabel || fare != null ? (
      <div
        className={`flex flex-wrap items-center gap-2 border-t border-white/15 ${
          isCard ? "mt-4 pt-4" : "mt-6 pt-5"
        }`}
      >
        {companyName && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-white/15 font-medium ${
              isCard ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs sm:text-sm"
            }`}
          >
            <Bus className={isCard ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {companyName}
          </span>
        )}
        {plateNumber && (
          <span
            className={`rounded-full bg-white/15 font-medium ${
              isCard ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs sm:text-sm"
            }`}
          >
            {plateNumber}
          </span>
        )}
        {vehicleLabel && (
          <span
            className={`rounded-full bg-white/15 font-medium ${
              isCard ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs sm:text-sm"
            }`}
          >
            {vehicleLabel}
          </span>
        )}
        {fare != null && (
          <span
            className={`ml-auto rounded-full bg-white font-bold text-emerald-800 ${
              isCard ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm sm:text-base"
            }`}
          >
            {formatCurrency(fare)}
          </span>
        )}
      </div>
    ) : null;

  const info = (
    <div
      className={`min-w-0 ${
        isCard
          ? "flex h-full flex-col justify-center p-5 sm:p-6"
          : "flex flex-col p-6 sm:p-8"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={`bg-white/15 text-white hover:bg-white/15 ${
            isCard ? "text-[10px]" : "text-xs"
          }`}
        >
          <Route className="mr-1 h-3 w-3" />
          Trip Route
        </Badge>
        <Badge
          className={`bg-white/20 text-white hover:bg-white/20 ${
            isCard ? "text-[10px]" : "text-xs"
          }`}
        >
          {isWithin ? "Within Yobe" : "Outside Yobe"}
        </Badge>
      </div>

      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${isCard ? "mt-3" : "mt-4"}`}>
        <span
          className={`font-bold ${isCard ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}
        >
          {origin}
        </span>
        <ArrowRight
          className={`shrink-0 text-emerald-200 ${isCard ? "h-5 w-5" : "h-7 w-7 sm:h-8 sm:w-8"}`}
        />
        <span
          className={`font-bold ${isCard ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}
        >
          {destination}
        </span>
      </div>

      {statsGrid}
      {operatorRow}
    </div>
  );

  const map = (
    <RouteMap
      origin={origin}
      destination={destination}
      compact
      mini={isCard}
      showGoogleButton
    />
  );

  if (isCard) {
    return (
      <div className="border-b border-emerald-700/30 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white md:grid md:min-h-[220px] md:grid-cols-[45%_minmax(1.25rem,1fr)_38%] md:items-stretch">
        <div className="min-w-0">{info}</div>
        <div className="hidden md:block" aria-hidden />
        <div className="flex min-w-0 flex-col justify-center border-t border-white/10 bg-white/5 p-3 sm:p-4 md:border-l md:border-t-0">
          {map}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white">{info}</div>
      <div className="bg-slate-50 p-5 sm:p-6">{map}</div>
    </div>
  );
}
