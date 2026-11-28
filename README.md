# emmm's Blog

基于 **Next.js 16（App Router + Turbopack）**、**React 19**、**Tailwind CSS v4**、**TipTap 3**、**Supabase** 与 **Upstash Redis** 构建的现代化全栈个人博客与自建 AI 出版系统。

- **在线访问**：[https://blog.zzemy.top](https://blog.zzemy.top)
- **项目仓库**：[https://github.com/zzemy/my-blog](https://github.com/zzemy/my-blog)
- **开源授权**：代码采用 [AGPL-3.0-only](LICENSE)，原创内容与媒体采用 [CC BY-NC-SA 4.0](CONTENT_LICENSE.md)。

---

## 核心特性

### 📖 极致阅读观感与交互体验
- **服务端正文 SSR + 客户端渐进增强**：文章页由服务端直接输出完整语义化 HTML（搜索引擎与首屏立即可读），挂载后无缝切换至交互式 TipTap 阅读器。
- **读者端排版控制与沉浸模式**：支持字号（小/标准/大/特大）、版心宽度（专注/标准/宽屏）、正文字体（霞鹜文楷/黑体/宋体）持久化配置，以及一键沉浸阅读模式（`Esc` 退出）与完整 `@media print` 打印样式。
- **外观与背景引擎**：支持浅色 / 深色 / 跟随系统三态主题，前台可自由切换首页背景氛围（动态氛围视频 / 极简点阵 / 细密网格 / 纯净无背景），并自动适配 `prefers-reduced-motion` 与省流模式。
- **富文本与技术写作增强**：
  - 代码块支持可选真实文件名（`lang:filename`）、语言标签、自动换行切换、一键复制、折叠展开、Diff 增删行高亮与行号；
  - 支持 LaTeX 数学公式（KaTeX）、响应式横向滚动表格、图片全屏灯箱预览（含图注与 ESC 关闭）、外部链接悬停预览卡片、标题 `#` 锚点一键复制；
  - 内置 13 种交互式富文本块（提示框、标签页、折叠面板、图集、轮播、卡片组、时间轴、流程/架构图、音视频嵌入等）。
- **双语阅读与 AI 导读**：文章顶部展示可折叠的 AI 导读摘要与延伸问答（FAQ）；已发布译文支持 `?lang=` 切换并联动全界面语言、日期、阅读时长、分享链接与 Giscus 评论语言。
- **完整内容发现闭环**：首页精选置顶 + 最近写作；`/posts` 支持「列表 / 年月时间轴归档」双视图与标签筛选；文末提供上一篇/下一篇、基于共享标签的相关推荐与版权署名；顶部 `⌘K` / `Ctrl K` 命令面板按需加载 Orama 中文全文搜索（支持标题/正文/标签范围与正文命中片段高亮）。

### ✍️ 飞书风创作者工作台与多模型 AI 助手
- **三栏沉浸式编辑器（TipTap 3）**：左侧实时大纲、中间无边框画布、右侧可折叠元数据检查器，支持 `Ctrl+\` 专注模式、`Ctrl+S` 快捷保存、本地草稿自动备份恢复、草稿与发布校验分级、真正生效的定时发布。
- **高效编辑工作流**：
  - `/` 斜杠命令支持中英文别名（`/h2`、`/code`、`/math` 等）与 LaTeX 行内/块级公式插入；
  - 选中文字气泡菜单支持基础格式、清除格式、安全链接校验与一键 **「AI 润色」**；
  - 支持多图剪贴板粘贴与拖放、`.md` 文件直接拖入导入与一键导出带 Frontmatter 的 Markdown、已有标签自动联想、**草稿实时预览页**（`/admin/posts/[id]/preview`）。
- **自建多供应商 AI 写作与翻译中心（`/admin/ai`）**：
  - 兼容 OpenAI-Compatible、Anthropic、Gemini 三大协议，API Key 使用 AES-256-GCM 加密存储；
  - 支持按任务路由模型与 Prompt 调试、AI 导读摘要（含 FAQ 可视化编辑）、SEO/标签建议、长文分片多语言翻译、选中文本 AI 润色（含**红绿 Diff 对比预览**）、批量处理中心与全量调用日志统计。

### 🛠️ 后台管理、媒体库与自动化运维
- **运营仪表盘（`/admin`）**：4 列核心 KPI（已发布/草稿/Redis 实时阅读量/累计点赞）、52 周创作热力图、热门文章 Top 5、主题标签分布图、待审友链与 AI 异常预警，以及 **一键导出全站 JSON 数据备份**（`/api/admin/export`）。
- **现代媒体库（`/admin/media`）**：多图拖拽上传、页面内 `Ctrl+V` 剪贴板粘贴上传、大图客户端自动 WebP 压缩、分页加载、**删除前文章引用检测防误删**、批量删除。
- **友链工作流（`/friends` & `/admin/friends`）**：公开页提供「本站友链交换信息卡片（一键复制 URL/Markdown/JSON）」与带蜜罐、CSRF、限流防护的自助申请；后台待审置顶、状态筛选、直显私有联系方式与备注，审核自动刷新缓存。
- **全站联动系统设置 & 邮件预览台（`/admin/settings`）**：站点标题/副标题、Favicon、页脚文案与开关、作者信息、社交链接、Google/Baidu 验证、默认 OG 图、评论开关与维护模式全面同步前台；内置**自动化邮件实时预览（桌面/手机）与一键发送测试邮件**。
- **纸质编辑风自动化通知邮件（Resend）**：每周内容与站点健康简报（Vercel Cron）、Giscus 新评论通知（GitHub Webhook + 幂等去重）、友链申请提醒、后台登录安全提醒。

### 🔍 SEO、动态分发与安全加固
- **规范化 SEO**：统一 `/posts/<public_id>` 301 永久重定向（避免搜索引擎重复收录与 Giscus 讨论分裂），完整输出 `canonical`、`hreflang`、OpenGraph、Twitter Card 与 JSON-LD（`BlogPosting` + `BreadcrumbList` + `FAQPage`），动态生成带中文字体的文章 OG 图。
- **动态订阅源与站点地图**：`/rss.xml`、`/atom.xml`、`/rss.json` 与 `/sitemap.xml` 全部为动态 ISR 路由，发新文自动按需刷新；`/robots.txt` 自动屏蔽 `/admin`、`/api/` 与 `/components`。
- **全链路安全防护**：管理员鉴权 Fail-Closed（必须配置 `ADMIN_EMAIL`）、HttpOnly 双 Cookie 自动无感续期（`proxy.ts` 覆盖 `/admin/*` 与 `/api/admin/*`）、恒定时间 CSRF 校验、Upstash Redis 滑窗限流（登录/友链/链接预览/阅读点赞）、链接预览严格 DNS + 重定向防 SSRF、媒体服务端 MIME/大小校验与防路径穿越、全局安全响应头。

---

## 技术栈

- **框架与运行时**：Next.js 16 (App Router / Turbopack)、React 19、TypeScript 5
- **样式与组件**：Tailwind CSS v4、`@tailwindcss/typography`、Radix UI / shadcn/ui、Lucide React、Framer Motion、Lenis、Lottie React、霞鹜文楷（`@fontsource/lxgw-wenkai`）
- **编辑器与排版**：TipTap 3、lowlight、KaTeX、remark / rehype (`remark-gfm`, `remark-math`)
- **数据、搜索与基础设施**：Supabase (PostgreSQL + Auth + Storage + RLS)、Upstash Redis、Orama (`@orama/orama` + 中文分词器)、Resend、Giscus、`feed`、Zod、Zustand、Vercel Analytics & Speed Insights

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并按需配置：

```env
# 站点地址
NEXT_PUBLIC_SITE_URL=https://blog.zzemy.top

# Supabase（必填）
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 管理员邮箱（必填，用于后台鉴权）
ADMIN_EMAIL=you@example.com

# Upstash Redis（推荐，用于阅读量/点赞统计、接口限流、链接预览缓存与 Webhook 去重）
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# AI 密钥加密主密钥（启用 AI 中心时建议单独配置）
AI_ENCRYPTION_KEY=your-strong-random-secret

# Resend 邮件通知（选填，用于周报、评论、友链、登录提醒与后台测试邮件）
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL="Blog <notify@yourdomain.com>"
ADMIN_NOTIFICATION_EMAIL=you@example.com
ADMIN_LOGIN_EMAIL_NOTIFICATIONS=false

# Webhook & Cron 校验密钥（选填）
GITHUB_WEBHOOK_SECRET=your-webhook-secret
SITE_HEALTH_CRON_SECRET=your-cron-secret
```

### 3. 初始化数据库

在 Supabase 控制台 SQL Editor 中依次执行 `supabase/schema.sql` 与 `supabase/migrations/` 下的迁移脚本，并在 Storage 中创建公开可读的 `images` Bucket。

### 4. 启动开发与构建验证

```bash
pnpm dev                     # 启动本地开发（Turbopack）
pnpm exec tsc --noEmit       # 全量 TypeScript 类型检查
pnpm lint                    # ESLint 检查
pnpm build                   # 生产构建
```

---

## 目录结构

```text
├── app/                      # Next.js App Router 路由（前台、后台、API、动态 RSS/Sitemap/OG）
│   ├── admin/                # 后台管理（仪表盘、文章/编辑器/草稿预览、媒体库、友链、AI、设置）
│   ├── api/                  # 公开与后台 REST API、Cron、GitHub Webhook、导出备份
│   ├── posts/                # 文章归档与详情页（SSR + 动态 OG）
│   ├── tags/                 # 标签索引与标签聚合页
│   ├── friends/              # 友情链接与自助申请页
│   ├── guestbook/            # 留言板
│   ├── rss.xml/ atom.xml/ rss.json/  # 动态 ISR 订阅源
│   └── styles/               # 文章阅读排版、代码高亮与打印样式
├── features/                 # 按业务域组织的模块（admin / ai / auth / blog / friends）
├── shared/                   # 全局布局（Header/Footer/CommandMenu/SettingsContext）与视觉动效
├── components/ui/            # shadcn/ui 基础组件
├── lib/                      # 鉴权、限流、CSRF、邮件模板、AI 引擎、Supabase 与校验 Schema
├── supabase/                 # 数据库 Schema 与增量迁移脚本
└── proxy.ts                  # Next.js 16 路由保护与会话无感续期
```

> 导航栏中的「关于」直接指向本 GitHub 仓库（[zzemy/my-blog](https://github.com/zzemy/my-blog)）。

---

## License

- 代码：AGPL-3.0-only（见 [LICENSE](LICENSE)）
- 原创内容与媒体：CC BY-NC-SA 4.0（见 [CONTENT_LICENSE.md](CONTENT_LICENSE.md)）
