import { NextResponse } from "next/server";
import { pollQRLogin, getActiveSession } from "@/services/youzan/auth";

export async function GET() {
  if (!getActiveSession()) {
    return NextResponse.json(
      { error: "No active QR session. Call POST /api/auth/qrcode first." },
      { status: 400 }
    );
  }

  try {
    const result = await pollQRLogin();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
