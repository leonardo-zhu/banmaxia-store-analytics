import { NextResponse } from "next/server";
import { readConfig } from "@/lib/config";
import { YouzanClient } from "@/services/youzan/client";

export async function GET() {
  const config = readConfig();

  if (!config.cookie) {
    return NextResponse.json({
      valid: false,
      reason: "no_cookie",
      updatedAt: null,
    });
  }

  const client = new YouzanClient(config.cookie);
  const valid = await client.checkCookieValid();

  return NextResponse.json({
    valid,
    reason: valid ? null : "expired",
    updatedAt: config.cookieUpdatedAt || null,
  });
}
