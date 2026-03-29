# 斑马侠散酒铺 - 门店数据分析系统设计文档

## 概述

为「斑马侠散酒铺」（合肥肥东吾悦广场店）构建一套本地运行的门店数据分析系统。系统对接有赞 CRM 数据中心，提供实时数据查看、定时分析报告生成、微信消息推送等功能。

**项目名称：** banmaxia-store-analytics
**项目路径：** `~/Code/Personal/banmaxia-store-analytics`
**技术栈：** Next.js + React + TypeScript
**运行环境：** 本地 macOS，PM2 进程管理
**端口：** 4927

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│           Next.js 应用 (localhost:4927)               │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │
│  │  数据拉取层  │  │ Web 仪表盘  │  │   API 接口层    │ │
│  │  (有赞 API) │  │  (React)   │  │  /api/report   │ │
│  └────────────┘  └────────────┘  │  /api/auth     │ │
│                                   │  /api/reports  │ │
│  ┌────────────────────────┐      └────────────────┘ │
│  │  扫码登录模块            │                         │
│  │  (Cookie 自动更新)      │                         │
│  └────────────────────────┘                         │
└──────────────┬─────────────────────┬────────────────┘
               │                     │
     ┌─────────▼──────────┐  ┌───────▼────────┐
     │   Claude Code      │  │   OpenClaw     │
     │   scheduled task   │  │   Webhook/Cron │
     │                    │  │                │
     │  1. 调接口拿数据    │  │ 1. 调接口拿数据 │
     │  2. Claude 分析    │  │ 2. 自身模型分析 │
     │  3. 存报告到本地    │  │ 3. 存报告到本地 │
     │  4. 微信推送 (CU)  │  │ 4. 微信 Channel│
     └────────────────────┘  └────────────────┘
```

### 核心原则

- **Next.js 只做数据层 + 展示层**，不负责 AI 分析
- **Claude Code 和 OpenClaw 各自独立**调用 API、分析、推送
- **松耦合**：任何一个 Agent 挂了不影响另一个
- **无数据库**：有赞是数据源（按日期查询），报告存文件系统

## 模块一：有赞数据服务

### 数据源

基域名：`https://crm.youzan.com`
认证方式：Cookie + Csrf-Token（手动从浏览器登录后复制，保存到 `config.json`）
请求体通用格式：

```json
{
  "dateType": 1,
  "timeParam": { "startDay": "2026-03-27", "endDay": "2026-03-27" },
  "kdtIds": null,
  "selectCustomerType": "member"
}
```

### API 清单

#### 收入分析（7 个接口）

| 接口路径 | 方法 | 用途 |
|---------|------|------|
| `/crm/statcenter/income-analyse/api/getIncomeOverview` | POST | 收入概况（支付金额、客户数、订单数、客单价等） |
| `/crm/statcenter/income-analyse/api/fetchCustomerPie` | POST | 新老会员收入占比（新会员/老会员 — **注意：不是会员/非会员/流水客**，实际未使用） |
| `/crm/statcenter/income-analyse/api/fetchMemberPie` | POST | 会员收入饼图 |
| `/crm/statcenter/income-analyse/api/getIncomeTrend` | POST | 收入趋势 |
| `/crm/statcenter/income-analyse/api/getAllChannelIncomeDetail` | POST | 全渠道收入明细 |
| `/crm/statcenter/income-analyse/api/getMemberChannelIncomeDetail` | POST | 会员渠道收入明细 |
| `/crm/statcenter/income-analyse/api/getMemberIncomeTree` | POST | 会员收入树（含同比数据）。**result 字段包含三个子模型：`memberIncomeIndexModel`（会员）、`notMemberIncomeIndexModel`（非会员）、`noneIncomeIndexModel`（流水客），是客户构成分布的真正数据来源。** |

#### 拉新分析（4 个接口）

| 接口路径 | 方法 | 用途 |
|---------|------|------|
| `/crm/statcenter/customer-acquisition/api/overview` | POST | 拉新概况 |
| `/crm/statcenter/customer-acquisition/api/trend-analysis` | POST | 拉新趋势 |
| `/crm/statcenter/customer-acquisition/api/channel-and-way-analysis` | POST | 渠道分析 |
| `/crm/statcenter/customer-acquisition/api/channel-and-way-trend` | POST | 渠道趋势 |

