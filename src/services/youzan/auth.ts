import { YouzanClient } from "./client";
import { readConfig } from "@/lib/config";

export async function checkCookieStatus(): Promise<{
  valid: boolean;
  reason: string | null;
  updatedAt: string | null;
}> {
  const config = readConfig();
  if (!config.cookie) {
    return { valid: false, reason: "no_cookie", updatedAt: null };
  }
  if (!config.csrfToken) {
    return { valid: false, reason: "no_csrf_token", updatedAt: null };
  }
  const client = new YouzanClient(config.cookie, config.csrfToken);
  const valid = await client.checkCookieValid();
  return {
    valid,
    reason: valid ? null : "expired",
    updatedAt: config.cookieUpdatedAt || null,
  };
}
