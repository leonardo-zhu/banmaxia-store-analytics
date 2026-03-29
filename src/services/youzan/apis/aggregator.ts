import { YouzanClient } from "../client";
import { IncomeAPI } from "./income";
import { AcquisitionAPI } from "./acquisition";
import { RepurchaseAPI } from "./repurchase";
import type { DailyReport, ComparisonItem, CompareReport, TrendDataPoint } from "../types";
import { readConfig } from "@/lib/config";
import {
  getYesterday,
  getLastWeekSameDay,
  getLastMonthSameDay,
  getDaysAgo,
} from "@/lib/date-utils";

// Convert Youzan cent values to yuan, treating nullish as 0
function toYuan(cents: number | undefined | null): number {
  return Math.round(cents ?? 0) / 100;
}

function num(v: number | undefined | null): number {
  return v ?? 0;
}

const EMPTY_BREAKDOWN = {
  member: { amount: 0, percentage: 0 },
  nonMember: { amount: 0, percentage: 0 },
  passerby: { amount: 0, percentage: 0 },
} as const;

export function extractIncomeData(result: Record<string, unknown>): DailyReport["income"] {
  const model = result?.allIncomeIndexModel as Record<string, number> | undefined;
  if (!model) {
    return {
      payAmount: 0, revenue: 0, refundAmount: 0,
      payCustomerCount: 0, payOrderCount: 0,
      avgOrderAmount: 0, avgTransactionAmount: 0, avgItemPrice: 0,
      jointRate: 0, refundCustomerCount: 0, refundOrderCount: 0,
      customerBreakdown: { ...EMPTY_BREAKDOWN },
    };
  }

  return {
    payAmount: toYuan(model.payAmount),
    revenue: toYuan(model.tradeAmount),
    refundAmount: toYuan(model.refundAmount),
    payCustomerCount: num(model.payUv),
    payOrderCount: num(model.payCount),
    avgOrderAmount: toYuan(model.amountPerUser),
    avgTransactionAmount: toYuan(model.amountPerCount),
    avgItemPrice: toYuan(model.amountPerGoods),
    jointRate: num(model.jointRate),
    refundCustomerCount: num(model.refundUvOfPeriod),
    refundOrderCount: num(model.refundCount),
    customerBreakdown: { ...EMPTY_BREAKDOWN },
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
  if (!config.csrfToken) throw new Error("NO_CSRF_TOKEN");
  return new YouzanClient(config.cookie, config.csrfToken);
}

export async function fetchDailyReport(date: string): Promise<DailyReport> {
  const client = createClient();
  const config = readConfig();
  const incomeAPI = new IncomeAPI(client);
  const acquisitionAPI = new AcquisitionAPI(client);
  const repurchaseAPI = new RepurchaseAPI(client);

  const [incomeTreeRes, acquisitionRes, repurchaseRes, channelRes, frequencyRes, cycleRes] =
    await Promise.all([
      incomeAPI.getMemberIncomeTree(date),
      acquisitionAPI.getOverview(date),
      repurchaseAPI.getGeneralView(date),
      acquisitionAPI.getChannelAndWayAnalysis(date),
      repurchaseAPI.getFrequencyAnalysis(date),
      repurchaseAPI.getCycleAnalysis(date),
    ]);

  // Extract income
  const incomeResult = (incomeTreeRes.data as Record<string, unknown>)?.result as Record<string, unknown>;
  const income = extractIncomeData(incomeResult || {});

  // Extract customer breakdown from getMemberIncomeTree result
  // memberIncomeIndexModel = 会员, notMemberIncomeIndexModel = 非会员, noneIncomeIndexModel = 流水客
  if (incomeResult) {
    const total = income.payAmount || 1;
    const memberModel = incomeResult.memberIncomeIndexModel as Record<string, number> | undefined;
    const nonMemberModel = incomeResult.notMemberIncomeIndexModel as Record<string, number> | undefined;
    const passerbyModel = incomeResult.noneIncomeIndexModel as Record<string, number> | undefined;

    const memberAmount = toYuan(memberModel?.tradeAmount);
    const nonMemberAmount = toYuan(nonMemberModel?.tradeAmount);
    const passerbyAmount = toYuan(passerbyModel?.tradeAmount);

    income.customerBreakdown = {
      member: { amount: memberAmount, percentage: Math.round(memberAmount / total * 10000) / 100 },
      nonMember: { amount: nonMemberAmount, percentage: Math.round(nonMemberAmount / total * 10000) / 100 },
      passerby: { amount: passerbyAmount, percentage: Math.round(passerbyAmount / total * 10000) / 100 },
    };
  }

  // Extract acquisition
  const acqResult = acquisitionRes.data as Record<string, unknown>;
  const channelDistribution: Record<string, number> = {};
  const channelData = channelRes.data as Record<string, unknown>;
  if (channelData?.list) {
    for (const item of channelData.list as Array<Record<string, unknown>>) {
      const name = (item.channelName || item.wayName || item.name) as string;
      const count = (item.newMemberCount || item.count || item.value || 0) as number;
      if (name) channelDistribution[name] = count;
    }
  }
  const acquisition: DailyReport["acquisition"] = {
    newMemberCount: (acqResult?.newMemberCount as number) || 0,
    channelDistribution,
  };

  // Extract repurchase
  const repResult = repurchaseRes.data as Record<string, unknown>;
  const frequencyDistribution: Record<string, number> = {};
  const freqData = frequencyRes.data as Record<string, unknown>;
  if (freqData?.list) {
    for (const item of freqData.list as Array<Record<string, unknown>>) {
      const label = (item.frequency || item.name || item.label) as string;
      const count = (item.customerCount || item.count || item.value || 0) as number;
      if (label) frequencyDistribution[label] = count;
    }
  }
  const cycleAnalysisData: Record<string, number> = {};
  const cycData = cycleRes.data as Record<string, unknown>;
  if (cycData?.list) {
    for (const item of cycData.list as Array<Record<string, unknown>>) {
      const label = (item.cycle || item.name || item.label) as string;
      const count = (item.customerCount || item.count || item.value || 0) as number;
      if (label) cycleAnalysisData[label] = count;
    }
  }
  const repurchase: DailyReport["repurchase"] = {
    repurchaseRate: (repResult?.repurchaseRate as number) || 0,
    frequencyDistribution,
    cycleAnalysis: cycleAnalysisData,
  };

  return {
    date,
    storeName: config.storeName,
    income,
    acquisition,
    repurchase,
  };
}

function extractIncomeTrend(data: unknown): TrendDataPoint[] {
  const result = data as Record<string, unknown>;
  const list = result?.list as Array<Record<string, unknown>> | undefined;
  if (!list) return [];
  return list.map((item) => ({
    date: (item.date || item.day || "") as string,
    payAmount: toYuan((item.payAmount as number) ?? 0),
  })).filter((p) => p.date);
}

export async function fetchCompareReport(date: string): Promise<CompareReport> {
  const client = createClient();
  const incomeAPI = new IncomeAPI(client);
  const trendStartDate = getDaysAgo(date, 6);

  const [current, yesterday, lastWeek, lastMonth, trendRes] = await Promise.all([
    fetchDailyReport(date),
    fetchDailyReport(getYesterday(date)),
    fetchDailyReport(getLastWeekSameDay(date)),
    fetchDailyReport(getLastMonthSameDay(date)),
    incomeAPI.getIncomeTrendRange(trendStartDate, date),
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

  const incomeTrend = extractIncomeTrend(trendRes.data);

  return {
    date,
    current,
    comparison: {
      dayOverDay: buildComparison(yesterday),
      weekOverWeek: buildComparison(lastWeek),
      monthOverMonth: buildComparison(lastMonth),
    },
    incomeTrend,
  };
}
