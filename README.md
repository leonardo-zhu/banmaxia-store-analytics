# 斑马侠散酒铺 - 门店数据分析系统

为「斑马侠散酒铺」（合肥肥东吾悦广场店）构建的本地门店数据分析系统。对接有赞 CRM 数据中心，提供实时数据查看、AI 分析报告生成与存储。

## 技术栈

- **框架**: Next.js 16 + React 19 + TypeScript
- **UI**: Tailwind CSS v4 + Recharts
- **测试**: Jest + React Testing Library
- **包管理**: pnpm

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置有赞登录凭证
cp config.example.json config.json
# 编辑 config.json，填入 cookie 和 csrfToken

# 启动开发服务器
pnpm dev
```

访问 http://localhost:4927

## 配置

在 `config.json` 中手动维护有赞登录凭证：

```json
{
  "cookie": "从浏览器复制的完整 Cookie",
  "csrfToken": "从页面提取的 CSRF Token",
  "cookieUpdatedAt": "2026-03-29T22:00:00+08:00",
  "port": 4927,
  "storeName": "斑马侠散酒铺",
  "storeFullName": "斑马侠合肥肥东吾悦广场店"
}
```

Cookie 和 csrfToken 过期后需手动登录有赞后台更新。

## 页面

| 路由 | 功能 |
|------|------|
| `/` | 今日数据概览（指标卡片、客户饼图、7日趋势、最新报告） |
| `/history` | 历史数据查看（日期选择） |
| `/reports` | AI 分析报告列表 |
| `/reports/:id` | 报告详情 |
| `/settings` | 登录状态检查、系统信息 |

## API

| 路由 | 方法 | 用途 |
|------|------|------|
| `/api/report/daily?date=YYYY-MM-DD` | GET | 单日结构化数据 |
| `/api/report/compare?date=YYYY-MM-DD` | GET | 带日环比/周同比/月同比的对比数据 + 7日趋势 |
| `/api/report/analyze` | POST | 触发分析并保存报告 |
| `/api/auth/status` | GET | Cookie 有效性检查 |
| `/api/reports` | GET/POST | 报告列表 / 保存报告 |
| `/api/reports/:id` | GET | 单份报告详情 |

## 有赞数据源

对接 24 个有赞 CRM API，覆盖：

- **收入分析**（7 个）: 概况、客户构成、趋势、渠道明细
- **拉新分析**（4 个）: 概况、趋势、渠道分布
- **复购分析**（3 个）: 概况、频次分布、周期分析
- **客户画像**（7 个）: 性别/年龄/地域/活跃度分布
- **新老会员**（2 个）: 趋势、明细
- **RFM 模型**（1 个）: 客户价值分层

## Agent Skill

提供 `banmaxia-store-analytics` Skill 供 AI Agent 使用：

```bash
# Agent 工作流
curl http://localhost:4927/api/auth/status          # 1. 检查登录
curl http://localhost:4927/api/report/compare        # 2. 获取数据
# 3. AI 分析生成报告
curl -X POST http://localhost:4927/api/reports ...   # 4. 保存报告
```

## 开发

```bash
pnpm test          # 运行测试
pnpm test:watch    # 监听模式
pnpm build         # 生产构建
pnpm start         # 启动生产服务
pnpm lint          # 代码检查
```

## 项目结构

```
src/
  app/                    Next.js App Router (页面 + API 路由)
  components/             React 组件 (StatsGrid, Charts, ReportCard...)
  services/youzan/        有赞 API 服务层
    client.ts             HTTP 客户端
    auth.ts               认证状态检查
    types.ts              TypeScript 类型定义
    apis/                 各业务模块 API (income, acquisition, repurchase...)
  lib/                    工具库 (config, date-utils, reports)
reports/                  AI 分析报告存储 (Markdown + frontmatter)
```
