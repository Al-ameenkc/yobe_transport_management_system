import { NextResponse } from "next/server";
import { parseSmartSearch } from "@/lib/ai";
import { YOBE_ORIGIN, todayDateString } from "@/lib/constants/routes";

export async function POST(request: Request) {
  const { query } = await request.json();
  const parsed = await parseSmartSearch(query);

  if (!parsed?.destination) {
    return NextResponse.json(
      { error: "Could not parse destination" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    origin: YOBE_ORIGIN,
    destination: parsed.destination,
    date: parsed.date || todayDateString(),
  });
}
