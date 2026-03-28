import {
  formatDate,
  getYesterday,
  getLastWeekSameDay,
  getLastMonthSameDay,
  buildTimeParam,
} from "@/lib/date-utils";

describe("date-utils", () => {
  test("formatDate formats as YYYY-MM-DD", () => {
    const date = new Date("2026-03-27T10:00:00+08:00");
    expect(formatDate(date)).toBe("2026-03-27");
  });

  test("getYesterday returns previous day", () => {
    expect(getYesterday("2026-03-27")).toBe("2026-03-26");
  });

  test("getLastWeekSameDay returns 7 days before", () => {
    expect(getLastWeekSameDay("2026-03-27")).toBe("2026-03-20");
  });

  test("getLastMonthSameDay returns same day last month", () => {
    expect(getLastMonthSameDay("2026-03-27")).toBe("2026-02-27");
  });

  test("buildTimeParam creates correct structure", () => {
    expect(buildTimeParam("2026-03-27")).toEqual({
      dateType: 1,
      timeParam: { startDay: "2026-03-27", endDay: "2026-03-27" },
      kdtIds: null,
      selectCustomerType: "member",
    });
  });
});
