import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { BookingsList } from "@/components/booking/bookings-list";

export default async function BookingsPage() {
  const session = await getCurrentUser();
  if (!session?.user) redirect("/login?redirect=/bookings");

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      `
      *,
      schedule:schedules(
        departure_at,
        route:routes(origin, destination, company:companies(name))
      ),
      ticket:tickets(ticket_code)
    `
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">My Bookings</h1>
      <BookingsList bookings={(data ?? []) as Parameters<typeof BookingsList>[0]["bookings"]} />
    </div>
  );
}
