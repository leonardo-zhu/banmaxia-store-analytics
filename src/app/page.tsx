"use client";

import { useState, useEffect, useCallback } from "react";
import StatsGrid from "@/components/StatsGrid";
import CustomerPieChart from "@/components/CustomerPieChart";
import IncomeTrendChart from "@/components/IncomeTrendChart";
import ReportCard from "@/components/ReportCard";
import type { CompareReport } from "@/services/youzan/types";

interface ReportSummary {
  id: string;
  date: string;
  source: string;
  title: string;
  contentPreview: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<CompareReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);
  const [latestReport, setLatestReport] = useState<ReportSummary | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report/compare");
      if (res.status === 401) {
        setError("Cookie 或 CSRF Token 已失效，请在 config.json 中手动更新");
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

  const fetchLatestReport = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) return;
      const reports: ReportSummary[] = await res.json();
      if (reports.length > 0) setLatestReport(reports[0]);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLatestReport();
  }, [fetchData, fetchLatestReport]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          今日数据概览
          {data && <span className="text-base font-normal text-gray-500 ml-2">{data.date}</span>}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
          >
            刷新数据
          </button>
          <button
            onClick={async () => {
              setAnalyzing(true);
              setAnalyzeResult(null);
              try {
                const res = await fetch("/api/report/analyze", { method: "POST" });
                if (res.status === 401) {
                  setAnalyzeResult("Cookie 或 CSRF Token 已失效，请在 config.json 中手动更新");
                  return;
                }
                const json = await res.json();
                if (json.success) {
                  setAnalyzeResult(json.content);
                  fetchLatestReport();
                } else {
                  setAnalyzeResult(`分析失败: ${json.error}`);
                }
              } catch {
                setAnalyzeResult("分析请求失败");
              } finally {
                setAnalyzing(false);
              }
            }}
            disabled={analyzing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {analyzing ? "分析中..." : "手动分析"}
          </button>
        </div>
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
            <IncomeTrendChart data={data.incomeTrend || []} />
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

          {latestReport && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3">最新 AI 分析报告</h2>
              <ReportCard {...latestReport} />
            </div>
          )}

          {analyzeResult && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">分析报告</h3>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{analyzeResult}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
