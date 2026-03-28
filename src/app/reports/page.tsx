"use client";

import { useState, useEffect } from "react";
import ReportCard from "@/components/ReportCard";

interface ReportSummary {
  id: string;
  date: string;
  source: string;
  title: string;
  contentPreview: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => { setReports(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">分析报告</h1>

      {loading && <p className="text-gray-500">加载中...</p>}

      {!loading && reports.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          暂无报告。等待 Claude 或 OpenClaw 生成第一份分析报告。
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <ReportCard key={r.id} {...r} />
        ))}
      </div>
    </div>
  );
}
