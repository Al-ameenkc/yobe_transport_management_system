"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
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
  provider = "offline",
  passengerPhone?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const rpcArgs: Record<string, unknown> = {
    p_schedule_id: scheduleId,
    p_seat_ids: seatIds,
    p_user_id: user.id,
    p_payment_ref: paymentRef,
    p_amount: amount,
    p_provider: provider,
  };

  if (passengerPhone) {
    rpcArgs.p_passenger_phone = passengerPhone;
  }

  let { data, error } = await supabase.rpc("confirm_booking", rpcArgs);

  if (error?.message?.includes("p_passenger_phone")) {
    ({ data, error } = await supabase.rpc("confirm_booking", {
      p_schedule_id: scheduleId,
      p_seat_ids: seatIds,
      p_user_id: user.id,
      p_payment_ref: paymentRef,
      p_amount: amount,
      p_provider: provider,
    }));
  }

  if (error) throw new Error(error.message);

  const booking = data?.[0];
  if (booking?.booking_id && passengerPhone) {
    const service = await createServiceClient();
    const { error: phoneError } = await service
      .from("bookings")
      .update({ passenger_phone: passengerPhone })
      .eq("id", booking.booking_id);

    if (phoneError) {
      await service.from("audit_logs").insert({
        user_id: user.id,
        action: "booking_contact",
        entity_type: "booking",
        entity_id: booking.booking_id,
        metadata: { passenger_phone: passengerPhone },
      });
    }
  }

  revalidatePath("/bookings");
  return booking;
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
