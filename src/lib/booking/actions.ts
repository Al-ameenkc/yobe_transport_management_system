"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function holdSeats(scheduleId: string, seatIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("hold_seats", {
    p_schedule_id: scheduleId,
    p_seat_ids: seatIds,
    p_user_id: user.id,
  });

  if (error) throw new Error(error.message);
  return data?.[0];
}

export async function confirmBooking(
  scheduleId: string,
  seatIds: string[],
  amount: number,
  paymentRef: string,
  provider = "mock"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("confirm_booking", {
    p_schedule_id: scheduleId,
    p_seat_ids: seatIds,
    p_user_id: user.id,
    p_payment_ref: paymentRef,
    p_amount: amount,
    p_provider: provider,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/bookings");
  return data?.[0];
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
    p_user_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/bookings");
  return data;
}