#### 复购分析（3 个接口）

| 接口路径 | 方法 | 用途 |
|---------|------|------|
| `/crm/statcenter/repurchase-retention/api/repurchase-general-view` | POST | 复购概况 |
| `/crm/statcenter/repurchase-retention/api/repurchase-frequency-analysis` | POST | 复购频次分布 |
| `/crm/statcenter/repurchase-retention/api/repurchase-cycle-analysis` | POST | 复购周期分析 |

#### RFM 分析（1 个接口）

| 接口路径 | 方法 | 用途 |
|---------|------|------|
| `/crm/statcenter/rfm-model/api/query-rfm` | GET | RFM 客户分层（通过 query 参数传参） |

#### 客户画像（7 个接口）

| 接口路径 | 方法 | 用途 |
|---------|------|------|
| `/crm/statcenter/holistic-persona/api/basic/customer-statistic` | POST | 客户统计 |
| `/crm/statcenter/holistic-persona/api/basic/gender-distribute` | POST | 性别分布 |
| `/crm/statcenter/holistic-persona/api/basic/age-distribute` | POST | 年龄分布 |
| `/crm/statcenter/holistic-persona/api/basic/region-distribute` | POST | 地域分布 |
| `/crm/statcenter/holistic-persona/api/basic/visit-depth-distribute` | POST | 访问深度 |
| `/crm/statcenter/holistic-persona/api/basic/stay-time-distribute` | POST | 停留时长 |
| `/crm/statcenter/holistic-persona/api/basic/active-distribute` | POST | 活跃度分布 |

#### 新老会员分析（2 个接口）

| 接口路径 | 方法 | 用途 |
|---------|------|------|
| `/crm/statcenter/new-old-member/api/trends` | POST | 新老会员趋势 |
| `/crm/statcenter/new-old-member/api/detail` | POST | 新老会员明细 |

### 代码结构

```
src/
  services/
    youzan/
      auth.ts           — Cookie 有效性检查（读取 config.json 中的 cookie + csrfToken 并验证）
      client.ts         — HTTP 客户端（自动带 Cookie 和 Csrf-Token 请求头）
      types.ts          — 有赞 API 响应类型定义
      apis/
        income.ts       — 收入分析
        acquisition.ts  — 拉新分析
        repurchase.ts   — 复购分析
        aggregator.ts   — 数据聚合器（合并多个接口结果为 DailyReport）
        rfm.ts          — RFM 分析
        persona.ts      — 客户画像
        member.ts       — 新老会员分析
```

## 模块二：Cookie 生命周期管理

### 认证方式（手动配置）

> ⚠️ 扫码登录功能已移除。
> 原因：有赞登录页面每次加载时会生成新的 CSRF Token，自动化扫码登录无法可靠获取该 Token，导致认证失败。

现在改为**手动配置**：用户在浏览器中登录有赞后，从浏览器开发者工具中复制 Cookie 和 CSRF Token，填入 `config.json`。

### 系统行为

- **启动时**：从 `config.json` 读取 `cookie` 和 `csrfToken`
- **每次请求时**：将两者作为 HTTP 请求头发送
  - `Cookie: <cookie>`
  - `Csrf-Token: <csrfToken>`
- **Cookie 失效时**：仪表盘显示文字提示，提示用户手动更新 `config.json`

### Cookie 有效性检查

使用轻量接口验证 Cookie 是否仍然有效：
- 调用 `/v2/dashboard/api/checkLocalLifeAbility.json`
- 返回 200 且 `code === 0` 表示有效
- 返回 302 重定向到 `account.youzan.com/login` 表示失效

### 配置文件

```json
// config.json
{
  "cookie": "登录后的完整 Cookie 字符串（从浏览器 DevTools 复制）",
  "csrfToken": "有赞 Csrf-Token 值（从请求头中复制）",
  "cookieUpdatedAt": "2026-03-28T22:00:00+08:00",
  "port": 4927,
  "storeName": "斑马侠散酒铺",
  "storeFullName": "斑马侠合肥肥东吾悦广场店"
}
```

### 认证错误处理

