"use client";

import { useState, useEffect, useCallback } from "react";
import QRCodeModal from "@/components/QRCodeModal";

interface AuthStatus {
  valid: boolean;
  reason: string | null;
  updatedAt: string | null;
}

export default function SettingsPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [showQR, setShowQR] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth/status");
    setAuthStatus(await res.json());
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div>
      <QRCodeModal open={showQR} onSuccess={() => { setShowQR(false); checkAuth(); }} />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">设置</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">登录状态</h2>

        {authStatus && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${authStatus.valid ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-gray-700">
                {authStatus.valid ? "Cookie 有效" : "Cookie 已失效"}
              </span>
            </div>

            {authStatus.updatedAt && (
              <p className="text-sm text-gray-500">
                上次更新: {new Date(authStatus.updatedAt).toLocaleString("zh-CN")}
              </p>
            )}

            {!authStatus.valid && (
              <button
                onClick={() => setShowQR(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
              >
                扫码更新 Cookie
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">系统信息</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>服务端口: 4927</p>
          <p>报告存储: reports/</p>
          <p>API 基础路径: http://localhost:4927/api</p>
        </div>
      </div>
    </div>
  );
}
