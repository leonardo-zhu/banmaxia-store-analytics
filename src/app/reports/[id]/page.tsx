"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { StoredReport } from "@/services/youzan/types";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then((r) => r.json())
      .then((data) => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">加载中...</p>;
  if (!report) return <p className="text-red-600">报告未找到</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
        <div className="text-sm text-gray-500 mt-1">
          {report.date} · {report.source} · {new Date(report.createdAt).toLocaleString("zh-CN")}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap">{report.content}</div>
      </div>
    </div>
  );
}
