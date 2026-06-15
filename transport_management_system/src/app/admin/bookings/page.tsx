import { Suspense } from "react";
import Link from "next/link";
import { getAdminBookings } from "@/lib/admin/queries";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { AdminPagination } from "@/components/admin/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface AdminBookingsPageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const { bookings, total, page, error } = await getAdminBookings(params);
  const toolbarParams = { q: params.q, status: params.status };

  return (
    <div>
      <h1 className="text-2xl font-bold">Booking Management</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search by ticket code, passenger name, route, or bus plate number.
      </p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <AdminListToolbar
            placeholder="Ticket code, passenger, route, bus plate…"
            statusOptions={[
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </Suspense>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 space-y-3">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              No bookings found. Bookings appear here after passengers complete payment.
            </CardContent>
          </Card>
        ) : (
          bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {b.origin} → {b.destination}
                  </p>
                  <p className="text-sm text-slate-500">
                    {b.passengerName}
                    {b.departureAt ? ` · ${formatDateTime(b.departureAt)}` : ""}
                  </p>
                  <p className="text-sm">
                    {b.ticketCode && `Ticket: ${b.ticketCode} · `}
                    {formatCurrency(b.total_amount)}
                  </p>
                  <Badge className="mt-1">{b.status}</Badge>
                </div>
                {b.status === "confirmed" && (
                  <Link href={`/tickets/${b.id}`}>
                    <Button variant="outline" size="sm">
                      View Ticket
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AdminPagination
        basePath="/admin/bookings"
        page={page}
        total={total}
        params={toolbarParams}
      />
    </div>
  );
}
