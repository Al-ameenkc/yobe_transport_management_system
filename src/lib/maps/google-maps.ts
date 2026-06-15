import { isYobeLGA } from "@/lib/constants/lgas";
import { YOBE_ORIGIN } from "@/lib/constants/routes";
import { inferTripScope } from "@/lib/constants/locations";

export function formatGoogleMapsPlace(name: string, role: "origin" | "destination") {
  if (isYobeLGA(name)) {
    return `${name}, Yobe State, Nigeria`;
  }
  if (name === YOBE_ORIGIN) {
    return "Damaturu, Yobe State, Nigeria";
  }
  if (role === "destination") {
    return `${name} State, Nigeria`;
  }
  return `${name}, Nigeria`;
}

export function getGoogleMapsDirectionsUrl(origin: string, destination: string) {
  const scope = inferTripScope(origin, destination);
  const originPlace = formatGoogleMapsPlace(origin, "origin");
  const destPlace = formatGoogleMapsPlace(destination, "destination");

  const params = new URLSearchParams({
    api: "1",
    origin: originPlace,
    destination: destPlace,
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function getGoogleMapsEmbedUrl(origin: string, destination: string) {
  const directionsUrl = getGoogleMapsDirectionsUrl(origin, destination);
  return `https://maps.google.com/maps?${new URLSearchParams({
    saddr: formatGoogleMapsPlace(origin, "origin"),
    daddr: formatGoogleMapsPlace(destination, "destination"),
    output: "embed",
  }).toString()}`;
}
