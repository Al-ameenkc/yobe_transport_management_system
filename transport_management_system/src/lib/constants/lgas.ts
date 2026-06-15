/** Yobe State Local Government Areas */
export const YOBE_LGAS = [
  "Bade",
  "Bursari",
  "Damaturu",
  "Fika",
  "Fune",
  "Geidam",
  "Gujba",
  "Gulani",
  "Jakusko",
  "Karasuwa",
  "Machina",
  "Nangere",
  "Nguru",
  "Potiskum",
  "Tarmuwa",
  "Yunusari",
  "Yusufari",
] as const;

export type YobeLGA = (typeof YOBE_LGAS)[number];

/** Approximate coordinates (lat, lng) for map display */
export const LGA_COORDINATES: Record<YobeLGA, { lat: number; lng: number }> = {
  Bade: { lat: 12.88, lng: 10.78 },
  Bursari: { lat: 12.75, lng: 11.2 },
  Damaturu: { lat: 11.75, lng: 11.96 },
  Fika: { lat: 11.68, lng: 11.52 },
  Fune: { lat: 11.55, lng: 11.85 },
  Geidam: { lat: 12.89, lng: 11.93 },
  Gujba: { lat: 11.43, lng: 11.92 },
  Gulani: { lat: 11.32, lng: 11.63 },
  Jakusko: { lat: 12.75, lng: 11.03 },
  Karasuwa: { lat: 13.12, lng: 10.58 },
  Machina: { lat: 13.08, lng: 11.85 },
  Nangere: { lat: 11.85, lng: 11.35 },
  Nguru: { lat: 12.88, lng: 10.45 },
  Potiskum: { lat: 11.71, lng: 11.08 },
  Tarmuwa: { lat: 12.02, lng: 11.78 },
  Yunusari: { lat: 13.33, lng: 11.42 },
  Yusufari: { lat: 13.25, lng: 10.92 },
};

export function isYobeLGA(value: string): value is YobeLGA {
  return (YOBE_LGAS as readonly string[]).includes(value);
}

export function getYobeLGAs() {
  return [...YOBE_LGAS];
}
