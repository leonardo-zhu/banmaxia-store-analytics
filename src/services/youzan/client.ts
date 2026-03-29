import type { YouzanResponse } from "./types";

const BASE_URL = "https://crm.youzan.com";

export class YouzanClient {
  cookie: string;
  csrfToken: string;

  constructor(cookie: string, csrfToken: string) {
    this.cookie = cookie;
    this.csrfToken = csrfToken;
  }

  buildHeaders(): Record<string, string> {
    return {
      Cookie: this.cookie,
      "Csrf-Token": this.csrfToken,
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Referer: "https://crm.youzan.com/",
    };
  }

  private checkYouzanResponse<T>(json: YouzanResponse<T>): YouzanResponse<T> {
    if (json.code !== 0) {
      throw new Error(`YOUZAN_API_ERROR:${json.code}:${json.msg ?? "unknown"}`);
    }
    return json;
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
    return this.checkYouzanResponse(await res.json());
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
    return this.checkYouzanResponse(await res.json());
  }

  async checkCookieValid(): Promise<boolean> {
    try {
      const res = await this.get("/v2/dashboard/api/checkLocalLifeAbility.json");
      return res.code === 0;
    } catch {
      return false;
    }
  }
}
