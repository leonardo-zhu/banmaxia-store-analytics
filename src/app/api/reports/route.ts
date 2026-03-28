import { NextRequest, NextResponse } from "next/server";
import { listReports, saveReport } from "@/lib/reports";
import type { StoredReport } from "@/services/youzan/types";

export async function GET() {
  const reports = listReports();
  // Return list without full content for performance
  const summaries = reports.map(({ content, ...rest }) => ({
    ...rest,
    contentPreview: content.substring(0, 200),
  }));
  return NextResponse.json(summaries);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StoredReport;

    if (!body.id || !body.date || !body.source || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: id, date, source, content" },
        { status: 400 }
      );
    }

    const report: StoredReport = {
      id: body.id,
      date: body.date,
      source: body.source,
      createdAt: body.createdAt || new Date().toISOString(),
      title: body.title || `${body.date} 分析报告`,
      content: body.content,
    };

    saveReport(report);

    return NextResponse.json({ success: true, id: report.id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
