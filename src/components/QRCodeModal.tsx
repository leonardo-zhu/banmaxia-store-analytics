"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  open: boolean;
  onSuccess: () => void;
}

export default function QRCodeModal({ open, onSuccess }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "ready" | "waiting" | "success" | "expired" | "error">("loading");

  const startLogin = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/qrcode", { method: "POST" });
      const data = await res.json();
      if (data.qrUrl) {
        const dataUrl = await QRCode.toDataURL(data.qrUrl, { width: 256 });
        setQrDataUrl(dataUrl);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    startLogin();
  }, [open, startLogin]);

  // Poll for scan result
  useEffect(() => {
    if (status !== "ready" && status !== "waiting") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/qrcode/poll");
        const data = await res.json();
        if (data.status === "success") {
          setStatus("success");
          clearInterval(interval);
          onSuccess();
        } else if (data.status === "expired") {
          setStatus("expired");
          clearInterval(interval);
        } else {
          setStatus("waiting");
        }
      } catch {
        // ignore poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status, onSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">登录已过期，请扫码更新</h2>

        {status === "loading" && <p className="text-gray-500 py-16">加载中...</p>}

        {(status === "ready" || status === "waiting") && (
          <>
            <img src={qrDataUrl} alt="QR Code" className="mx-auto my-4 w-48 h-48" />
            <p className="text-gray-500">请使用微信扫描二维码</p>
            {status === "waiting" && <p className="text-blue-600 text-sm mt-1">等待扫码确认...</p>}
          </>
        )}

        {status === "success" && (
          <p className="text-green-600 py-16 text-lg">登录成功！</p>
        )}

        {status === "expired" && (
          <div className="py-8">
            <p className="text-gray-500 mb-4">二维码已过期</p>
            <button
              onClick={startLogin}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              重新生成
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="py-8">
            <p className="text-red-600 mb-4">获取二维码失败</p>
            <button
              onClick={startLogin}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