认证失败时，**不能静默返回全零数据**，必须明确报错。错误分三层传递：

#### 1. 服务层错误类型

| 错误 | 触发条件 | 含义 |
|------|---------|------|
| `NO_COOKIE` | `config.json` 中 `cookie` 字段为空 | Cookie 未配置 |
| `NO_CSRF_TOKEN` | `config.json` 中 `csrfToken` 字段为空 | CSRF Token 未配置 |
| `COOKIE_EXPIRED` | 有赞 API 返回 302 重定向，或响应体 `code === 10100` | 登录态已过期 |

> **有赞认证失效的实际响应**：CSRF Token 过期时，有赞数据接口返回 HTTP 200 + `{"code": 10100, "msg": "页面已过期，请重新刷新页面再提交"}`，而不是 302。`client.ts` 的 `checkAuth()` 方法专门检测 `code === 10100` 并抛出 `COOKIE_EXPIRED`。其他非零 code 不视为认证错误（有赞数据接口的 code 字段无统一语义）。

#### 2. API 路由层 HTTP 响应

| 服务层错误 | HTTP 状态码 | 响应体 |
|-----------|-----------|--------|
| `NO_COOKIE` | 401 | `{"error": "Cookie 未配置，请在 config.json 中填写"}` |
| `NO_CSRF_TOKEN` | 401 | `{"error": "CSRF Token 未配置，请在 config.json 中填写"}` |
| `COOKIE_EXPIRED` | 401 | `{"error": "登录已过期，请重新复制 Cookie 和 CSRF Token"}` |
| `YOUZAN_API_ERROR` | 401 | `{"error": "有赞认证失败（<code>: <msg>）"}` |
| 其他异常 | 500 | `{"error": "<message>"}` |

#### 3. 前端展示

- 收到 401 或 500 → 显示红色错误横幅，提示用户更新 `config.json`
- **不显示全零数据**（数据为空且有错误时，隐藏数据区域，只显示错误）
- 错误横幅文案：`"Cookie 或 CSRF Token 已失效，请在 config.json 中手动更新"`

## 模块三：API 接口层

供 Claude Code、OpenClaw 及其他 Agent 调用的本地 API。

| 路由 | 方法 | 用途 |
|------|------|------|
| `/api/report/daily?date=2026-03-27` | GET | 获取指定日期的结构化数据汇总 |
| `/api/report/compare?date=2026-03-27` | GET | 获取带日环比、周同比、月同比的对比数据 |
| `/api/report/analyze` | POST | 触发 Claude Code 手动分析（流式 SSE 响应） |
| `/api/report/analyze/openclaw` | POST | 触发 OpenClaw 分析（流式 SSE → 收集全文后返回 JSON） |
| `/api/auth/status` | GET | Cookie 有效性检查 |
| `/api/reports` | GET | 历史报告列表 |
| `/api/reports` | POST | 保存 AI 生成的分析报告 |
| `/api/reports/:id` | GET | 获取单份报告详情 |

### `/api/report/daily` 响应结构

```json
{
  "date": "2026-03-27",
  "storeName": "斑马侠散酒铺",
  "income": {
    "payAmount": 1370.14,
    "revenue": 1350.24,
    "refundAmount": 19.90,
    "payCustomerCount": 33,
    "payOrderCount": 38,
    "avgOrderAmount": 41.52,
    "avgTransactionAmount": 36.06,
    "avgItemPrice": 24.47,
    "jointRate": 1.7,
    "refundCustomerCount": 1,
    "refundOrderCount": 1,
    "customerBreakdown": {
      "member": { "amount": 1370.14, "percentage": 100 },
      "nonMember": { "amount": 0, "percentage": 0 },
      "passerby": { "amount": 0, "percentage": 0 }
    }
  },
  "acquisition": {
    "newMemberCount": 0,
    "channelDistribution": {}
  },
  "repurchase": {
    "repurchaseRate": 0,
    "frequencyDistribution": {},
    "cycleAnalysis": {}
  }
}
```

### `/api/report/compare` 响应结构

在 daily 基础上增加对比数据：

