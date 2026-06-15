import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function BusScheduleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-24 w-full rounded-none" />
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="space-y-4 p-6">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <Skeleton className="mx-auto mb-3 h-3 w-32" />
            <Skeleton className="mx-auto h-[200px] w-full max-w-[260px] rounded-xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusScheduleListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <BusScheduleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <Skeleton className="mt-6 h-36 w-full max-w-4xl rounded-xl" />
      <Skeleton className="mt-8 h-6 w-64" />
      <div className="mt-4">
        <BusScheduleListSkeleton count={2} />
      </div>
    </div>
  );
}

export function BookingsListSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function TripPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-20 w-full rounded-xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export function TicketPageSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Skeleton className="h-[480px] w-full rounded-xl" />
      <div className="mt-4 flex justify-center gap-3">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}
