# Banmaxia Store Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Next.js application that pulls data from Youzan CRM APIs, exposes structured data endpoints for AI agents, displays a dashboard, and manages QR-code-based cookie authentication.

**Architecture:** Next.js App Router with server-side data services. Youzan HTTP client wraps 24 CRM API endpoints with automatic cookie management. API routes expose aggregated data for Claude Code and OpenClaw agents. File-based report storage. Agent Skill document enables cross-agent data access.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts (charts), qrcode (QR generation)

---

## File Structure

```
banmaxia-store-analytics/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          — Root layout with nav
│   │   ├── page.tsx                            — Dashboard page (server component)
│   │   ├── history/page.tsx                    — Historical data page
│   │   ├── reports/page.tsx                    — Reports list page
│   │   ├── reports/[id]/page.tsx               — Single report page
│   │   ├── settings/page.tsx                   — Settings page
│   │   └── api/
│   │       ├── report/daily/route.ts           — GET daily structured data
│   │       ├── report/compare/route.ts         — GET comparison data
│   │       ├── auth/status/route.ts            — GET cookie validity
│   │       ├── auth/qrcode/route.ts            — POST start QR login
│   │       ├── auth/qrcode/poll/route.ts       — GET poll scan status
│   │       ├── reports/route.ts                — GET list / POST save
│   │       └── reports/[id]/route.ts           — GET single report
│   ├── components/
│   │   ├── StatCard.tsx                        — Single KPI card with trend
│   │   ├── StatsGrid.tsx                       — Grid of StatCards
│   │   ├── CustomerPieChart.tsx                — Member/non-member pie
│   │   ├── IncomeTrendChart.tsx                — 7-day income line chart
│   │   ├── QRCodeModal.tsx                     — QR code login modal
│   │   ├── ReportCard.tsx                      — Report list item
│   │   ├── Navbar.tsx                          — Top navigation bar
│   │   └── DatePicker.tsx                      — Date selector
│   ├── services/
│   │   └── youzan/
│   │       ├── client.ts                       — HTTP client with cookie
│   │       ├── auth.ts                         — Cookie mgmt + QR login
│   │       ├── types.ts                        — All type definitions
│   │       └── apis/
│   │           ├── income.ts                   — 7 income endpoints
│   │           ├── acquisition.ts              — 4 acquisition endpoints
│   │           ├── repurchase.ts               — 3 repurchase endpoints
│   │           ├── rfm.ts                      — 1 RFM endpoint
│   │           ├── persona.ts                  — 7 persona endpoints
│   │           ├── member.ts                   — 2 member endpoints
│   │           └── aggregator.ts               — Combines all into daily report
│   └── lib/
│       ├── config.ts                           — Read/write config.json
│       ├── reports.ts                          — Read/write report files
│       └── date-utils.ts                       — Date formatting + comparison helpers
├── __tests__/
│   ├── lib/
│   │   ├── config.test.ts
│   │   ├── reports.test.ts
│   │   └── date-utils.test.ts
│   ├── services/
│   │   └── youzan/
│   │       ├── client.test.ts
│   │       └── aggregator.test.ts
│   └── api/
│       ├── daily.test.ts
│       └── reports.test.ts
├── config.example.json                         — Example config (committed)
├── reports/                                    — AI reports (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── jest.config.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `jest.config.ts`, `config.example.json`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

Run from `~/Code/Personal/banmaxia-store-analytics`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

Select defaults when prompted. This creates the full Next.js scaffold.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install recharts qrcode
npm install -D @types/qrcode jest ts-jest @testing-library/react @testing-library/jest-dom @types/jest jest-environment-jsdom
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:

```typescript
import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

