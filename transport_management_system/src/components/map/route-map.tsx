"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const RouteMapClient = dynamic(
  () => import("@/components/map/route-map-client").then((m) => m.RouteMapClient),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full rounded-xl" />,
  }
);

interface RouteMapProps {
  origin: string;
  destination: string;
  compact?: boolean;
  mini?: boolean;
  showGoogleButton?: boolean;
}

export function RouteMap(props: RouteMapProps) {
  return <RouteMapClient {...props} />;
}
