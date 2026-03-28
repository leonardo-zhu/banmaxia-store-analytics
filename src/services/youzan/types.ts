export interface YouzanResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface IncomeIndexModel {
  payAmount: number;
  payCount: number;
  payUvOfPeriod: number;
  amountPerUser: number;
  amountPerCount: number;
  amountPerGoods: number;
  jointRate: number;
  tradeAmount: number;
  refundAmount: number;
  refundCount: number;
  refundUvOfPeriod: number;
  payAmountRateOfLastPeriod: number;
  payUvRateOfLastPeriod: number;
  amountPerUserRateOfLastPeriod: number;
  amountPerCountRateOfLastPeriod: number;
  jointRateRateOfLastPeriod: number;
  tradeAmountRateOfLastPeriod: number;
  tradeAmountOfLastPeriod: number;
  payUvOfLastPeriod: number;
  amountPerUserOfLastPeriod: number;
  amountPerCountOfLastPeriod: number;
  jointRateOfLastPeriod: number;
  amountPerGoodsOfLastPeriod: number;
}

export interface DailyReport {
  date: string;
  storeName: string;
  income: {
    payAmount: number;
    revenue: number;
    refundAmount: number;
    payCustomerCount: number;
    payOrderCount: number;
    avgOrderAmount: number;
    avgTransactionAmount: number;
    avgItemPrice: number;
    jointRate: number;
    refundCustomerCount: number;
    refundOrderCount: number;
    customerBreakdown: {
      member: { amount: number; percentage: number };
      nonMember: { amount: number; percentage: number };
      passerby: { amount: number; percentage: number };
    };
  };
  acquisition: {
    newMemberCount: number;
    channelDistribution: Record<string, number>;
  };
  repurchase: {
    repurchaseRate: number;
    frequencyDistribution: Record<string, number>;
    cycleAnalysis: Record<string, number>;
  };
}

export interface ComparisonItem {
  value: number;
  change: number;
  direction: "up" | "down" | "flat";
}

export interface CompareReport {
  date: string;
  current: DailyReport;
  comparison: {
    dayOverDay: Record<string, ComparisonItem>;
    weekOverWeek: Record<string, ComparisonItem>;
    monthOverMonth: Record<string, ComparisonItem>;
  };
}

export interface StoredReport {
  id: string;
  date: string;
  source: "claude" | "openclaw" | "manual";
  createdAt: string;
  title: string;
  content: string;
}
