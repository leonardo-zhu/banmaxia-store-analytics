import { NextRequest, NextResponse } from "next/server";
import { fetchDailyReport } from "@/services/youzan/apis/aggregator";
import { today } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || today();

  try {
    const report = await fetchDailyReport(date);
    return NextResponse.json(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "NO_COOKIE") {
      return NextResponse.json({ error: "Cookie not configured" }, { status: 401 });
    }
    if (message === "COOKIE_EXPIRED") {
      return NextResponse.json({ error: "Cookie expired" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