- [ ] **Step 4: Set port to 4927**

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev -p 4927",
    "start": "next start -p 4927"
  }
}
```

- [ ] **Step 5: Create example config**

Create `config.example.json`:

```json
{
  "cookie": "PASTE_YOUR_YOUZAN_COOKIE_HERE",
  "cookieUpdatedAt": "",
  "port": 4927,
  "storeName": "斑马侠散酒铺",
  "storeFullName": "斑马侠合肥肥东吾悦广场店"
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on `http://localhost:4927`, default Next.js page loads.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, Jest, Recharts"
```

---

## Task 2: Config and Date Utils

**Files:**
- Create: `src/lib/config.ts`, `src/lib/date-utils.ts`, `__tests__/lib/config.test.ts`, `__tests__/lib/date-utils.test.ts`

- [ ] **Step 1: Write config tests**

Create `__tests__/lib/config.test.ts`:

```typescript
import { readConfig, writeConfig, type AppConfig } from "@/lib/config";
import fs from "fs";
import path from "path";

const TEST_CONFIG_PATH = path.join(__dirname, "test-config.json");

beforeEach(() => {
  if (fs.existsSync(TEST_CONFIG_PATH)) fs.unlinkSync(TEST_CONFIG_PATH);
});

afterAll(() => {
  if (fs.existsSync(TEST_CONFIG_PATH)) fs.unlinkSync(TEST_CONFIG_PATH);
});

describe("config", () => {
  test("readConfig returns defaults when file does not exist", () => {
    const config = readConfig("/nonexistent/path.json");
    expect(config.cookie).toBe("");
    expect(config.port).toBe(4927);
    expect(config.storeName).toBe("斑马侠散酒铺");
  });

  test("writeConfig then readConfig round-trips", () => {
    const config: AppConfig = {
      cookie: "test_cookie_abc",
      cookieUpdatedAt: "2026-03-28T22:00:00+08:00",
      port: 4927,
      storeName: "斑马侠散酒铺",
      storeFullName: "斑马侠合肥肥东吾悦广场店",
    };
    writeConfig(config, TEST_CONFIG_PATH);
    const loaded = readConfig(TEST_CONFIG_PATH);
    expect(loaded).toEqual(config);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/config.test.ts
```

Expected: FAIL — module `@/lib/config` not found.

- [ ] **Step 3: Implement config module**

Create `src/lib/config.ts`:

```typescript
import fs from "fs";
import path from "path";

export interface AppConfig {
  cookie: string;
  cookieUpdatedAt: string;
  port: number;
  storeName: string;
  storeFullName: string;
}

const DEFAULT_CONFIG: AppConfig = {
  cookie: "",
  cookieUpdatedAt: "",
  port: 4927,
  storeName: "斑马侠散酒铺",
  storeFullName: "斑马侠合肥肥东吾悦广场店",
};

const CONFIG_PATH = path.join(process.cwd(), "config.json");

export function readConfig(filePath: string = CONFIG_PATH): AppConfig {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function writeConfig(
  config: AppConfig,
  filePath: string = CONFIG_PATH
): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}
```

- [ ] **Step 4: Run config tests**

```bash
npm test -- __tests__/lib/config.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write date-utils tests**

Create `__tests__/lib/date-utils.test.ts`:

```typescript
import {
  formatDate,
  getYesterday,
  getLastWeekSameDay,
  getLastMonthSameDay,
  buildTimeParam,
} from "@/lib/date-utils";

describe("date-utils", () => {
  test("formatDate formats as YYYY-MM-DD", () => {
    const date = new Date("2026-03-27T10:00:00+08:00");
    expect(formatDate(date)).toBe("2026-03-27");
  });

  test("getYesterday returns previous day", () => {
    expect(getYesterday("2026-03-27")).toBe("2026-03-26");
  });

  test("getLastWeekSameDay returns 7 days before", () => {
    expect(getLastWeekSameDay("2026-03-27")).toBe("2026-03-20");
  });

  test("getLastMonthSameDay returns same day last month", () => {
    expect(getLastMonthSameDay("2026-03-27")).toBe("2026-02-27");
  });

  test("buildTimeParam creates correct structure", () => {
    expect(buildTimeParam("2026-03-27")).toEqual({
      dateType: 1,
      timeParam: { startDay: "2026-03-27", endDay: "2026-03-27" },
      kdtIds: null,
      selectCustomerType: "member",
    });
  });
});
```

- [ ] **Step 6: Run date-utils tests to verify fail**

```bash
npm test -- __tests__/lib/date-utils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement date-utils**

Create `src/lib/date-utils.ts`:

```typescript
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return formatDate(new Date());
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00+08:00");
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function getYesterday(dateStr: string): string {
  return shiftDays(dateStr, -1);
}

export function getLastWeekSameDay(dateStr: string): string {
  return shiftDays(dateStr, -7);
}

export function getLastMonthSameDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+08:00");
  d.setMonth(d.getMonth() - 1);
  return formatDate(d);
}

export interface YouzanTimeParam {
  dateType: number;
  timeParam: { startDay: string; endDay: string };
  kdtIds: null;
  selectCustomerType: string;
}

export function buildTimeParam(dateStr: string): YouzanTimeParam {
  return {
    dateType: 1,
    timeParam: { startDay: dateStr, endDay: dateStr },
    kdtIds: null,
    selectCustomerType: "member",
  };
}
```

- [ ] **Step 8: Run date-utils tests**

```bash
npm test -- __tests__/lib/date-utils.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/ __tests__/lib/
git commit -m "feat: add config manager and date utilities with tests"
```

---

## Task 3: Youzan HTTP Client

**Files:**
- Create: `src/services/youzan/types.ts`, `src/services/youzan/client.ts`, `__tests__/services/youzan/client.test.ts`

- [ ] **Step 1: Define Youzan types**

Create `src/services/youzan/types.ts`:

```typescript
// Generic Youzan API response wrapper
export interface YouzanResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

// Income overview fields (from getMemberIncomeTree response)
export interface IncomeIndexModel {
  payAmount: number;
  payCount: number;
  payUvOfPeriod: number;
  amountPerUser: number; // 客单价 = payAmount / payUv
  amountPerCount: number; // 笔单价 = payAmount / payCount
  amountPerGoods: number; // 件单价
  jointRate: number; // 连带率
  tradeAmount: number; // 营业收入
  refundAmount: number;
  refundCount: number;
  refundUvOfPeriod: number;
  // Rate of last period (同比)
  payAmountRateOfLastPeriod: number;
  payUvRateOfLastPeriod: number;
  amountPerUserRateOfLastPeriod: number;
  amountPerCountRateOfLastPeriod: number;
  jointRateRateOfLastPeriod: number;
  tradeAmountRateOfLastPeriod: number;
  // Last period values
  payAmountOfLastPeriod?: number;
  tradeAmountOfLastPeriod: number;
  payUvOfLastPeriod: number;
  amountPerUserOfLastPeriod: number;
  amountPerCountOfLastPeriod: number;
  jointRateOfLastPeriod: number;
  amountPerGoodsOfLastPeriod: number;
}

export interface IncomeTreeResponse {
  responseId: string;
  result: {
    allIncomeIndexModel: IncomeIndexModel;
  };
}

// Customer pie chart
export interface CustomerPieItem {
  name: string;
  payAmount: number;
  payAmountRate: number;
}

// Acquisition overview
export interface AcquisitionOverview {
  newMemberCount: number;
  newMemberCountOfLastPeriod: number;
  newMemberCountRateOfLastPeriod: number;
}

// Repurchase overview
export interface RepurchaseOverview {
  repurchaseRate: number;
  repurchaseRateOfLastPeriod: number;
}

// Aggregated daily report (our output format)
export interface DailyReport {
  date: string;
  storeName: string;
  income: {
    payAmount: number;
    revenue: number;
    refundAmount: number;
    payCustomerCount: number;
    payOrderCount: number;
    avgOrderAmount: number;
    avgTransactionAmount: number;
    avgItemPrice: number;
    jointRate: number;
    refundCustomerCount: number;
    refundOrderCount: number;
    customerBreakdown: {
      member: { amount: number; percentage: number };
      nonMember: { amount: number; percentage: number };
      passerby: { amount: number; percentage: number };
    };
  };
  acquisition: {
    newMemberCount: number;
    channelDistribution: Record<string, number>;
  };
  repurchase: {
    repurchaseRate: number;
    frequencyDistribution: Record<string, number>;
    cycleAnalysis: Record<string, number>;
  };
}

export interface ComparisonItem {
  value: number;
  change: number;
  direction: "up" | "down" | "flat";
}

export interface CompareReport {
  date: string;
  current: DailyReport;
  comparison: {
    dayOverDay: Record<string, ComparisonItem>;
    weekOverWeek: Record<string, ComparisonItem>;
    monthOverMonth: Record<string, ComparisonItem>;
  };
}

// Stored report metadata
export interface StoredReport {
  id: string;
  date: string;
  source: "claude" | "openclaw" | "manual";
  createdAt: string;
  title: string;
  content: string;
}
```

- [ ] **Step 2: Write client tests**

Create `__tests__/services/youzan/client.test.ts`:

```typescript
import { YouzanClient } from "@/services/youzan/client";

describe("YouzanClient", () => {
  test("constructor sets base URL and cookie", () => {
    const client = new YouzanClient("test_cookie_123");
    expect(client.cookie).toBe("test_cookie_123");
  });

  test("buildHeaders includes cookie", () => {
    const client = new YouzanClient("my_cookie");
    const headers = client.buildHeaders();
    expect(headers["Cookie"]).toBe("my_cookie");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  test("post builds correct request for Youzan API", async () => {
    const client = new YouzanClient("cookie");
    // We can't call real APIs, but verify the method exists and takes the right params
    expect(typeof client.post).toBe("function");
    expect(typeof client.get).toBe("function");
  });
});
```

- [ ] **Step 3: Run client tests to verify fail**

```bash
npm test -- __tests__/services/youzan/client.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement Youzan client**

Create `src/services/youzan/client.ts`:

```typescript
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

  async get<T>(
    path: string,
    params?: Record<string, string>
  ): Promise<YouzanResponse<T>> {
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
    } catch (e) {
      if (e instanceof Error && e.message === "COOKIE_EXPIRED") return false;
      return false;
    }
  }

  // Static methods for account.youzan.com (QR login)
  static async getQRCodeToken(): Promise<{
    token: string;
    csrfToken: string;
    cookies: string;
  }> {
    // Step 1: Visit login page to get csrf_token cookie
    const loginPageRes = await fetch(`${ACCOUNT_URL}/login`, {
      redirect: "manual",
    });
    const setCookies = loginPageRes.headers.getSetCookie?.() || [];
    const pageCookies = setCookies.map((c) => c.split(";")[0]).join("; ");

    // Extract csrf_token from page or cookies
    const pageHtml = await loginPageRes.text();
    const csrfMatch = pageHtml.match(/csrf_token[=:][\s"']*([a-zA-Z0-9]+)/);
    const csrfToken = csrfMatch?.[1] || "";

    // Step 2: Request QR code token
    const qrRes = await fetch(
      `${ACCOUNT_URL}/api/login/qrcode-data.json?csrf_token=${csrfToken}`,
      {
        headers: {
          Cookie: pageCookies,
          Referer: `${ACCOUNT_URL}/login`,
          Accept: "application/json",
        },
      }
    );
    const qrData = (await qrRes.json()) as { code: number; data: { token: string } };

    return {
      token: qrData.data.token,
      csrfToken,
      cookies: pageCookies,
    };
  }

  static async pollQRCodeLogin(
    token: string,
    csrfToken: string,
    cookies: string
  ): Promise<{ success: boolean; cookie?: string }> {
    const res = await fetch(
      `${ACCOUNT_URL}/api/login/check-qrcode-is-login.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
          Referer: `${ACCOUNT_URL}/login`,
        },
        body: `token=${token}&csrf_token=${csrfToken}`,
        redirect: "manual",
      }
    );

    const body = (await res.json()) as { code: number; msg: string };

    if (body.code === 0) {
      // Login success — extract cookies from response
      const setCookies = res.headers.getSetCookie?.() || [];
      const allCookies = [
        cookies,
        ...setCookies.map((c) => c.split(";")[0]),
      ].join("; ");
      return { success: true, cookie: allCookies };
    }

    // code 160210086 = not scanned yet
    return { success: false };
  }
}
```

- [ ] **Step 5: Run client tests**

```bash
npm test -- __tests__/services/youzan/client.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/youzan/types.ts src/services/youzan/client.ts __tests__/services/youzan/
git commit -m "feat: add Youzan HTTP client with cookie auth and QR login"
```

---

## Task 4: Youzan API Modules

**Files:**
- Create: `src/services/youzan/apis/income.ts`, `src/services/youzan/apis/acquisition.ts`, `src/services/youzan/apis/repurchase.ts`, `src/services/youzan/apis/rfm.ts`, `src/services/youzan/apis/persona.ts`, `src/services/youzan/apis/member.ts`

- [ ] **Step 1: Implement income API**

Create `src/services/youzan/apis/income.ts`:

```typescript
import { YouzanClient } from "../client";
import type { YouzanResponse } from "../types";
import { buildTimeParam } from "@/lib/date-utils";

export class IncomeAPI {
  constructor(private client: YouzanClient) {}

  async getIncomeOverview(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getIncomeOverview?",
      buildTimeParam(date)
    );
  }

  async fetchCustomerPie(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/fetchCustomerPie?",
      buildTimeParam(date)
    );
  }

  async fetchMemberPie(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/fetchMemberPie?",
      buildTimeParam(date)
    );
  }

  async getIncomeTrend(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getIncomeTrend?",
      buildTimeParam(date)
    );
  }

  async getAllChannelIncomeDetail(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getAllChannelIncomeDetail?",
      buildTimeParam(date)
    );
  }

  async getMemberChannelIncomeDetail(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getMemberChannelIncomeDetail?",
      { ...buildTimeParam(date), pageNumber: 1, pageSize: 10, statisticMethod: 1 }
    );
  }

  async getMemberIncomeTree(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/income-analyse/api/getMemberIncomeTree?",
      buildTimeParam(date)
    );
  }
}
```

- [ ] **Step 2: Implement acquisition API**

Create `src/services/youzan/apis/acquisition.ts`:

```typescript
import { YouzanClient } from "../client";
import { buildTimeParam } from "@/lib/date-utils";