```json
{
  "date": "2026-03-27",
  "current": { /* 同 daily 结构 */ },
  "comparison": {
    "dayOverDay": {
      "payAmount": { "value": 1200.00, "change": 0.1418, "direction": "up" }
    },
    "weekOverWeek": {
      "payAmount": { "value": 875.10, "change": 0.5657, "direction": "up" }
    },
    "monthOverMonth": {
      "payAmount": { "value": 980.00, "change": 0.3981, "direction": "up" }
    }
  }
}
```

## 模块四：Web 仪表盘

### 页面结构

```
/                     — 首页/今日概览 Dashboard
/history              — 历史数据查看（日期选择）
/reports              — AI 分析报告列表
/reports/:id          — 单份报告详情
/settings             — 设置（Cookie 状态、手动触发分析）
```

### 首页 Dashboard 布局

```
┌─────────────────────────────────────────────┐
│  斑马侠散酒铺 · 今日数据概览    2026-03-27   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│  │支付额│ │客户数│ │订单数│ │客单价│ │连带率│ │
│  │1,370│ │ 33  │ │ 38  │ │41.52│ │ 1.7 │ │
│  │↑56% │ │↑32% │ │     │ │↑19% │ │↑9%  │ │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │
│                                             │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │  客户构成饼图  │  │   近 7 日收入趋势     │ │
│  │  会员/非会员  │  │   折线图              │ │
│  └──────────────┘  └──────────────────────┘ │
│                                             │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │  今日拉新      │  │  最新 AI 分析报告    │ │
│  │  新增会员数    │  │  (点击查看详情)      │ │
│  └──────────────┘  └──────────────────────┘ │
│                                             │
│  ┌───────────────┐  ┌───────────────────┐  │
│  │  [手动分析]    │  │  [OpenClaw 分析]  │  │
│  │  (Claude)     │  │  (绿色按钮)       │  │
│  └───────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────┘
```

### Cookie 失效提示

当检测到 Cookie 失效时，仪表盘显示文字提示（不再弹出二维码）：

```
登录已过期，请手动更新 config.json 中的 cookie 和 csrfToken
```

> 扫码登录弹窗（`QRCodeModal`）已移除。

## 模块五：Agent Skill

在 `~/Agent/Skills/productivity/banmaxia-store-analytics/` 创建 Skill，供所有 Agent 使用。

### Skill 职责

- 告诉 Agent 如何调用本地 API 获取门店数据
- 定义数据结构和分析维度
- 提供报告格式模板和分析指引
- 指导如何保存报告

### Skill 使用场景

- **Claude Code scheduled task**：每晚 10 点触发，调用 Skill 获取数据、分析、通过 computer use 操作微信发送
- **OpenClaw Webhook/Cron**：同样触发，使用自身模型分析，通过微信 Channel 发送
- **手动触发**：Web 仪表盘点击「手动分析」按钮，通知 Agent 执行

### 分析维度指引

#### 日报（每日必看）

1. **营收核心**：支付金额、营业收入、退款金额、支付客户数、订单数、客单价、笔单价、连带率
2. **日环比/周同比**：与昨日、上周同日对比
3. **客户构成**：会员 vs 非会员 vs 流水客收入占比
4. **拉新情况**：新增会员数、渠道分布

#### 周报/月报（深度分析）

5. **复购分析**：复购率、频次分布、复购周期
6. **新老会员对比**：消费金额、客单价、订单数对比
7. **客户画像**：性别/年龄/地域/活跃度分布
8. **RFM 模型**：客户价值分层、沉睡客户预警

## 模块六：消息推送

### 推送渠道

| 渠道 | 负责 Agent | 推送方式 | 接收人 |
|------|-----------|---------|--------|
| 微信 | Claude Code | Computer Use 操作微信客户端 | 我 + 我爸 |
| 微信 | OpenClaw | 微信 Channel | 我 + 我爸 |

### 推送时机

- **每日 22:00**：自动生成并推送日报
- **Cookie 失效时**：推送提醒扫码
- **手动触发**：Web 仪表盘点击按钮后推送

### 报告格式

推送的消息应简洁易读，适合微信阅读：

```
斑马侠散酒铺 · 3月27日日报

营收：¥1,370.14 (↑56.6%)
客户：33人 (↑32%)
订单：38单
客单价：¥41.52 (↑18.6%)
连带率：1.7 (↑9%)
退款：¥19.90 (1单)

会员贡献 100%，非会员 0%

[AI 分析摘要]
今日营收较上周四增长56.6%，主要由会员消费驱动...
建议关注...
```

