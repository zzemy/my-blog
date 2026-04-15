# emmm's Blog & Portfolio

基于 Next.js 16、Tailwind CSS v4、TipTap 和 Supabase 构建的现代化个人博客与轻量作品集。默认内置外链悬浮预览、图片点击放大、代码块复制、Giscus 评论等体验型能力。

**在线访问**: [https://emmmxx.xyz](https://emmmxx.xyz)
**用途定位**: 个人技术博客 + 简历/作品集补充，集中展示项目案例、工程化思路与可运行 Demo。

**授权**：代码采用 [AGPL-3.0](LICENSE)，原创内容/媒体采用 [CC BY-NC-SA 4.0](CONTENT_LICENSE.md)。

---

## 技术栈

### 核心框架与语言

- **Next.js 16** (App Router, Turbopack) - React 全栈框架
- **React 19** - UI 库
- **TypeScript** - 类型安全

### 样式与 UI

- **Tailwind CSS v4** - 原子化 CSS 框架
- **@tailwindcss/typography** - 排版插件
- **shadcn/ui** - 可组合 UI 组件库
- **Radix UI** - 无障碍原语组件
- **Lucide React** - 图标库
- **class-variance-authority (CVA)** - 组件变体管理
- **tailwind-merge** - 类名合并工具

### 动画与视觉特效

- **Framer Motion** - React 动画库
- **纯 CSS/SVG 手绘风动效** - 自研的涂鸦纸飞机、云朵与波浪视觉特效
- **Lottie React** - 矢量动画（404 页面）
- **Lenis** - 平滑滚动
- **Canvas Confetti** - 交互式五彩纸屑效果
- **medium-zoom** - 图片放大预览

### 内容管理

- **TipTap 3** - 富文本编辑器（基于 ProseMirror）
  - 支持扩展：代码块、表格、任务列表、字数统计、排版优化等
- **lowlight** - 代码高亮（集成到 TipTap）
- **shiki** - VS Code 同款语法高亮
- **rehype-pretty-code** - Markdown 代码美化
- **外链预览** - 自动将外部链接替换为 Hover 预览卡片，可点击新开
- **自动识别 URL** - 正文纯文本内的 `https://` 自动变为可点击链接
- **图片放大与代码复制** - medium-zoom 预览图片，代码块一键复制

### 后端与数据

- **Supabase** - BaaS 平台
  - PostgreSQL 数据库
  - Auth 身份验证
  - Storage 对象存储
  - SSR 支持 (@supabase/ssr)
- **Upstash Redis** - 边缘计算缓存（浏览量/点赞数）
- **Zustand** - 轻量状态管理

### 内容处理

- **gray-matter** - Markdown Frontmatter 解析
- **remark** / **rehype** - Markdown/HTML 处理管道
  - remark-gfm (GitHub Flavored Markdown)
  - remark-math + rehype-katex (数学公式)
  - rehype-slug (标题锚点)
- **reading-time** - 阅读时长估算
- **pinyin-pro** - 中文转拼音（自动生成 URL slug）

### 国际化与搜索

- **next-intl** - Next.js 多语言方案（支持 zh, en, fr, ja）
- **@orama/orama** - 客户端全文搜索引擎
- **fuse.js** - 模糊搜索库

### 数据可视化

- **Recharts** - React 图表库（管理后台数据看板）
- **date-fns** - 日期处理库（支持本地化）

### 评论与社交

- **Giscus** - GitHub Discussions 评论系统（文章页默认启用，可在后台设置关闭）
- **feed** - RSS/Atom 订阅源生成

### 分析与监控

- **@vercel/analytics** - Vercel Web Analytics
- **@vercel/speed-insights** - 性能监控

### 开发工具

- **ESLint 9** - 代码检查
- **PostCSS** - CSS 处理
- **undici** - 高性能 HTTP 客户端

---

## 核心特性

### 🎨 沉浸式用户体验

- **响应式手绘视觉**：完美适配移动端与桌面端的纯 SVG 手绘涂鸦特效（热气球、云朵、波浪）
- **3D 悬浮卡片**：基于 Framer Motion 的交互式卡片动效
- **磁力按钮**：鼠标靠近时按钮元素跟随磁吸效果
- **平滑滚动**：Lenis 驱动的流畅滚动体验
- **Lottie 动画**：404 页面使用矢量动画增强趣味性

### 📝 强大的内容管理系统

- **TipTap 富文本编辑器**：
  - 拖拽图片上传（Supabase Storage）
  - 代码高亮（支持 100+ 语言）
  - 表格编辑与任务列表
  - 字数统计与排版优化
  - 支持 Markdown 快捷键
- **管理后台仪表盘**：
  - GitHub 风格创作热力图（52 周活跃度）
  - 实时统计：文章数、草稿数、总阅读量
  - 草稿快速访问
- **实时预览**：编辑时同步渲染 Markdown 效果

### 🛡️ 数据自主与安全

- **Supabase 托管**：完整数据所有权，支持自建部署
- **Row Level Security (RLS)**：数据库级权限控制
- **边缘缓存**：Upstash Redis 提供毫秒级读写

### 🌍 国际化支持

- **路由级多语言**：`/zh/posts`, `/en/posts` 等独立路径
- **fallback 机制**：缺失翻译时自动回退到中文
- **SEO 友好**：hreflang 标签自动生成

### 🚀 极致性能

- **Turbopack**：Next.js 16 开发构建提速 700%
- **ISR**：Incremental Static Regeneration，按需重新生成静态页面
- **图片优化**：Next.js Image 自动 WebP 转换、响应式加载
- **字体优化**：Google Fonts 自托管，减少外部请求
- **代码分割**：路由级按需加载，减小初始包体积

### 📈 多维统计

- **Vercel Analytics**：流量分析、地理分布、设备占比
- **自建阅读量系统**：基于 Upstash Redis 的实时计数
- **管理后台可视化**：Recharts 驱动的数据图表

### 📄 About 页作为可编辑文章

- 从后台 `slug=about` 文章读取内容
- 可在管理端编辑/发布，不出现在前台文章列表
- 支持多语言，自动回退到中文版本
- 便于更新个人介绍与作品集内容

---

## 管理后台

本项目包含一个功能完备的后台管理系统 (`/admin`)。

### 访问方式

- **本地开发**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **线上环境**: [https://emmmxx.xyz/admin](https://emmmxx.xyz/admin)

### 功能亮点

#### 数据看板

- **创作活跃度热力图**：GitHub 风格的 52 周活跃度可视化（Recharts）
- **待办事项**：快速访问未完成的草稿
- **实时统计卡片**：
  - 总文章数
  - 草稿箱数量
  - 累计阅读量（来自 Upstash Redis）

#### 文章管理

- **完整 CRUD**：创建、编辑、删除、发布/取消发布
- **多语言支持**：每篇文章可独立设置语言（zh, en, fr, ja）
- **自定义 Slug**：手动指定 URL 路径或自动生成（中文自动转拼音）
- **封面上传**：集成 Supabase Storage
- **SEO 优化**：独立设置 SEO 标题与描述
- **标签管理**：多标签支持，自动聚合统计

#### 系统设置

- 站点名称、描述、关键词
- Favicon 配置
- 页脚文案自定义

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填入以下服务的 Key：

#### Supabase (必填)

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Upstash Redis (选填，用于浏览量统计)

```env
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

#### Giscus (选填，评论系统)

```env
NEXT_PUBLIC_GISCUS_REPO=your-github-repo
NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
```

### 3. 初始化数据库

访问 Supabase 控制台，在 SQL Editor 中运行 `supabase/schema.sql` 创建表结构：

- `posts` 表：文章存储
- `tags` 表：标签聚合
- `site_settings` 表：站点配置
- 相关 RLS (Row Level Security) 策略
- 触发器（标签自动更新、浏览量递增等）

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可看到效果。

### 5. 访问后台管理

访问 [http://localhost:3000/admin](http://localhost:3000/admin)，使用 Supabase Auth 登录（需在 Supabase 控制台创建用户）。

---

## 目录结构

```
├── app/                      # Next.js App Router 路由（前台 + 后台 + API）
│   ├── (root)/
│   ├── [locale]/             # 国际化页面（zh/en/fr/ja）
│   ├── admin/
│   └── api/
├── features/                 # 业务域模块（feature-first）
│   ├── admin/
│   ├── auth/
│   └── blog/
├── shared/                   # 跨业务共享模块
│   ├── components/
│   ├── effects/
│   ├── layout/
│   └── visuals/
├── components/ui/            # shadcn/ui 基础组件（保留）
├── lib/                      # 工具函数、数据访问、类型
│   ├── supabase/
│   ├── auth.ts
│   ├── site-settings.ts
│   └── utils.ts
├── messages/                 # i18n 文案
├── content/posts/            # Markdown 内容源
├── public/                   # 静态资源 + RSS
├── scripts/                  # 构建脚本（如 RSS 生成）
├── supabase/                 # schema 与 migrations
└── proxy.ts                  # 路由保护（Next.js 16 proxy 约定）
```

### 架构说明（当前）

- 业务代码统一在 `features/*`（如 `features/blog/editor`、`features/admin/components`）
- 公共能力统一在 `shared/*`（如 `shared/layout`、`shared/effects`）
- 旧的 `components/*` 业务路径已迁移，ESLint 已限制回流到旧路径
- `components/ui/*` 作为基础 UI 层继续保留

---

## 常用命令

| 命令             | 说明                                    |
| ---------------- | --------------------------------------- |
| `pnpm dev`     | 启动本地开发服务器（Turbopack 加速）    |
| `pnpm build`   | 构建生产版本并生成 RSS/Sitemap          |
| `pnpm start`   | 启动生产服务器                          |
| `pnpm lint .`  | 运行 ESLint 代码检查                    |
| `pnpm exec tsc --noEmit` | 运行 TypeScript 全量类型检查 |
| `pnpm publish` | 快捷发布命令（git add + commit + push） |

---

## 部署

由 [Vercel](https://vercel.com) 提供自动部署支持。推送到 `main` 分支即可自动触发构建。

```bash
git push origin main
```

### 注意事项

- **环境变量**：确保在 Vercel 项目设置中配置所有必需的环境变量
- **数据库迁移**：Supabase 数据库需预先运行 `supabase/schema.sql`
- **Storage Bucket**：在 Supabase 控制台创建 `images` bucket 用于图片上传
- **RLS 策略**：确保 Supabase RLS 策略已正确配置（详见 schema.sql）

---

## 环境变量完整列表

### Supabase (必填)

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密钥（公开安全）
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服务角色密钥（服务端使用，勿泄露）

### Upstash Redis (选填)

- `UPSTASH_REDIS_REST_URL`: Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN`: Redis 访问令牌

### Giscus 评论系统 (选填)

- `NEXT_PUBLIC_GISCUS_REPO`: GitHub 仓库（格式：`owner/repo`）
- `NEXT_PUBLIC_GISCUS_REPO_ID`: 仓库 ID（在 Giscus 网站获取）
- `NEXT_PUBLIC_GISCUS_CATEGORY`: Discussions 分类名称
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID`: 分类 ID

---

## 主要功能演示

### 富文本编辑

- **拖拽上传**：直接拖拽图片到编辑器自动上传到 Supabase Storage
- **代码高亮**：支持 100+ 编程语言，亮/暗双主题
- **表格编辑**：可视化表格工具栏，支持行列增删
- **任务列表**：Markdown 风格的 TODO 列表
- **字数统计**：实时显示字数与预估阅读时长

### 国际化路由

- 访问 `/zh/posts` 查看中文文章列表
- 访问 `/en/posts` 查看英文文章列表
- 自动语言检测与 fallback

### 全文搜索

- 快捷键 `Cmd/Ctrl + K` 唤起搜索框
- 支持中英文分词与模糊匹配
- 搜索结果高亮显示

### SEO 优化

- 自动生成 `sitemap.xml` 和 `robots.txt`
- 结构化数据（JSON-LD）
- Open Graph 和 Twitter Card 元标签
- RSS/Atom 订阅源

---

## 文档

更多详细信息请参考：

- [TipTap + Supabase 设置指南](docs/TIPTAP_SUPABASE_SETUP.md)

---

## License

- 代码：AGPL-3.0-only（见 `LICENSE`）
- 内容与媒体：CC BY-NC-SA 4.0（见 `CONTENT_LICENSE.md`）
