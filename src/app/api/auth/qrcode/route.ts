import { NextResponse } from "next/server";
import { YouzanClient } from "@/services/youzan/client";

// In-memory store for active QR sessions
let activeSession: {
  token: string;
  csrfToken: string;
  cookies: string;
  createdAt: number;
} | null = null;

export { activeSession };

export async function POST() {
  try {
    const { token, csrfToken, cookies } = await YouzanClient.getQRCodeToken();
    activeSession = { token, csrfToken, cookies, createdAt: Date.now() };

    // QR code URL for Youzan WeChat scan
    const qrUrl = `http://passport.youzan.com/scan-login?token=${token}&fromSource=SOURCE_PC`;

    return NextResponse.json({ token, qrUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
