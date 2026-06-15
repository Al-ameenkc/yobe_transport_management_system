"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  getLocationCoordinates,
  inferTripScope,
  YOBE_BOUNDS,
} from "@/lib/constants/locations";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps/google-maps";
import { fetchDrivingRoute, type LatLngTuple } from "@/lib/maps/osrm";
import "leaflet/dist/leaflet.css";

interface RouteMapClientProps {
  origin: string;
  destination: string;
  compact?: boolean;
  mini?: boolean;
  showGoogleButton?: boolean;
}

function FitRoute({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    const bounds = points.map(([lat, lng]) => [lat, lng] as [number, number]);
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: compactMaxZoom(points) });
  }, [points, map]);

  return null;
}

function compactMaxZoom(points: LatLngTuple[]) {
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  if (latSpan < 1.5 && lngSpan < 1.5) return 10;
  if (latSpan < 4 && lngSpan < 4) return 8;
  return 6;
}

export function RouteMapClient({
  origin,
  destination,
  compact = false,
  mini = false,
  showGoogleButton = true,
}: RouteMapClientProps) {
  const scope = inferTripScope(origin, destination);
  const from = getLocationCoordinates(origin);
  const to = getLocationCoordinates(destination);
  const [route, setRoute] = useState<LatLngTuple[] | null>(null);
  const [loading, setLoading] = useState(true);

  const height = mini ? 185 : compact ? 200 : 260;
  const googleUrl = getGoogleMapsDirectionsUrl(origin, destination);
  const title = scope === "within" ? "Yobe State" : "Nigeria";

  const defaultCenter: LatLngTuple =
    scope === "within"
      ? [(YOBE_BOUNDS.minLat + YOBE_BOUNDS.maxLat) / 2, (YOBE_BOUNDS.minLng + YOBE_BOUNDS.maxLng) / 2]
      : [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDrivingRoute(origin, destination).then((points) => {
      if (active) {
        setRoute(points);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [origin, destination]);

  const line = route ?? [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ];

  return (
    <div className={mini ? "space-y-1" : "space-y-2"}>
      <div className="flex items-center justify-between gap-1">
        {!mini && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Route — {title}
          </p>
        )}
        {mini && <span className="text-[9px] font-medium text-emerald-100">{title}</span>}
        {showGoogleButton && (
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={
              mini
                ? "inline-flex items-center rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] font-medium text-white hover:bg-white/25"
                : buttonVariants({ variant: "outline", size: "sm", className: "h-8 text-xs" })
            }
          >
            <ExternalLink className={mini ? "h-3 w-3" : "mr-1.5 h-3.5 w-3.5"} />
            {!mini && "Open in Google Maps"}
          </a>
        )}
      </div>

      <div
        className={`relative overflow-hidden rounded-lg border shadow-sm ${mini ? "border-white/20" : "border-slate-200"}`}
        style={{ height }}
      >
        {loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80">
            <Spinner size="md" />
          </div>
        )}
        <MapContainer
          center={defaultCenter}
          zoom={scope === "within" ? 9 : 6}
          className="h-full w-full"
          scrollWheelZoom={false}
          attributionControl={!compact}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={line} pathOptions={{ color: "#059669", weight: 5, opacity: 0.9 }} />
          <CircleMarker
            center={[from.lat, from.lng]}
            radius={compact ? 8 : 10}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#059669", fillOpacity: 1 }}
          />
          <CircleMarker
            center={[to.lat, to.lng]}
            radius={compact ? 8 : 10}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#dc2626", fillOpacity: 1 }}
          />
          <FitRoute points={line} />
        </MapContainer>
      </div>

      {!mini && (
        <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600">
          <span>
            <span className="font-semibold text-emerald-700">{origin}</span>
            <span className="text-slate-400"> → </span>
            <span className="font-semibold text-red-600">{destination}</span>
          </span>
        </div>
      )}
    </div>
  );
}
