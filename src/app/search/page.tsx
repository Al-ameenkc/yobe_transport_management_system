import { SearchForm } from "@/components/search/search-form";
import { BusScheduleCard } from "@/components/booking/bus-schedule-card";
import {
  getAvailableSchedules,
  getYobeDestinations,
  getYobeLGAsList,
  getScheduleFare,
} from "@/lib/booking/queries";
import { YOBE_ORIGIN, todayDateString, type TripScope } from "@/lib/constants/routes";

interface SearchPageProps {
  searchParams: Promise<{
    scope?: TripScope;
    origin?: string;
    destination?: string;
    date?: string;
    vehicleType?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const today = todayDateString();
  const date = params.date || today;
  const scope: TripScope = params.scope === "within" ? "within" : "outside";
  const destinations = getYobeDestinations();
  const lgas = getYobeLGAsList();

  const schedules = await getAvailableSchedules({
    scope,
    origin: params.origin,
    destination: params.destination,
    date,
    vehicleType: params.vehicleType,
  }).catch(() => []);

  let heading: string;
  if (scope === "within") {
    if (params.origin && params.destination) {
      heading = `Buses from ${params.origin} to ${params.destination}`;
    } else if (params.origin) {
      heading = `Buses leaving ${params.origin}`;
    } else {
      heading = "All within-Yobe buses";
    }
  } else if (params.destination) {
    heading = `Buses from ${YOBE_ORIGIN} to ${params.destination}`;
  } else {
    heading = `All buses leaving ${YOBE_ORIGIN}`;
  }

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Available Buses</h1>
      <p className="mt-1 text-slate-500">
        {scope === "within" ? "Within Yobe State (LGA to LGA)" : "Outside Yobe (inter-state)"} —{" "}
        {dateLabel}
      </p>

      <div className="mt-6">
        <SearchForm
          destinations={destinations}
          lgas={lgas}
          defaultScope={scope}
          defaultOrigin={params.origin}
          defaultDestination={params.destination}
          defaultDate={date}
          defaultVehicleType={params.vehicleType}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">
          {heading} · {schedules.length} bus{schedules.length !== 1 ? "es" : ""}
        </h2>

        {schedules.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
            No buses scheduled for this date
            {params.destination ? ` to ${params.destination}` : ""}.
            <br />
            <span className="text-sm">Try another date, LGA, or destination.</span>
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {schedules.map((schedule) => (
              <BusScheduleCard
                key={schedule.id}
                schedule={schedule}
                seats={schedule.seats ?? []}
                fare={getScheduleFare(schedule)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
