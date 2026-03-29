import { YouzanClient } from "./client";
import { readConfig, writeConfig } from "@/lib/config";

export interface QRSession {
  token: string;
  csrfToken: string;
  cookies: string;
  createdAt: number;
}

const SESSION_TTL_MS = 5 * 60 * 1000;

let activeSession: QRSession | null = null;

export function getActiveSession(): QRSession | null {
  if (!activeSession) return null;
  if (Date.now() - activeSession.createdAt > SESSION_TTL_MS) {
    activeSession = null;
    return null;
  }
  return activeSession;
}

export async function checkCookieStatus(): Promise<{
  valid: boolean;
  reason: string | null;
  updatedAt: string | null;
}> {
  const config = readConfig();
  if (!config.cookie) {
    return { valid: false, reason: "no_cookie", updatedAt: null };
  }
  const client = new YouzanClient(config.cookie);
  const valid = await client.checkCookieValid();
  return {
    valid,
    reason: valid ? null : "expired",
    updatedAt: config.cookieUpdatedAt || null,
  };
}

export async function startQRLogin(): Promise<{ token: string; qrUrl: string }> {
  const { token, csrfToken, cookies } = await YouzanClient.getQRCodeToken();
  activeSession = { token, csrfToken, cookies, createdAt: Date.now() };
  const qrUrl = `http://passport.youzan.com/scan-login?token=${token}&fromSource=SOURCE_PC`;
  return { token, qrUrl };
}

export async function pollQRLogin(): Promise<{ status: "waiting" | "success" | "expired" }> {
  const session = getActiveSession();
  if (!session) {
    return { status: "expired" };
  }

  const result = await YouzanClient.pollQRCodeLogin(
    session.token,
    session.csrfToken,
    session.cookies
  );

  if (result.success && result.cookie) {
    const config = readConfig();
    config.cookie = result.cookie;
    config.cookieUpdatedAt = new Date().toISOString();
    writeConfig(config);
    activeSession = null;
    return { status: "success" };
  }

  return { status: "waiting" };
}
