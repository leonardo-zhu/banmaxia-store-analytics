"use client";

import { useState, useEffect, useCallback } from "react";
import StatsGrid from "@/components/StatsGrid";
import CustomerPieChart from "@/components/CustomerPieChart";
import IncomeTrendChart from "@/components/IncomeTrendChart";
import QRCodeModal from "@/components/QRCodeModal";
import type { CompareReport } from "@/services/youzan/types";

export default function DashboardPage() {
  const [data, setData] = useState<CompareReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report/compare");
      if (res.status === 401) {
        setShowQR(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <QRCodeModal open={showQR} onSuccess={() => { setShowQR(false); fetchData(); }} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          今日数据概览
          {data && <span className="text-base font-normal text-gray-500 ml-2">{data.date}</span>}
        </h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
        >
          刷新数据
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <StatsGrid
            data={data.current}
            comparison={data.comparison.weekOverWeek}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomerPieChart {...data.current.income.customerBreakdown} />
            <IncomeTrendChart data={[]} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">今日拉新</h3>
              <div className="text-3xl font-bold text-gray-900">
                {data.current.acquisition.newMemberCount}
              </div>
              <div className="text-sm text-gray-500">新增会员</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">营业收入</h3>
              <div className="text-3xl font-bold text-gray-900">
                ¥{data.current.income.revenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                退款 ¥{data.current.income.refundAmount}
                ({data.current.income.refundOrderCount}单)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