## 模块七：报告存储

### 存储结构

```
reports/
  2026/
    03/
      2026-03-27-daily.md          — 日报数据
      2026-03-27-claude.md         — Claude 分析报告
      2026-03-27-openclaw.md       — OpenClaw 分析报告
      2026-03-weekly-w13.md        — 第 13 周周报
```

### 报告内容

每份报告包含：
- 元数据（日期、生成时间、生成者）
- 原始数据摘要
- AI 分析内容
- 关键洞察和建议

## 项目结构

```
banmaxia-store-analytics/
├── src/
│   ├── app/                        — Next.js App Router
│   │   ├── page.tsx                — 首页 Dashboard
│   │   ├── history/page.tsx        — 历史数据（默认日期：昨天）
│   │   ├── reports/page.tsx        — 报告列表
│   │   ├── reports/[id]/page.tsx   — 报告详情
│   │   ├── settings/page.tsx       — 设置页
│   │   └── api/
│   │       ├── report/
│   │       │   ├── daily/route.ts
│   │       │   ├── compare/route.ts
│   │       │   └── analyze/
│   │       │       ├── route.ts            — Claude 手动分析
│   │       │       └── openclaw/route.ts   — OpenClaw 分析
│   │       ├── auth/
│   │       │   └── status/route.ts
│   │       └── reports/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   ├── components/                 — React 组件
│   │   ├── StatCard.tsx
│   │   ├── StatsGrid.tsx
│   │   ├── CustomerPieChart.tsx    — 会员/非会员/流水客饼图
│   │   ├── IncomeTrendChart.tsx    — 近 7 日收入趋势折线图
│   │   ├── ReportCard.tsx
│   │   ├── Navbar.tsx
│   │   └── DatePicker.tsx
│   ├── services/
│   │   └── youzan/
│   │       ├── auth.ts             — Cookie 有效性检查
│   │       ├── client.ts           — HTTP 客户端（Cookie + Csrf-Token）
│   │       ├── types.ts
│   │       └── apis/
│   │           ├── income.ts
│   │           ├── acquisition.ts
│   │           ├── repurchase.ts
│   │           ├── aggregator.ts   — 数据聚合（fetchDailyReport、fetchCompareReport）
│   │           ├── rfm.ts
│   │           ├── persona.ts
│   │           └── member.ts
│   └── lib/
│       ├── config.ts               — 配置管理（AppConfig 含 csrfToken 字段）
│       ├── reports.ts              — 报告读写
│       └── date-utils.ts           — 日期工具
├── __tests__/                      — 单元测试（19 个）
├── reports/                        — AI 分析报告存储（gitignored）
├── config.json                     — 运行时配置（gitignored）
├── config.example.json             — 配置示例（已提交）
├── ecosystem.config.js             — PM2 配置（fork 模式）
├── .env.local                      — 本地环境变量（gitignored）
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## 部署与运维

### 启动方式

```bash
# 开发（需先在 .env.local 配置 OPENCLAW_GATEWAY_TOKEN）
pnpm dev

# 生产
pnpm build
pm2 start ecosystem.config.js
```

### 进程管理

- 使用 PM2 + `ecosystem.config.js` 管理进程（**fork 模式**，cluster 模式与 Next.js CLI 不兼容）
- 自动重启，最多 10 次，间隔 5 秒
- `OPENCLAW_GATEWAY_TOKEN` 通过 ecosystem.config.js 的 env 块传入
- 后续服务增多时迁移到 Docker Compose

### 环境变量

| 变量 | 位置 | 说明 |
|------|------|------|
| `OPENCLAW_GATEWAY_TOKEN` | `.env.local`（开发）/ `ecosystem.config.js` env（生产） | OpenClaw 网关 Token |

### 未来扩展

- 增加更多数据指标（按需添加有赞 API）
- 接入更多 Agent（Gemini、Antigravity 等，通过 Skill 自动同步）
- 多店铺支持（配置多组 Cookie + kdtIds）
- 迁移到 Docker Compose 统一管理多服务
