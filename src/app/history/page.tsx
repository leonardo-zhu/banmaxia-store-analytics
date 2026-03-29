"use client";

import { useState, useCallback, useEffect } from "react";
import DatePicker from "@/components/DatePicker";
import StatsGrid from "@/components/StatsGrid";
import CustomerPieChart from "@/components/CustomerPieChart";
import type { CompareReport } from "@/services/youzan/types";
import { formatDate, getYesterday } from "@/lib/date-utils";

export default function HistoryPage() {
  const [date, setDate] = useState(getYesterday(formatDate(new Date())));
  const [data, setData] = useState<CompareReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/report/compare?date=${d}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `请求失败（${res.status}）`);
        return;
      }
      setData(await res.json());
    } catch {
      setError("网络请求失败，请检查服务是否正常运行");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(date);
  }, [date, fetchData]);

  const handleDateChange = (d: string) => {
    setDate(d);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">历史数据</h1>
        <DatePicker value={date} onChange={handleDateChange} />
      </div>

      {loading && <p className="text-gray-500">加载中...</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <StatsGrid data={data.current} comparison={data.comparison.weekOverWeek} />
          <CustomerPieChart {...data.current.income.customerBreakdown} />
        </div>
      )}
    </div>
  );
}
