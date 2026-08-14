import { Suspense } from "react";
import { Search, Shield, Ticket, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchForm } from "@/components/search/search-form";
import { TodaySchedules } from "@/components/home/today-schedules";
import { BusScheduleListSkeleton } from "@/components/loading/bus-schedule-skeleton";
import { getYobeDestinations, getYobeLGAsList } from "@/lib/booking/queries";

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-4 py-10 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            YOBE LINE Bus Booking
          </h1>
          <p className="mt-4 text-base text-emerald-100 sm:text-lg">
            Travel within Yobe (between LGAs) or outside to Abuja, Kano, Kaduna, and other
            states. View today&apos;s buses, pick your seat, and get your e-ticket instantly.
          </p>
          <div className="mt-8">
            <SearchForm destinations={getYobeDestinations()} lgas={getYobeLGAsList()} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<BusScheduleListSkeleton count={3} />}>
          <TodaySchedules />
        </Suspense>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Why Use YOBE LINE?
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Search, title: "See Buses Instantly", desc: "Today's departures shown without searching" },
            { icon: Ticket, title: "Flight-style Seats", desc: "2D seat map — see what's free before you book" },
            { icon: Shield, title: "Secure Payments", desc: "Paystack & card payments supported" },
            { icon: Clock, title: "Live Availability", desc: "Real-time seat updates as others book" },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6">
                <Icon className="h-8 w-8 text-emerald-600" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
