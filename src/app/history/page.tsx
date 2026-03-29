"use client";

import { useState, useCallback } from "react";
import DatePicker from "@/components/DatePicker";
import StatsGrid from "@/components/StatsGrid";
import CustomerPieChart from "@/components/CustomerPieChart";
import type { CompareReport } from "@/services/youzan/types";
import { formatDate, getYesterday } from "@/lib/date-utils";

export default function HistoryPage() {
  const [date, setDate] = useState(getYesterday(formatDate(new Date())));
  const [data, setData] = useState<CompareReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report/compare?date=${d}`);
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateChange = (d: string) => {
    setDate(d);
    fetchData(d);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">历史数据</h1>
        <DatePicker value={date} onChange={handleDateChange} />
      </div>

      {loading && <p className="text-gray-500">加载中...</p>}

      {data && (
        <div className="space-y-6">
          <StatsGrid data={data.current} comparison={data.comparison.weekOverWeek} />
          <CustomerPieChart {...data.current.income.customerBreakdown} />
        </div>
      )}
    </div>
  );
}
