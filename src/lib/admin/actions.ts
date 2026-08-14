"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient, isAdminPasswordAuthenticated } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import {
  getVehicleConfig,
  getVehicleLabel,
  getVehicleSeatLayout,
  type VehicleType,
} from "@/lib/constants/vehicles";
import { isYobeLGA } from "@/lib/constants/lgas";
import { createServiceClient } from "@/lib/supabase/server";

async function requireStaff() {
  const adminAuth = await isAdminPasswordAuthenticated();

  if (adminAuth) {
    const supabase = await getAdminClient();
    return { supabase, user: null, profile: { role: "admin" as const, company_id: null } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Not authorized");
  }

  return { supabase, user, profile };
}

export async function createBus(formData: FormData) {
  const { supabase, profile } = await requireStaff();

  const vehicleType = (formData.get("vehicle_type") as VehicleType) || "bus";
  const config = getVehicleConfig(vehicleType);

  const { error } = await supabase.from("buses").insert({
    company_id: (formData.get("company_id") as string) || profile.company_id!,
    plate_number: formData.get("plate_number") as string,
    model: getVehicleLabel(vehicleType),
    vehicle_type: vehicleType,
    capacity: config.capacity,
    seat_layout: getVehicleSeatLayout(vehicleType),
    status: (formData.get("status") as "active") || "active",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/buses");
}

export async function deleteBus(id: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("buses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/buses");
}

export async function createRoute(formData: FormData) {
  const { supabase, profile } = await requireStaff();

  const origin = formData.get("origin") as string;
  const destination = formData.get("destination") as string;
  const route_scope =
    isYobeLGA(origin) && isYobeLGA(destination) ? "within_yobe" : "outside_yobe";

  const { error } = await supabase.from("routes").insert({
    company_id: (formData.get("company_id") as string) || profile.company_id!,
    origin,
    destination,
    distance_km: parseFloat(formData.get("distance_km") as string),
    base_fare: parseFloat(formData.get("base_fare") as string),
    route_scope,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/routes");
}

export async function deleteRoute(id: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("routes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/routes");
}

export async function createSchedule(formData: FormData) {
  const { supabase } = await requireStaff();

  const { error } = await supabase.from("schedules").insert({
    route_id: formData.get("route_id") as string,
    bus_id: formData.get("bus_id") as string,
    departure_at: formData.get("departure_at") as string,
    arrival_at: formData.get("arrival_at") as string,
    fare_override: formData.get("fare_override")
      ? parseFloat(formData.get("fare_override") as string)
      : null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/schedules");
}

export async function deleteSchedule(id: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/schedules");
}

export async function createDriver(formData: FormData) {
  const { supabase, profile } = await requireStaff();

  const { error } = await supabase.from("drivers").insert({
    company_id: (formData.get("company_id") as string) || profile.company_id!,
    full_name: formData.get("full_name") as string,
    license_number: formData.get("license_number") as string,
    phone: formData.get("phone") as string,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/drivers");
}

export async function deleteDriver(id: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/drivers");
}

export async function adminCancelBooking(bookingId: string) {
  await requireStaff();
  const supabase = await createServiceClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) throw new Error("Booking not found");
  if (booking.status === "cancelled") return;
  if (booking.status !== "confirmed") {
    throw new Error("Only confirmed bookings can be cancelled");
  }

  const { data: seatRows } = await supabase
    .from("booking_seats")
    .select("seat_id")
    .eq("booking_id", bookingId);

  const seatIds = (seatRows ?? []).map((row) => row.seat_id);
  if (seatIds.length) {
    const { error: seatError } = await supabase
      .from("seats")
      .update({ status: "available", held_by: null, hold_expires_at: null })
      .in("id", seatIds);
    if (seatError) throw new Error(seatError.message);
  }

  const { error: cancelError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (cancelError) throw new Error(cancelError.message);

  await supabase
    .from("payments")
    .update({ status: "refunded" })
    .eq("booking_id", bookingId)
    .eq("status", "success");

  revalidatePath("/admin/bookings");
  revalidatePath("/bookings");
}

export async function updateUserRole(userId: string, role: string) {
  const { supabase } = await requireStaff();

  const { error } = await supabase
    .from("profiles")
    .update({ role: role as "passenger" | "staff" | "admin" })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/dashboard");
}
