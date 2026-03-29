import { NextResponse } from "next/server";
import { fetchCompareReport } from "@/services/youzan/apis/aggregator";
import { saveReport } from "@/lib/reports";
import { today } from "@/lib/date-utils";
import type { StoredReport } from "@/services/youzan/types";

function generateAnalysis(report: Awaited<ReturnType<typeof fetchCompareReport>>): string {
  const { current, comparison } = report;
  const { income, acquisition } = current;
  const wow = comparison.weekOverWeek;

  const fmt = (v: number) => v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const trend = (field: string) => {
    const item = wow[field];
    if (!item || item.change === 0) return "";
    const arrow = item.change > 0 ? "↑" : "↓";
    return ` (${arrow}${Math.abs(item.change * 100).toFixed(1)}%)`;
  };

  const date = new Date(report.date);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const memberPct = income.customerBreakdown.member.percentage;
  const nonMemberPct = income.customerBreakdown.nonMember.percentage;

  return [
    `斑马侠散酒铺 · ${month}月${day}日日报`,
    "",
    `营收：¥${fmt(income.payAmount)}${trend("payAmount")}`,
    `客户：${income.payCustomerCount}人${trend("payCustomerCount")}`,
    `订单：${income.payOrderCount}单`,
    `客单价：¥${fmt(income.avgOrderAmount)}${trend("avgOrderAmount")}`,
    `连带率：${income.jointRate}${trend("jointRate")}`,
    `退款：¥${fmt(income.refundAmount)} (${income.refundOrderCount}单)`,
    "",
    `会员贡献 ${memberPct}%，非会员 ${nonMemberPct}%`,
    "",
    `新增会员：${acquisition.newMemberCount}人`,
  ].join("\n");
}

export async function POST() {
  try {
    const date = today();
    const report = await fetchCompareReport(date);
    const content = generateAnalysis(report);

    const d = new Date(date);
    const title = `${d.getMonth() + 1}月${d.getDate()}日日报分析`;

    const stored: StoredReport = {
      id: `${date}-manual`,
      date,
      source: "manual",
      createdAt: new Date().toISOString(),
      title,
      content,
    };

    saveReport(stored);

    return NextResponse.json({ success: true, id: stored.id, content });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "NO_COOKIE" || message === "COOKIE_EXPIRED") {
      return NextResponse.json({ error: "Cookie expired" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