export class AcquisitionAPI {
  constructor(private client: YouzanClient) {}

  async getOverview(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/customer-acquisition/api/overview?",
      buildTimeParam(date)
    );
  }

  async getTrendAnalysis(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/customer-acquisition/api/trend-analysis?",
      buildTimeParam(date)
    );
  }

  async getChannelAndWayAnalysis(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/customer-acquisition/api/channel-and-way-analysis?",
      buildTimeParam(date)
    );
  }

  async getChannelAndWayTrend(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/customer-acquisition/api/channel-and-way-trend?",
      buildTimeParam(date)
    );
  }
}
```

- [ ] **Step 3: Implement repurchase API**

Create `src/services/youzan/apis/repurchase.ts`:

```typescript
import { YouzanClient } from "../client";
import { buildTimeParam } from "@/lib/date-utils";

export class RepurchaseAPI {
  constructor(private client: YouzanClient) {}

  async getGeneralView(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/repurchase-retention/api/repurchase-general-view?",
      buildTimeParam(date)
    );
  }

  async getFrequencyAnalysis(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/repurchase-retention/api/repurchase-frequency-analysis?",
      buildTimeParam(date)
    );
  }

  async getCycleAnalysis(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/repurchase-retention/api/repurchase-cycle-analysis?",
      buildTimeParam(date)
    );
  }
}
```

- [ ] **Step 4: Implement RFM API**

Create `src/services/youzan/apis/rfm.ts`:

```typescript
import { YouzanClient } from "../client";

export class RFMAPI {
  constructor(private client: YouzanClient) {}

  async queryRFM(date: string, queryType: "RF" | "RM" | "FM" = "RF") {
    const query = JSON.stringify({
      dateType: 1,
      queryType,
      selectCustomerType: "member",
      timeRangeType: "ALL",
      timeParam: { currentDay: date },
      kdtIds: null,
    });

    return this.client.get<unknown>(
      "/crm/statcenter/rfm-model/api/query-rfm",
      { query }
    );
  }
}
```

- [ ] **Step 5: Implement persona API**

Create `src/services/youzan/apis/persona.ts`:

```typescript
import { YouzanClient } from "../client";
import { buildTimeParam } from "@/lib/date-utils";

export class PersonaAPI {
  constructor(private client: YouzanClient) {}

