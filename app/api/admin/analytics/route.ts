import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { analyticsConfigured, getAnalyticsReport } from "@/lib/ga-report";

export const dynamic = "force-dynamic";

function isDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export async function GET(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Log in again." }, { status: 401 });
  }
  if (!analyticsConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const params = request.nextUrl.searchParams;
  const start = params.get("start");
  const end = params.get("end");
  if (!isDate(start) || !isDate(end) || start > end) {
    return NextResponse.json({ error: "Pick a start date and an end date." }, { status: 400 });
  }
  const span = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
  if (span > 366) {
    return NextResponse.json({ error: "Pick a range of a year or less." }, { status: 400 });
  }

  const exclude = params.get("exclude");
  if (exclude && exclude !== "greece") {
    return NextResponse.json({ error: "That filter is not available." }, { status: 400 });
  }

  try {
    const report = await getAnalyticsReport(start, end, { excludeGreece: exclude === "greece" });
    return NextResponse.json({ configured: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The numbers could not be loaded.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
