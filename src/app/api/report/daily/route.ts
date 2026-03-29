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
      return NextResponse.json({ error: "Cookie 未配置，请在 config.json 中填写" }, { status: 401 });
    }
    if (message === "NO_CSRF_TOKEN") {
      return NextResponse.json({ error: "CSRF Token 未配置，请在 config.json 中填写" }, { status: 401 });
    }
    if (message === "COOKIE_EXPIRED") {
      return NextResponse.json({ error: "登录已过期，请重新复制 Cookie 和 CSRF Token 到 config.json" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
