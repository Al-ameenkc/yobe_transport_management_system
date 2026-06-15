import { getLocationCoordinates } from "@/lib/constants/locations";

export type LatLngTuple = [number, number];

export async function fetchDrivingRoute(
  origin: string,
  destination: string
): Promise<LatLngTuple[]> {
  const from = getLocationCoordinates(origin);
  const to = getLocationCoordinates(destination);

  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    if (!coords?.length) {
      return [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ];
    }
    return coords.map(([lng, lat]) => [lat, lng] as LatLngTuple);
  } catch {
    return [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ];
  }
}
