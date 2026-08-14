import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BusScheduleCard } from "@/components/booking/bus-schedule-card";
import {
  getAvailableSchedules,
  getScheduleFare,
} from "@/lib/booking/queries";

export async function TodaySchedules() {
  const todaySchedules = await getAvailableSchedules().catch(() => []);
  const previewSchedules = todaySchedules.slice(0, 3);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Today&apos;s Buses
          </h2>
          <p className="mt-1 text-slate-500">
            {todaySchedules.length} bus{todaySchedules.length !== 1 ? "es" : ""} available — seat
            maps shown below
          </p>
        </div>
        <Link href="/search">
          <Button variant="outline">View All</Button>
        </Link>
      </div>

      {previewSchedules.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed p-8 text-center text-slate-500">
          No buses scheduled for today yet.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {previewSchedules.map((schedule) => (
            <BusScheduleCard
              key={schedule.id}
              schedule={schedule}
              seats={schedule.seats ?? []}
              fare={getScheduleFare(schedule)}
            />
          ))}
        </div>
      )}
    </>
  );
}
