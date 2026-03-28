import type { YouzanResponse } from "./types";

const BASE_URL = "https://crm.youzan.com";
const ACCOUNT_URL = "https://account.youzan.com";

export class YouzanClient {
  cookie: string;

  constructor(cookie: string) {
    this.cookie = cookie;
  }

  buildHeaders(): Record<string, string> {
    return {
      Cookie: this.cookie,
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Referer: "https://crm.youzan.com/",
    };
  }

  async post<T>(path: string, body: object): Promise<YouzanResponse<T>> {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
      redirect: "manual",
    });
    if (res.status === 302 || res.status === 301) {
      throw new Error("COOKIE_EXPIRED");
    }
    if (!res.ok) {
      throw new Error(`Youzan API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<YouzanResponse<T>> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: this.buildHeaders(),
      redirect: "manual",
    });
    if (res.status === 302 || res.status === 301) {
      throw new Error("COOKIE_EXPIRED");
    }
    if (!res.ok) {
      throw new Error(`Youzan API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async checkCookieValid(): Promise<boolean> {
    try {
      const res = await this.get("/v2/dashboard/api/checkLocalLifeAbility.json");
      return res.code === 0;
    } catch {
      return false;
    }
  }

  static async getQRCodeToken(): Promise<{ token: string; csrfToken: string; cookies: string }> {
    const loginPageRes = await fetch(`${ACCOUNT_URL}/login`, { redirect: "manual" });
    const setCookies = loginPageRes.headers.getSetCookie?.() || [];
    const pageCookies = setCookies.map((c) => c.split(";")[0]).join("; ");
    const pageHtml = await loginPageRes.text();
    const csrfMatch = pageHtml.match(/csrf_token[=:][\s"']*([a-zA-Z0-9]+)/);
    const csrfToken = csrfMatch?.[1] || "";
    const qrRes = await fetch(
      `${ACCOUNT_URL}/api/login/qrcode-data.json?csrf_token=${csrfToken}`,
      { headers: { Cookie: pageCookies, Referer: `${ACCOUNT_URL}/login`, Accept: "application/json" } }
    );
    const qrData = (await qrRes.json()) as { code: number; data: { token: string } };
    return { token: qrData.data.token, csrfToken, cookies: pageCookies };
  }

  static async pollQRCodeLogin(token: string, csrfToken: string, cookies: string): Promise<{ success: boolean; cookie?: string }> {
    const res = await fetch(`${ACCOUNT_URL}/api/login/check-qrcode-is-login.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookies, Referer: `${ACCOUNT_URL}/login` },
      body: `token=${token}&csrf_token=${csrfToken}`,
      redirect: "manual",
    });
    const body = (await res.json()) as { code: number; msg: string };
    if (body.code === 0) {
      const setCookies = res.headers.getSetCookie?.() || [];
      const allCookies = [cookies, ...setCookies.map((c) => c.split(";")[0])].join("; ");
      return { success: true, cookie: allCookies };
    }
    return { success: false };
  }
}
