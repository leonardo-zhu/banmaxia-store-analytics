import { extractIncomeData, extractComparisonItem } from "@/services/youzan/apis/aggregator";

describe("aggregator", () => {
  test("extractIncomeData maps raw Youzan response to DailyReport income", () => {
    const raw = {
      allIncomeIndexModel: {
        payAmount: 137014,
        payCount: 38,
        payUvOfPeriod: 33,
        amountPerUser: 4152,
        amountPerCount: 3606,
        amountPerGoods: 2447,
        jointRate: 1.7,
        tradeAmount: 135024,
        refundAmount: 1990,
        refundCount: 1,
        refundUvOfPeriod: 1,
      },
    };

    const result = extractIncomeData(raw);
    expect(result.payAmount).toBeCloseTo(1370.14);
    expect(result.revenue).toBeCloseTo(1350.24);
    expect(result.payCustomerCount).toBe(33);
    expect(result.payOrderCount).toBe(38);
    expect(result.avgOrderAmount).toBeCloseTo(41.52);
    expect(result.jointRate).toBe(1.7);
  });

  test("extractComparisonItem creates correct comparison", () => {
    const result = extractComparisonItem(1370.14, 875.10);
    expect(result.value).toBe(875.10);
    expect(result.change).toBeCloseTo(0.5657, 2);
    expect(result.direction).toBe("up");
  });

  test("extractComparisonItem handles decrease", () => {
    const result = extractComparisonItem(800, 1000);
    expect(result.direction).toBe("down");
    expect(result.change).toBeCloseTo(-0.2, 2);
  });

  test("extractComparisonItem handles zero base", () => {
    const result = extractComparisonItem(100, 0);
    expect(result.direction).toBe("up");
    expect(result.change).toBe(0);
  });
});
