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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Today&apos;s Buses
          </h2>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {todaySchedules.length} bus{todaySchedules.length !== 1 ? "es" : ""} available — seat
            maps shown below
          </p>
        </div>
        <Link href="/search" className="shrink-0">
          <Button variant="outline" className="w-full sm:w-auto">View All</Button>
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
