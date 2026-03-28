import { NextResponse } from "next/server";
import { YouzanClient } from "@/services/youzan/client";
import { readConfig, writeConfig } from "@/lib/config";

export async function GET() {
  const { activeSession } = await import("../route");

  if (!activeSession) {
    return NextResponse.json(
      { error: "No active QR session. Call POST /api/auth/qrcode first." },
      { status: 400 }
    );
  }

  // Session expires after 5 minutes
  if (Date.now() - activeSession.createdAt > 5 * 60 * 1000) {
    return NextResponse.json({ status: "expired" });
  }

  try {
    const result = await YouzanClient.pollQRCodeLogin(
      activeSession.token,
      activeSession.csrfToken,
      activeSession.cookies
    );

    if (result.success && result.cookie) {
      // Save new cookie to config
      const config = readConfig();
      config.cookie = result.cookie;
      config.cookieUpdatedAt = new Date().toISOString();
      writeConfig(config);

      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ status: "waiting" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
