export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return formatDate(new Date());
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00+08:00");
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function getYesterday(dateStr: string): string {
  return shiftDays(dateStr, -1);
}

export function getLastWeekSameDay(dateStr: string): string {
  return shiftDays(dateStr, -7);
}

export function getLastMonthSameDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+08:00");
  d.setMonth(d.getMonth() - 1);
  return formatDate(d);
}

export interface YouzanTimeParam {
  dateType: number;
  timeParam: { startDay: string; endDay: string };
  kdtIds: null;
  selectCustomerType: string;
}

export function buildTimeParam(dateStr: string): YouzanTimeParam {
  return {
    dateType: 1,
    timeParam: { startDay: dateStr, endDay: dateStr },
    kdtIds: null,
    selectCustomerType: "member",
  };
}

export function buildTimeRangeParam(startDate: string, endDate: string): YouzanTimeParam {
  return {
    dateType: 1,
    timeParam: { startDay: startDate, endDay: endDate },
    kdtIds: null,
    selectCustomerType: "member",
  };
}

export function getDaysAgo(dateStr: string, days: number): string {
  return shiftDays(dateStr, -days);
}
