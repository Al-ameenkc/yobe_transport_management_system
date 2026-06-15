export const VEHICLE_TYPES = ["bus", "sienna", "sharon", "golf"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export interface SeatPosition {
  seatNumber: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface VehicleConfig {
  type: VehicleType;
  label: string;
  displayName: string;
  capacity: number;
  seatNumbers: string[];
  seats: SeatPosition[];
  driver: { x: number; y: number };
}

/** Evenly space `count` seats on one row (no middle gap). */
function row(count: number, y: number, labels: string[], w = 16, h = 9): SeatPosition[] {
  const step = 84 / (count + 1);
  return labels.map((seatNumber, i) => ({
    seatNumber,
    x: 8 + step * (i + 1),
    y,
    w,
    h,
  }));
}

const BUS_SEAT_NUMBERS = [
  "F1",
  "F2",
  "1A",
  "1B",
  "1C",
  "1D",
  "2A",
  "2B",
  "2C",
  "2D",
  "3A",
  "3B",
  "3C",
  "3D",
  "4A",
  "4B",
  "4C",
  "4D",
];

const GOLF_SEAT_NUMBERS = ["F1", "F2", "1A", "1B", "1C", "1D"];

const MINIVAN_SEAT_NUMBERS = ["F1", "F2", "M1", "M2", "M3", "M4", "B1", "B2", "B3"];

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  bus: {
    type: "bus",
    label: "Toyota Bus",
    displayName: "Toyota Bus (19-seater)",
    capacity: 18,
    seatNumbers: BUS_SEAT_NUMBERS,
    // Driver front-left; front row: 2 bookable; then 4×4 full-width rows
    driver: { x: 12, y: 10 },
    seats: [
      { seatNumber: "F1", x: 38, y: 10, w: 14, h: 9 },
      { seatNumber: "F2", x: 56, y: 10, w: 14, h: 9 },
      ...row(4, 26, ["1A", "1B", "1C", "1D"]),
      ...row(4, 40, ["2A", "2B", "2C", "2D"]),
      ...row(4, 54, ["3A", "3B", "3C", "3D"]),
      ...row(4, 68, ["4A", "4B", "4C", "4D"]),
    ],
  },
  golf: {
    type: "golf",
    label: "Golf",
    displayName: "Golf (7-seater)",
    capacity: 6,
    seatNumbers: GOLF_SEAT_NUMBERS,
    // Driver front-left; 2 front passengers; 4 back in one row
    driver: { x: 12, y: 14 },
    seats: [
      { seatNumber: "F1", x: 40, y: 14, w: 14, h: 10 },
      { seatNumber: "F2", x: 58, y: 14, w: 14, h: 10 },
      ...row(4, 58, ["1A", "1B", "1C", "1D"], 14, 10),
    ],
  },
  sienna: {
    type: "sienna",
    label: "Sienna",
    displayName: "Sienna (10-seater)",
    capacity: 9,
    seatNumbers: MINIVAN_SEAT_NUMBERS,
    driver: { x: 12, y: 12 },
    seats: [
      { seatNumber: "F1", x: 40, y: 12, w: 14, h: 9 },
      { seatNumber: "F2", x: 58, y: 12, w: 14, h: 9 },
      ...row(4, 38, ["M1", "M2", "M3", "M4"]),
      ...row(3, 62, ["B1", "B2", "B3"], 18, 9),
    ],
  },
  sharon: {
    type: "sharon",
    label: "Sharon",
    displayName: "Sharon (10-seater)",
    capacity: 9,
    seatNumbers: MINIVAN_SEAT_NUMBERS,
    driver: { x: 12, y: 12 },
    seats: [
      { seatNumber: "F1", x: 40, y: 12, w: 14, h: 9 },
      { seatNumber: "F2", x: 58, y: 12, w: 14, h: 9 },
      ...row(4, 38, ["M1", "M2", "M3", "M4"]),
      ...row(3, 62, ["B1", "B2", "B3"], 18, 9),
    ],
  },
};

export function getVehicleConfig(type: VehicleType): VehicleConfig {
  return VEHICLE_CONFIGS[type];
}

export function getVehicleSeatLayout(type: VehicleType) {
  const config = getVehicleConfig(type);
  return {
    vehicleType: type,
    seatNumbers: config.seatNumbers,
    rows: 0,
    cols: 0,
  };
}

export function normalizeVehicleType(value: string | null | undefined): VehicleType {
  const v = (value ?? "").toLowerCase();
  if (v === "bus" || v.includes("toyota bus") || v.includes("coaster") || v.includes("hiace")) {
    return "bus";
  }
  if (v === "golf") return "golf";
  if (v === "sienna") return "sienna";
  if (v === "sharon") return "sharon";
  return "bus";
}

export function getVehicleLabel(type: VehicleType): string {
  return VEHICLE_CONFIGS[type].label;
}
