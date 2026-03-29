import { NextResponse } from "next/server";
import { checkCookieStatus } from "@/services/youzan/auth";

export async function GET() {
  const status = await checkCookieStatus();
  return NextResponse.json(status);
}
