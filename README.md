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
- **外观与首页视频氛围**：支持浅色 / 深色 / 跟随系统三态主题与后台可选强调色预设（极简水墨 / 暖纸书卷 / 暗夜青灰 / 深邃靛蓝）；首页直接加载压缩优化后的双主题动态视频背景（~1MB `faststart` MP4），并自动适配 `prefers-reduced-motion` 与省流模式。
- **富文本与技术写作增强**：
  - 代码块支持可选真实文件名（`lang:filename` 或 `lang title="..."`）、行高亮（`{1,3-5}`）、语言标签、自动换行切换、一键复制、折叠展开、Diff 增删行高亮与行号；
  - 支持 LaTeX 数学公式（KaTeX 按需仅在文章/编辑器加载）、响应式横向滚动表格、图片底部图注与多图全屏灯箱预览（支持滚轮缩放、键盘左右切换与 ESC 关闭）、外部链接悬停预览卡片、标题 `#` 锚点一键复制；
  - 内置 13 种交互式富文本块（提示框、标签页、折叠面板、图集、轮播、卡片组、时间轴、流程/架构图、音视频嵌入等）。
- **双语阅读与 AI 导读**：文章顶部展示可折叠的 AI 导读摘要与延伸问答（FAQ）；已发布译文支持 `?lang=` 切换并联动全界面语言、日期、阅读时长、分享链接与 Giscus 评论语言；支持一键生成文章分享海报 PNG。
- **完整内容发现闭环**：首页精选置顶 + 最近写作；`/posts` 支持「列表 / 年份归档」双视图、年份/标签筛选、排序与分页加载；`/tags` 支持搜索与排序、标签详情页提供横向胶囊快切条；文末提供上一篇/下一篇、基于共享标签的相关推荐与版权署名；顶部 `⌘K` / `Ctrl K` 命令面板按需加载 Orama 中文全文搜索，并内置主题切换、随机文章与复制 RSS 快捷命令。

### ✍️ 飞书风创作者工作台与多模型 AI 助手
- **三栏沉浸式编辑器（TipTap 3）**：左侧实时大纲、中间无边框画布、右侧可折叠元数据检查器，支持 `Ctrl+\` 专注模式、`Ctrl+S` 快捷保存、标题/摘要实时字数统计、乐观锁防多窗口覆盖、文章快照历史 API（`post_revisions`）、草稿与发布校验分级、真正生效的定时发布。
- **高效编辑工作流**：
  - `/` 斜杠命令全量支持中英文快捷别名（`/h1`–`/h3`、`/code`、`/math`、`/img`、`/callout` 等）与 LaTeX 行内/块级公式插入；
  - 选中文字气泡菜单支持基础格式、文字颜色、转为行内公式、清除格式、安全链接校验与 **AI 快捷写作菜单（润色 / 精简 / 扩写 / 正式化）**；
  - 富文本块支持单例检查器、列表项上下排序、图集/轮播直连媒体库选图，以及译文弹窗内自动内联编辑；
  - 支持多图剪贴板粘贴与拖放（自动 WebP 压缩）、`.md` 文件拖入预览确认导入与一键导出完整 Markdown（含富文本块降级输出）、已有标签自动联想、**草稿实时预览页**（`/admin/posts/[id]/preview`）。
- **自建多供应商 AI 写作与翻译中心（`/admin/ai`）**：
  - 兼容 OpenAI-Compatible、Anthropic、Gemini 三大协议，内置 429/5xx 指数退避重试，API Key 使用独立主密钥 AES-256-GCM 加密存储；
  - 支持按任务路由模型与 Prompt 调试、AI 导读摘要（含 FAQ 可视化编辑）、SEO/标签建议、长文分片多语言翻译（含未保存提醒）、选中文本 AI 润色（含**红绿 Diff 对比预览**）、批量处理中心与全量聚合日志/费用估算（支持时间筛选与分页）。

### 🛠️ 后台管理、媒体库与自动化运维
- **运营仪表盘（`/admin`）**：4 列核心 KPI（已发布/草稿/Redis 实时阅读量/累计点赞）、52 周创作热力图、热门文章 Top 5、主题标签分布图、待审友链（含顶栏红点徽章）、30 天陈旧草稿与 AI 异常预警，以及 **一键导出全站 JSON 数据备份**（`/api/admin/export`）。
- **现代媒体库（`/admin/media`）**：多图拖拽上传、页面内 `Ctrl+V` 剪贴板粘贴上传、实时上传进度条、大图客户端自动 WebP 压缩、分页加载（含媒体选择器分页）、**单删与批删前文章/译文引用检测防误删**。
- **友链工作流（`/friends` & `/admin/friends`）**：公开页提供「本站友链交换信息卡片（一键复制 URL/Markdown/JSON）」与带蜜罐、CSRF、限流防护的自助申请；后台待审置顶、状态筛选、一键批量通过、**友链存活性一键检测**，审核自动刷新缓存。
- **全站联动系统设置 & 邮件预览台（`/admin/settings`）**：站点标题/副标题、Favicon、页脚文案与开关、建站日期、站点强调色预设、自定义全局 CSS、作者信息、社交链接、Google/Baidu 验证、默认 OG 图、评论开关与维护模式（站长登录可预览前台）全面同步前台；内置**自动化邮件实时预览（桌面/手机）与一键发送测试邮件**。
- **纸质编辑风自动化通知邮件（Resend）**：每周内容与站点健康简报（Vercel Cron）、Giscus 新评论通知（GitHub Webhook + 幂等去重）、友链申请提醒、后台登录安全提醒。

### 🔍 SEO、动态分发与安全加固
- **规范化 SEO**：统一 `/posts/<public_id>` 301 永久重定向（避免搜索引擎重复收录与 Giscus 讨论分裂），完整输出 `canonical`、`hreflang`、OpenGraph、Twitter Card 与 JSON-LD（`BlogPosting` + `BreadcrumbList` + `FAQPage`），动态生成带中文字体的文章 OG 图。
- **动态订阅源与站点地图**：`/rss.xml`、`/atom.xml`、`/rss.json` 与 `/sitemap.xml` 全部为动态 ISR 路由，发新文自动按需刷新；`/robots.txt` 自动屏蔽 `/admin`、`/api/` 与 `/components`（`/components` 生产环境自动返回 404）。
- **全链路安全防护**：管理员鉴权 Fail-Closed（必须配置 `ADMIN_EMAIL`）、HttpOnly 双 Cookie 自动无感续期（`proxy.ts` 覆盖 `/admin/*` 与 `/api/admin/*` 并校验写请求同源 `Origin`）、恒定时间 CSRF 校验、Upstash Redis 加权滑动窗口限流（登录/友链/链接预览/阅读点赞）、链接预览严格 DNS + 重定向防 SSRF、媒体服务端真实文件魔数校验与防路径穿越、全局 CSP 及安全响应头。

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
