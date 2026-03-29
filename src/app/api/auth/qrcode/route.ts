import { NextResponse } from "next/server";
import { startQRLogin } from "@/services/youzan/auth";

export async function POST() {
  try {
    const result = await startQRLogin();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
