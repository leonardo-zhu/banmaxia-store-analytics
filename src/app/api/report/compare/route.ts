import { NextRequest, NextResponse } from "next/server";
import { fetchCompareReport } from "@/services/youzan/apis/aggregator";
import { today } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || today();

  try {
    const report = await fetchCompareReport(date);
    return NextResponse.json(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "NO_COOKIE" || message === "COOKIE_EXPIRED") {
      return NextResponse.json({ error: "Cookie expired" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