  private async postPersona(endpoint: string, date: string) {
    return this.client.post<unknown>(
      `/crm/statcenter/holistic-persona/api/basic/${endpoint}?`,
      buildTimeParam(date)
    );
  }

  async getCustomerStatistic(date: string) {
    return this.postPersona("customer-statistic", date);
  }

  async getGenderDistribute(date: string) {
    return this.postPersona("gender-distribute", date);
  }

  async getAgeDistribute(date: string) {
    return this.postPersona("age-distribute", date);
  }

  async getRegionDistribute(date: string) {
    return this.postPersona("region-distribute", date);
  }

  async getVisitDepthDistribute(date: string) {
    return this.postPersona("visit-depth-distribute", date);
  }

  async getStayTimeDistribute(date: string) {
    return this.postPersona("stay-time-distribute", date);
  }

  async getActiveDistribute(date: string) {
    return this.postPersona("active-distribute", date);
  }
}
```

- [ ] **Step 6: Implement member API**

Create `src/services/youzan/apis/member.ts`:

```typescript
import { YouzanClient } from "../client";
import { buildTimeParam } from "@/lib/date-utils";

export class MemberAPI {
  constructor(private client: YouzanClient) {}

  async getTrends(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/new-old-member/api/trends?",
      buildTimeParam(date)
    );
  }

  async getDetail(date: string) {
    return this.client.post<unknown>(
      "/crm/statcenter/new-old-member/api/detail?",
      buildTimeParam(date)
    );
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add src/services/youzan/apis/
git commit -m "feat: add all 6 Youzan API modules (24 endpoints)"
```

---

## Task 5: Data Aggregator

**Files:**
- Create: `src/services/youzan/apis/aggregator.ts`, `__tests__/services/youzan/aggregator.test.ts`

- [ ] **Step 1: Write aggregator tests**

Create `__tests__/services/youzan/aggregator.test.ts`:

```typescript
import { extractIncomeData, extractComparisonItem } from "@/services/youzan/apis/aggregator";

describe("aggregator", () => {
  test("extractIncomeData maps raw Youzan response to DailyReport income", () => {
    const raw = {
      allIncomeIndexModel: {
        payAmount: 137014, // Youzan stores as cents (分)
        payCount: 38,
        payUvOfPeriod: 33,
        amountPerUser: 4152,
        amountPerCount: 3606,
        amountPerGoods: 2447,
        jointRate: 1.7,
        tradeAmount: 135024,
        refundAmount: 1990,
        refundCount: 1,
        refundUvOfPeriod: 1,
      },
    };

    const result = extractIncomeData(raw);
    expect(result.payAmount).toBeCloseTo(1370.14);
    expect(result.revenue).toBeCloseTo(1350.24);
    expect(result.payCustomerCount).toBe(33);
    expect(result.payOrderCount).toBe(38);
    expect(result.avgOrderAmount).toBeCloseTo(41.52);
    expect(result.jointRate).toBe(1.7);
  });

  test("extractComparisonItem creates correct comparison", () => {
    const result = extractComparisonItem(1370.14, 875.10);
    expect(result.value).toBe(875.10);
    expect(result.change).toBeCloseTo(0.5657, 2);
    expect(result.direction).toBe("up");
  });

  test("extractComparisonItem handles decrease", () => {
    const result = extractComparisonItem(800, 1000);
    expect(result.direction).toBe("down");
    expect(result.change).toBeCloseTo(-0.2, 2);
  });

  test("extractComparisonItem handles zero base", () => {
    const result = extractComparisonItem(100, 0);
    expect(result.direction).toBe("up");
    expect(result.change).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
npm test -- __tests__/services/youzan/aggregator.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement aggregator**

Create `src/services/youzan/apis/aggregator.ts`:

```typescript
import { YouzanClient } from "../client";
import { IncomeAPI } from "./income";
import { AcquisitionAPI } from "./acquisition";
import { RepurchaseAPI } from "./repurchase";
import type { DailyReport, ComparisonItem, CompareReport } from "../types";
import { readConfig } from "@/lib/config";
import {
  getYesterday,
  getLastWeekSameDay,
  getLastMonthSameDay,
} from "@/lib/date-utils";

// Convert Youzan cent values to yuan
function toYuan(cents: number): number {
  return Math.round(cents) / 100;
}

export function extractIncomeData(result: Record<string, unknown>): DailyReport["income"] {
  const m = result.allIncomeIndexModel as Record<string, number>;
  return {
    payAmount: toYuan(m.payAmount),
    revenue: toYuan(m.tradeAmount),
    refundAmount: toYuan(m.refundAmount),
    payCustomerCount: m.payUvOfPeriod,
    payOrderCount: m.payCount,
    avgOrderAmount: toYuan(m.amountPerUser),
    avgTransactionAmount: toYuan(m.amountPerCount),
    avgItemPrice: toYuan(m.amountPerGoods),
    jointRate: m.jointRate,
    refundCustomerCount: m.refundUvOfPeriod,
    refundOrderCount: m.refundCount,
    customerBreakdown: {
      member: { amount: 0, percentage: 0 },
      nonMember: { amount: 0, percentage: 0 },
      passerby: { amount: 0, percentage: 0 },
    },
  };
}

export function extractComparisonItem(
  current: number,
  previous: number
): ComparisonItem {
  const change = previous === 0 ? 0 : (current - previous) / previous;
  const direction: ComparisonItem["direction"] =
    current > previous ? "up" : current < previous ? "down" : "flat";
  return { value: previous, change, direction };
}

function createClient(): YouzanClient {
  const config = readConfig();
  if (!config.cookie) throw new Error("NO_COOKIE");
  return new YouzanClient(config.cookie);
}

export async function fetchDailyReport(date: string): Promise<DailyReport> {
  const client = createClient();
  const config = readConfig();
  const incomeAPI = new IncomeAPI(client);
  const acquisitionAPI = new AcquisitionAPI(client);
  const repurchaseAPI = new RepurchaseAPI(client);

  const [incomeTreeRes, customerPieRes, acquisitionRes, repurchaseRes] =
    await Promise.all([
      incomeAPI.getMemberIncomeTree(date),
      incomeAPI.fetchCustomerPie(date),
      acquisitionAPI.getOverview(date),
      repurchaseAPI.getGeneralView(date),
    ]);

  // Extract income
  const incomeResult = (incomeTreeRes.data as Record<string, unknown>)?.result as Record<string, unknown>;
  const income = extractIncomeData(incomeResult || {});

  // Extract customer breakdown from pie data
  const pieResult = customerPieRes.data as Record<string, unknown[]>;
  if (pieResult?.list) {
    for (const item of pieResult.list as Array<{ name: string; payAmount: number; payAmountRate: number }>) {
      const amount = toYuan(item.payAmount);
      const percentage = Math.round(item.payAmountRate * 10000) / 100;
      if (item.name === "会员") {
        income.customerBreakdown.member = { amount, percentage };
      } else if (item.name === "非会员") {
        income.customerBreakdown.nonMember = { amount, percentage };
      } else if (item.name === "流水客") {
        income.customerBreakdown.passerby = { amount, percentage };
      }
    }
  }

  // Extract acquisition
  const acqResult = acquisitionRes.data as Record<string, unknown>;
  const acquisition: DailyReport["acquisition"] = {
    newMemberCount: (acqResult?.newMemberCount as number) || 0,
    channelDistribution: {},
  };

  // Extract repurchase
  const repResult = repurchaseRes.data as Record<string, unknown>;
  const repurchase: DailyReport["repurchase"] = {
    repurchaseRate: (repResult?.repurchaseRate as number) || 0,
    frequencyDistribution: {},
    cycleAnalysis: {},
  };

  return {
    date,
    storeName: config.storeName,
    income,
    acquisition,
    repurchase,
  };
}

export async function fetchCompareReport(date: string): Promise<CompareReport> {
  const [current, yesterday, lastWeek, lastMonth] = await Promise.all([
    fetchDailyReport(date),
    fetchDailyReport(getYesterday(date)),
    fetchDailyReport(getLastWeekSameDay(date)),
    fetchDailyReport(getLastMonthSameDay(date)),
  ]);

  const fields = [
    "payAmount", "revenue", "payCustomerCount", "payOrderCount",
    "avgOrderAmount", "jointRate",
  ] as const;

  function buildComparison(prev: DailyReport): Record<string, ComparisonItem> {
    const result: Record<string, ComparisonItem> = {};
    for (const field of fields) {
      const c = current.income[field] as number;
      const p = prev.income[field] as number;
      result[field] = extractComparisonItem(c, p);
    }
    return result;
  }

  return {
    date,
    current,
    comparison: {
      dayOverDay: buildComparison(yesterday),
      weekOverWeek: buildComparison(lastWeek),
      monthOverMonth: buildComparison(lastMonth),
    },
  };
}
```

- [ ] **Step 4: Run aggregator tests**

```bash
npm test -- __tests__/services/youzan/aggregator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/youzan/apis/aggregator.ts __tests__/services/youzan/aggregator.test.ts
git commit -m "feat: add data aggregator with daily and compare report builders"
```

---

## Task 6: Report Storage

**Files:**
- Create: `src/lib/reports.ts`, `__tests__/lib/reports.test.ts`

- [ ] **Step 1: Write reports tests**

Create `__tests__/lib/reports.test.ts`:

```typescript
import { saveReport, listReports, getReport } from "@/lib/reports";
import fs from "fs";
import path from "path";
import type { StoredReport } from "@/services/youzan/types";

const TEST_REPORTS_DIR = path.join(__dirname, "test-reports");

beforeEach(() => {
  fs.rmSync(TEST_REPORTS_DIR, { recursive: true, force: true });
});

afterAll(() => {
  fs.rmSync(TEST_REPORTS_DIR, { recursive: true, force: true });
});

describe("reports", () => {
  test("saveReport creates file in correct directory structure", () => {
    const report: StoredReport = {
      id: "2026-03-27-claude",
      date: "2026-03-27",
      source: "claude",
      createdAt: "2026-03-27T22:00:00+08:00",
      title: "3月27日日报",
      content: "今日营收1370.14元...",
    };

    saveReport(report, TEST_REPORTS_DIR);

    const filePath = path.join(TEST_REPORTS_DIR, "2026", "03", "2026-03-27-claude.md");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("getReport reads saved report", () => {
    const report: StoredReport = {
      id: "2026-03-27-claude",
      date: "2026-03-27",
      source: "claude",
      createdAt: "2026-03-27T22:00:00+08:00",
      title: "3月27日日报",
      content: "今日营收1370.14元...",
    };

    saveReport(report, TEST_REPORTS_DIR);
    const loaded = getReport("2026-03-27-claude", TEST_REPORTS_DIR);
    expect(loaded).not.toBeNull();
    expect(loaded!.title).toBe("3月27日日报");
    expect(loaded!.content).toBe("今日营收1370.14元...");
  });

  test("listReports returns all reports sorted by date desc", () => {
    saveReport({
      id: "2026-03-26-claude", date: "2026-03-26", source: "claude",
      createdAt: "2026-03-26T22:00:00+08:00", title: "3月26日", content: "test",
    }, TEST_REPORTS_DIR);
    saveReport({
      id: "2026-03-27-openclaw", date: "2026-03-27", source: "openclaw",
      createdAt: "2026-03-27T22:00:00+08:00", title: "3月27日", content: "test2",
    }, TEST_REPORTS_DIR);

    const list = listReports(TEST_REPORTS_DIR);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe("2026-03-27-openclaw");
    expect(list[1].id).toBe("2026-03-26-claude");
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
npm test -- __tests__/lib/reports.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement reports module**

Create `src/lib/reports.ts`:

```typescript
import fs from "fs";
import path from "path";
import type { StoredReport } from "@/services/youzan/types";

const DEFAULT_REPORTS_DIR = path.join(process.cwd(), "reports");

function reportFilePath(report: StoredReport, reportsDir: string): string {
  const year = report.date.substring(0, 4);
  const month = report.date.substring(5, 7);
  return path.join(reportsDir, year, month, `${report.id}.md`);
}

function reportToMarkdown(report: StoredReport): string {
  return [
    "---",
    `id: ${report.id}`,
    `date: ${report.date}`,
    `source: ${report.source}`,
    `createdAt: ${report.createdAt}`,
    `title: ${report.title}`,
    "---",
    "",
    report.content,
  ].join("\n");
}

function parseReportMarkdown(raw: string, id: string): StoredReport | null {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!fmMatch) return null;

  const meta: Record<string, string> = {};
  for (const line of fmMatch[1].split("\n")) {
    const idx = line.indexOf(": ");
    if (idx > 0) {
      meta[line.substring(0, idx).trim()] = line.substring(idx + 2).trim();
    }
  }

  return {
    id: meta.id || id,
    date: meta.date || "",
    source: (meta.source as StoredReport["source"]) || "manual",
    createdAt: meta.createdAt || "",
    title: meta.title || "",
    content: fmMatch[2],
  };
}

export function saveReport(
  report: StoredReport,
  reportsDir: string = DEFAULT_REPORTS_DIR
): void {
  const filePath = reportFilePath(report, reportsDir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, reportToMarkdown(report), "utf-8");
}

export function getReport(
  id: string,
  reportsDir: string = DEFAULT_REPORTS_DIR
): StoredReport | null {
  // Parse id format: "2026-03-27-source"
  const dateMatch = id.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return null;

  const filePath = path.join(reportsDir, dateMatch[1], dateMatch[2], `${id}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return parseReportMarkdown(raw, id);
}

export function listReports(
  reportsDir: string = DEFAULT_REPORTS_DIR
): StoredReport[] {
  const reports: StoredReport[] = [];

  if (!fs.existsSync(reportsDir)) return reports;

  const years = fs.readdirSync(reportsDir).filter((d) => /^\d{4}$/.test(d));
  for (const year of years) {
    const yearPath = path.join(reportsDir, year);
    const months = fs.readdirSync(yearPath).filter((d) => /^\d{2}$/.test(d));
    for (const month of months) {
      const monthPath = path.join(yearPath, month);
      const files = fs.readdirSync(monthPath).filter((f) => f.endsWith(".md"));
      for (const file of files) {
        const raw = fs.readFileSync(path.join(monthPath, file), "utf-8");
        const id = file.replace(".md", "");
        const report = parseReportMarkdown(raw, id);
        if (report) reports.push(report);
      }
    }
  }

  return reports.sort((a, b) => b.date.localeCompare(a.date));
}
```

- [ ] **Step 4: Run reports tests**

```bash
npm test -- __tests__/lib/reports.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reports.ts __tests__/lib/reports.test.ts
git commit -m "feat: add file-based report storage with markdown frontmatter"
```

---

## Task 7: API Routes

**Files:**
- Create: `src/app/api/report/daily/route.ts`, `src/app/api/report/compare/route.ts`, `src/app/api/auth/status/route.ts`, `src/app/api/auth/qrcode/route.ts`, `src/app/api/auth/qrcode/poll/route.ts`, `src/app/api/reports/route.ts`, `src/app/api/reports/[id]/route.ts`

- [ ] **Step 1: Implement daily report route**

Create `src/app/api/report/daily/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { fetchDailyReport } from "@/services/youzan/apis/aggregator";
import { today } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || today();

  try {
    const report = await fetchDailyReport(date);
    return NextResponse.json(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "NO_COOKIE") {
      return NextResponse.json({ error: "Cookie not configured" }, { status: 401 });
    }
    if (message === "COOKIE_EXPIRED") {
      return NextResponse.json({ error: "Cookie expired" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement compare report route**

Create `src/app/api/report/compare/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { fetchCompareReport } from "@/services/youzan/apis/aggregator";
import { today } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || today();

  try {
    const report = await fetchCompareReport(date);
    return NextResponse.json(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "NO_COOKIE" || message === "COOKIE_EXPIRED") {
      return NextResponse.json({ error: "Cookie expired" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Implement auth status route**

Create `src/app/api/auth/status/route.ts`:

```typescript
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
```

- [ ] **Step 4: Implement QR code routes**

Create `src/app/api/auth/qrcode/route.ts`:

```typescript
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
    const qrUrl = `https://account.youzan.com/qr/login?token=${token}`;

    return NextResponse.json({ token, qrUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

Create `src/app/api/auth/qrcode/poll/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { YouzanClient } from "@/services/youzan/client";
import { readConfig, writeConfig } from "@/lib/config";

// Import the active session from the qrcode route
// Using dynamic import to share state within the same process
let getActiveSession: () => Promise<{
  token: string;
  csrfToken: string;
  cookies: string;
  createdAt: number;
} | null>;

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
```

- [ ] **Step 5: Implement reports CRUD routes**

Create `src/app/api/reports/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { listReports, saveReport } from "@/lib/reports";
import type { StoredReport } from "@/services/youzan/types";

export async function GET() {
  const reports = listReports();
  // Return list without full content for performance
  const summaries = reports.map(({ content, ...rest }) => ({
    ...rest,
    contentPreview: content.substring(0, 200),
  }));
  return NextResponse.json(summaries);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StoredReport;

    if (!body.id || !body.date || !body.source || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: id, date, source, content" },
        { status: 400 }
      );
    }

    const report: StoredReport = {
      id: body.id,
      date: body.date,
      source: body.source,
      createdAt: body.createdAt || new Date().toISOString(),
      title: body.title || `${body.date} 分析报告`,
      content: body.content,
    };

    saveReport(report);

    return NextResponse.json({ success: true, id: report.id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

Create `src/app/api/reports/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/reports";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = getReport(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/
git commit -m "feat: add all API routes (daily, compare, auth, reports)"
```

---

## Task 8: UI Components

**Files:**
- Create: `src/components/Navbar.tsx`, `src/components/StatCard.tsx`, `src/components/StatsGrid.tsx`, `src/components/CustomerPieChart.tsx`, `src/components/IncomeTrendChart.tsx`, `src/components/QRCodeModal.tsx`, `src/components/ReportCard.tsx`, `src/components/DatePicker.tsx`

- [ ] **Step 1: Create Navbar**

Create `src/components/Navbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "今日概览" },
  { href: "/history", label: "历史数据" },
  { href: "/reports", label: "分析报告" },
  { href: "/settings", label: "设置" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-orange-600">斑马侠散酒铺</span>
          <span className="text-sm text-gray-400">数据分析</span>
        </div>
        <div className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create StatCard**

Create `src/components/StatCard.tsx`:

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number; // percentage change, e.g. 0.566 = 56.6%
  prefix?: string;
}

export default function StatCard({ label, value, change, prefix = "" }: StatCardProps) {
  const changeText =
    change !== undefined && change !== 0
      ? `${change > 0 ? "↑" : "↓"}${Math.abs(change * 100).toFixed(1)}%`
      : null;

  const changeColor =
    change !== undefined
      ? change > 0
        ? "text-green-600"
        : change < 0
        ? "text-red-600"
        : "text-gray-400"
      : "";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {changeText && (
        <div className={`text-sm mt-1 ${changeColor}`}>
          同比 {changeText}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create StatsGrid**

Create `src/components/StatsGrid.tsx`:

```tsx
import StatCard from "./StatCard";
import type { DailyReport } from "@/services/youzan/types";

interface StatsGridProps {
  data: DailyReport;
  comparison?: Record<string, { change: number }>;
}

export default function StatsGrid({ data, comparison }: StatsGridProps) {
  const { income } = data;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard
        label="支付金额"
        value={income.payAmount}
        prefix="¥"
        change={comparison?.payAmount?.change}
      />
      <StatCard
        label="支付客户数"
        value={income.payCustomerCount}
        change={comparison?.payCustomerCount?.change}
      />
      <StatCard
        label="支付订单数"
        value={income.payOrderCount}
        change={comparison?.payOrderCount?.change}
      />
      <StatCard
        label="客单价"
        value={income.avgOrderAmount}
        prefix="¥"
        change={comparison?.avgOrderAmount?.change}
      />
      <StatCard
        label="连带率"
        value={income.jointRate}
        change={comparison?.jointRate?.change}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create chart components**

Create `src/components/CustomerPieChart.tsx`:

```tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CustomerPieChartProps {
  member: { amount: number; percentage: number };
  nonMember: { amount: number; percentage: number };
  passerby: { amount: number; percentage: number };
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b"];

export default function CustomerPieChart({
  member, nonMember, passerby,
}: CustomerPieChartProps) {
  const data = [
    { name: "会员", value: member.amount },
    { name: "非会员", value: nonMember.amount },
    { name: "流水客", value: passerby.amount },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 h-64 flex items-center justify-center text-gray-400">
        暂无数据
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">客户构成</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

Create `src/components/IncomeTrendChart.tsx`:

```tsx
"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface TrendDataPoint {
  date: string;
  payAmount: number;
}

interface IncomeTrendChartProps {
  data: TrendDataPoint[];
}

export default function IncomeTrendChart({ data }: IncomeTrendChartProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">近 7 日收入趋势</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
          <Line
            type="monotone"
            dataKey="payAmount"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: Create QRCodeModal**

Create `src/components/QRCodeModal.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  open: boolean;
  onSuccess: () => void;
}

export default function QRCodeModal({ open, onSuccess }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "ready" | "waiting" | "success" | "expired" | "error">("loading");

  const startLogin = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/qrcode", { method: "POST" });
      const data = await res.json();
      if (data.qrUrl) {
        const dataUrl = await QRCode.toDataURL(data.qrUrl, { width: 256 });
        setQrDataUrl(dataUrl);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    startLogin();
  }, [open, startLogin]);

  // Poll for scan result
  useEffect(() => {
    if (status !== "ready" && status !== "waiting") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/qrcode/poll");
        const data = await res.json();
        if (data.status === "success") {
          setStatus("success");
          clearInterval(interval);
          onSuccess();
        } else if (data.status === "expired") {
          setStatus("expired");
          clearInterval(interval);
        } else {
          setStatus("waiting");
        }
      } catch {
        // ignore poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status, onSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">登录已过期，请扫码更新</h2>

        {status === "loading" && <p className="text-gray-500 py-16">加载中...</p>}

        {(status === "ready" || status === "waiting") && (
          <>
            <img src={qrDataUrl} alt="QR Code" className="mx-auto my-4 w-48 h-48" />
            <p className="text-gray-500">请使用微信扫描二维码</p>
            {status === "waiting" && <p className="text-blue-600 text-sm mt-1">等待扫码确认...</p>}
          </>
        )}

        {status === "success" && (
          <p className="text-green-600 py-16 text-lg">登录成功！</p>
        )}

        {status === "expired" && (
          <div className="py-8">
            <p className="text-gray-500 mb-4">二维码已过期</p>
            <button
              onClick={startLogin}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              重新生成
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="py-8">
            <p className="text-red-600 mb-4">获取二维码失败</p>
            <button
              onClick={startLogin}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create ReportCard and DatePicker**

Create `src/components/ReportCard.tsx`:

```tsx
import Link from "next/link";

interface ReportCardProps {
  id: string;
  date: string;
  source: string;
  title: string;
  contentPreview: string;
  createdAt: string;
}

const sourceLabels: Record<string, string> = {
  claude: "Claude",
  openclaw: "OpenClaw",
  manual: "手动",
};

const sourceColors: Record<string, string> = {
  claude: "bg-purple-100 text-purple-700",
  openclaw: "bg-blue-100 text-blue-700",
  manual: "bg-gray-100 text-gray-700",
};

export default function ReportCard({
  id, date, source, title, contentPreview, createdAt,
}: ReportCardProps) {
  return (
    <Link href={`/reports/${id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-300 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{date}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${sourceColors[source] || sourceColors.manual}`}>
            {sourceLabels[source] || source}
          </span>
        </div>
        <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{contentPreview}</p>
        <div className="text-xs text-gray-400 mt-2">
          {new Date(createdAt).toLocaleString("zh-CN")}
        </div>
      </div>
    </Link>
  );
}
```

Create `src/components/DatePicker.tsx`:

```tsx
"use client";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    />
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "feat: add all UI components (stats, charts, QR modal, nav)"
```

---

## Task 9: Pages

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/app/history/page.tsx`, `src/app/reports/page.tsx`, `src/app/reports/[id]/page.tsx`, `src/app/settings/page.tsx`

- [ ] **Step 1: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "斑马侠散酒铺 · 数据分析",
  description: "门店数据分析系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create Dashboard page**

Replace `src/app/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import StatsGrid from "@/components/StatsGrid";
import CustomerPieChart from "@/components/CustomerPieChart";
import IncomeTrendChart from "@/components/IncomeTrendChart";
import QRCodeModal from "@/components/QRCodeModal";
import type { CompareReport } from "@/services/youzan/types";

export default function DashboardPage() {
  const [data, setData] = useState<CompareReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report/compare");
      if (res.status === 401) {
        setShowQR(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <QRCodeModal open={showQR} onSuccess={() => { setShowQR(false); fetchData(); }} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          今日数据概览
          {data && <span className="text-base font-normal text-gray-500 ml-2">{data.date}</span>}
        </h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
        >
          刷新数据
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <StatsGrid
            data={data.current}
            comparison={data.comparison.weekOverWeek}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomerPieChart {...data.current.income.customerBreakdown} />
            <IncomeTrendChart data={[]} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">今日拉新</h3>
              <div className="text-3xl font-bold text-gray-900">
                {data.current.acquisition.newMemberCount}
              </div>
              <div className="text-sm text-gray-500">新增会员</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">营业收入</h3>
              <div className="text-3xl font-bold text-gray-900">
                ¥{data.current.income.revenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                退款 ¥{data.current.income.refundAmount}
                ({data.current.income.refundOrderCount}单)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create history page**

Create `src/app/history/page.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import DatePicker from "@/components/DatePicker";
import StatsGrid from "@/components/StatsGrid";
import CustomerPieChart from "@/components/CustomerPieChart";
import type { CompareReport } from "@/services/youzan/types";
import { formatDate } from "@/lib/date-utils";

export default function HistoryPage() {
  const [date, setDate] = useState(formatDate(new Date()));
  const [data, setData] = useState<CompareReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report/compare?date=${d}`);
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateChange = (d: string) => {
    setDate(d);
    fetchData(d);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">历史数据</h1>
        <DatePicker value={date} onChange={handleDateChange} />
      </div>

      {loading && <p className="text-gray-500">加载中...</p>}

      {data && (
        <div className="space-y-6">
          <StatsGrid data={data.current} comparison={data.comparison.weekOverWeek} />
          <CustomerPieChart {...data.current.income.customerBreakdown} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create reports pages**

Create `src/app/reports/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import ReportCard from "@/components/ReportCard";

interface ReportSummary {
  id: string;
  date: string;
  source: string;
  title: string;
  contentPreview: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => { setReports(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">分析报告</h1>

      {loading && <p className="text-gray-500">加载中...</p>}

      {!loading && reports.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          暂无报告。等待 Claude 或 OpenClaw 生成第一份分析报告。
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <ReportCard key={r.id} {...r} />
        ))}
      </div>
    </div>
  );
}
```

Create `src/app/reports/[id]/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { StoredReport } from "@/services/youzan/types";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then((r) => r.json())
      .then((data) => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">加载中...</p>;
  if (!report) return <p className="text-red-600">报告未找到</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
        <div className="text-sm text-gray-500 mt-1">
          {report.date} · {report.source} · {new Date(report.createdAt).toLocaleString("zh-CN")}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap">{report.content}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create settings page**

Create `src/app/settings/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import QRCodeModal from "@/components/QRCodeModal";

interface AuthStatus {
  valid: boolean;
  reason: string | null;
  updatedAt: string | null;
}

export default function SettingsPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [showQR, setShowQR] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth/status");
    setAuthStatus(await res.json());
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div>
      <QRCodeModal open={showQR} onSuccess={() => { setShowQR(false); checkAuth(); }} />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">设置</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">登录状态</h2>

        {authStatus && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${authStatus.valid ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-gray-700">
                {authStatus.valid ? "Cookie 有效" : "Cookie 已失效"}
              </span>
            </div>

            {authStatus.updatedAt && (
              <p className="text-sm text-gray-500">
                上次更新: {new Date(authStatus.updatedAt).toLocaleString("zh-CN")}
              </p>
            )}

            {!authStatus.valid && (
              <button
                onClick={() => setShowQR(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
              >
                扫码更新 Cookie
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">系统信息</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>服务端口: 4927</p>
          <p>报告存储: reports/</p>
          <p>API 基础路径: http://localhost:4927/api</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify dev server and pages load**

```bash
npm run dev
```

Open `http://localhost:4927` — should see the dashboard (will show loading/error without a valid cookie, which is expected).

Visit `/settings` — should see the settings page with cookie status.

- [ ] **Step 7: Commit**

```bash
git add src/app/
git commit -m "feat: add all pages (dashboard, history, reports, settings)"
```

---

## Task 10: Agent Skill

**Files:**
- Create: `~/Agent/Skills/productivity/banmaxia-store-analytics/SKILL.md`

- [ ] **Step 1: Create Skill directory**

```bash
mkdir -p ~/Agent/Skills/productivity/banmaxia-store-analytics
```

- [ ] **Step 2: Write SKILL.md**

Create `~/Agent/Skills/productivity/banmaxia-store-analytics/SKILL.md`:

```markdown
---
name: banmaxia-store-analytics
description: Access daily store analytics for 斑马侠散酒铺 (Banmaxia Liquor Store). Fetch sales data, generate analysis reports, and save them. Use when asked about store performance, daily sales, revenue analysis, or generating store reports.
license: MIT
metadata:
  author: leonardo
  version: "1.0"
---

# 斑马侠散酒铺 - 门店数据分析

本地 API 服务运行在 `http://localhost:4927`。通过以下接口获取数据、分析、保存报告。

## 获取数据

### 日报数据（含同比对比）

```bash
curl http://localhost:4927/api/report/compare?date=YYYY-MM-DD
```

返回当天数据 + 日环比/周同比/月同比。不传 date 默认今天。

### 纯数据（不含对比）

```bash
curl http://localhost:4927/api/report/daily?date=YYYY-MM-DD
```

## 分析指引

### 日报分析维度

1. **营收核心**: 支付金额、营业收入、退款金额、客户数、订单数、客单价、笔单价、连带率
2. **趋势判断**: 日环比（vs 昨天）、周同比（vs 上周同日）、月同比（vs 上月同日）
3. **客户构成**: 会员 vs 非会员 vs 流水客的收入占比
4. **拉新**: 新增会员数及渠道来源

### 报告格式

生成的微信推送消息使用以下格式:

```
斑马侠散酒铺 · [月]月[日]日日报

营收：¥[金额] ([趋势])
客户：[数量]人 ([趋势])
订单：[数量]单
客单价：¥[金额] ([趋势])
连带率：[数值] ([趋势])
退款：¥[金额] ([数量]单)

会员贡献 [比例]%，非会员 [比例]%

[AI 分析摘要 - 2-3 句话的关键洞察和建议]
```

## 保存报告

分析完成后，将报告保存回系统：

```bash
curl -X POST http://localhost:4927/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "id": "YYYY-MM-DD-[source]",
    "date": "YYYY-MM-DD",
    "source": "claude",
    "title": "[月]月[日]日日报分析",
    "content": "报告正文..."
  }'
```

`source` 字段: 使用 `claude`（Claude Code）、`openclaw`（OpenClaw）、`manual`（手动）。

## 检查登录状态

```bash
curl http://localhost:4927/api/auth/status
```

返回 `{"valid": true/false}`。如果 `false`，提醒用户到 `http://localhost:4927/settings` 扫码更新。

## 查看历史报告

```bash
# 报告列表
curl http://localhost:4927/api/reports

# 单份报告
curl http://localhost:4927/api/reports/YYYY-MM-DD-source
```
```

- [ ] **Step 3: Install skill to all agents**

```bash
~/Agent/Skills/install.sh
```

- [ ] **Step 4: Commit the skill to the Skills repo**

```bash
cd ~/Agent/Skills
git add productivity/banmaxia-store-analytics/
git commit -m "feat: add banmaxia-store-analytics skill"
```

- [ ] **Step 5: Return to project directory**

```bash
cd ~/Code/Personal/banmaxia-store-analytics
```

---

## Task 11: End-to-End Verification

- [ ] **Step 1: Create a config.json with your Cookie**

Copy the cookie from your browser and create `config.json`:

```bash
cp config.example.json config.json
# Then edit config.json to paste your Youzan cookie
```

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Expected: Server starts on `http://localhost:4927`.

- [ ] **Step 3: Test API endpoints**

```bash
# Test auth status
curl http://localhost:4927/api/auth/status

# Test daily report
curl http://localhost:4927/api/report/daily

# Test compare report
curl http://localhost:4927/api/report/compare
```

Expected: JSON responses with store data. If cookie is invalid, 401 response.

- [ ] **Step 4: Test report saving**

```bash
curl -X POST http://localhost:4927/api/reports \
  -H "Content-Type: application/json" \
  -d '{"id":"2026-03-28-manual","date":"2026-03-28","source":"manual","title":"测试报告","content":"这是一份测试报告。"}'

curl http://localhost:4927/api/reports
curl http://localhost:4927/api/reports/2026-03-28-manual
```

Expected: Report saved and retrievable.

- [ ] **Step 5: Verify dashboard in browser**

Open `http://localhost:4927` and confirm:
- KPI cards show data with trend arrows
- Customer pie chart renders
- Navigation works between pages
- Settings page shows cookie status

- [ ] **Step 6: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete banmaxia-store-analytics v1.0"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-03-28-banmaxia-store-analytics.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
