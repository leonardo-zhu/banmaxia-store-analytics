import { YouzanClient } from "../client";
import { IncomeAPI } from "./income";
import { AcquisitionAPI } from "./acquisition";
import { RepurchaseAPI } from "./repurchase";
import type { DailyReport, ComparisonItem, CompareReport } from "../types";
import { readConfig } from "@/lib/config";
import {
  getYesterday,
  getLastWeekSameDay,
  getLastMonthSameDay,
} from "@/lib/date-utils";

// Convert Youzan cent values to yuan
function toYuan(cents: number): number {
  return Math.round(cents) / 100;
}

export function extractIncomeData(result: Record<string, unknown>): DailyReport["income"] {
  const m = result.allIncomeIndexModel as Record<string, number>;
  return {
    payAmount: toYuan(m.payAmount),
    revenue: toYuan(m.tradeAmount),
    refundAmount: toYuan(m.refundAmount),
    payCustomerCount: m.payUvOfPeriod,
    payOrderCount: m.payCount,
    avgOrderAmount: toYuan(m.amountPerUser),
    avgTransactionAmount: toYuan(m.amountPerCount),
    avgItemPrice: toYuan(m.amountPerGoods),
    jointRate: m.jointRate,
    refundCustomerCount: m.refundUvOfPeriod,
    refundOrderCount: m.refundCount,
    customerBreakdown: {
      member: { amount: 0, percentage: 0 },
      nonMember: { amount: 0, percentage: 0 },
      passerby: { amount: 0, percentage: 0 },
    },
  };
}

export function extractComparisonItem(
  current: number,
  previous: number
): ComparisonItem {
  const change = previous === 0 ? 0 : (current - previous) / previous;
  const direction: ComparisonItem["direction"] =
    current > previous ? "up" : current < previous ? "down" : "flat";
  return { value: previous, change, direction };
}

function createClient(): YouzanClient {
  const config = readConfig();
  if (!config.cookie) throw new Error("NO_COOKIE");
  return new YouzanClient(config.cookie);
}

export async function fetchDailyReport(date: string): Promise<DailyReport> {
  const client = createClient();
  const config = readConfig();
  const incomeAPI = new IncomeAPI(client);
  const acquisitionAPI = new AcquisitionAPI(client);
  const repurchaseAPI = new RepurchaseAPI(client);

  const [incomeTreeRes, customerPieRes, acquisitionRes, repurchaseRes] =
    await Promise.all([
      incomeAPI.getMemberIncomeTree(date),
      incomeAPI.fetchCustomerPie(date),
      acquisitionAPI.getOverview(date),
      repurchaseAPI.getGeneralView(date),
    ]);

  // Extract income
  const incomeResult = (incomeTreeRes.data as Record<string, unknown>)?.result as Record<string, unknown>;
  const income = extractIncomeData(incomeResult || {});

  // Extract customer breakdown from pie data
  const pieResult = customerPieRes.data as Record<string, unknown[]>;
  if (pieResult?.list) {
    for (const item of pieResult.list as Array<{ name: string; payAmount: number; payAmountRate: number }>) {
      const amount = toYuan(item.payAmount);
      const percentage = Math.round(item.payAmountRate * 10000) / 100;
      if (item.name === "会员") {
        income.customerBreakdown.member = { amount, percentage };
      } else if (item.name === "非会员") {
        income.customerBreakdown.nonMember = { amount, percentage };
      } else if (item.name === "流水客") {
        income.customerBreakdown.passerby = { amount, percentage };
      }
    }
  }

  // Extract acquisition
  const acqResult = acquisitionRes.data as Record<string, unknown>;
  const acquisition: DailyReport["acquisition"] = {
    newMemberCount: (acqResult?.newMemberCount as number) || 0,
    channelDistribution: {},
  };

  // Extract repurchase
  const repResult = repurchaseRes.data as Record<string, unknown>;
  const repurchase: DailyReport["repurchase"] = {
    repurchaseRate: (repResult?.repurchaseRate as number) || 0,
    frequencyDistribution: {},
    cycleAnalysis: {},
  };

  return {
    date,
    storeName: config.storeName,
    income,
    acquisition,
    repurchase,
  };
}

export async function fetchCompareReport(date: string): Promise<CompareReport> {
  const [current, yesterday, lastWeek, lastMonth] = await Promise.all([
    fetchDailyReport(date),
    fetchDailyReport(getYesterday(date)),
    fetchDailyReport(getLastWeekSameDay(date)),
    fetchDailyReport(getLastMonthSameDay(date)),
  ]);

  const fields = [
    "payAmount", "revenue", "payCustomerCount", "payOrderCount",
    "avgOrderAmount", "jointRate",
  ] as const;

  function buildComparison(prev: DailyReport): Record<string, ComparisonItem> {
    const result: Record<string, ComparisonItem> = {};
    for (const field of fields) {
      const c = current.income[field] as number;
      const p = prev.income[field] as number;
      result[field] = extractComparisonItem(c, p);
    }
    return result;
  }

  return {
    date,
    current,
    comparison: {
      dayOverDay: buildComparison(yesterday),
      weekOverWeek: buildComparison(lastWeek),
      monthOverMonth: buildComparison(lastMonth),
    },
  };
}
