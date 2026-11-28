import { NextRequest, NextResponse } from 'next/server'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import {
  formatBeijingDate,
  formatBeijingDateTime,
  renderAdminNotificationHtml,
  type AdminNotification,
} from '@/lib/email/admin-notification'
import { getSiteSettings } from '@/lib/site-settings'

export const dynamic = 'force-dynamic'

export type EmailPreviewTemplate = 'weekly' | 'comment' | 'friend' | 'alert'

export async function buildSampleNotification(
  template: EmailPreviewTemplate,
  siteUrl: string,
): Promise<AdminNotification> {
  const settings = await getSiteSettings()
  const brandName =
    settings.site_title && settings.site_title !== 'My Blog' ? settings.site_title : 'emmm'
  const nowStr = formatBeijingDateTime()

  switch (template) {
    case 'comment':
      return {
        category: 'comment',
        badge: '新评论',
        brandName,
        siteUrl,
        subject: `新评论 · linus 留言了「从零打磨一个极简 Next.js 博客」`,
        title: 'linus 在「从零打磨一个极简 Next.js 博客」发表了评论',
        subtitle: nowStr,
        preheader: 'linus：文章的排版细节与阅读体验做得很克制，尤其是双语切换与目录定位非常顺手！',
        quote: {
          author: '@linus',
          authorUrl: 'https://github.com/torvalds',
          meta: 'Discussion #42',
          body: '文章的排版细节与阅读体验做得很克制，尤其是双语切换与目录定位非常顺手！\n\n顺便请教一下，TipTap 服务端渲染是如何处理自定义富文本块的？',
        },
        lines: [
          ['所属页面', '从零打磨一个极简 Next.js 博客', `${siteUrl}/posts`],
          ['评论者', '@linus', 'https://github.com/torvalds'],
          ['仓库', 'zzemy/my-blog'],
          ['评论时间', nowStr],
        ],
        actions: [
          { label: '立即查看并回复', href: `${siteUrl}/guestbook`, variant: 'primary' },
          { label: '查看完整讨论', href: `${siteUrl}/posts`, variant: 'secondary' },
        ],
      }

    case 'friend':
      return {
        category: 'friend',
        badge: '友链申请',
        brandName,
        siteUrl,
        subject: '友链申请 · 静水深流',
        title: '收到来自「静水深流」的友链申请',
        subtitle: `提交于 ${nowStr}`,
        preheader: '静水深流 (https://example.org) 申请交换友链',
        message: '请登录后台审核，通过后该站点才会公开展示在友链页。',
        quote: {
          author: '静水深流',
          authorUrl: 'https://example.org',
          meta: 'https://example.org',
          body: '记录前端工程、开源设计系统与阅读随笔的独立小站。',
        },
        lines: [
          ['站点地址', 'https://example.org', 'https://example.org'],
          ['联系方式', 'hello@example.org'],
          ['申请备注', '已在贵站友链页添加本站链接，期待互换～'],
          ['提交时间', nowStr],
        ],
        actions: [
          { label: '前往后台审核', href: `${siteUrl}/admin/friends`, variant: 'primary' },
          { label: '访问申请站点', href: 'https://example.org', variant: 'secondary' },
        ],
      }

    case 'alert':
      return {
        category: 'alert',
        badge: '安全通知',
        brandName,
        siteUrl,
        subject: '后台登录提醒 · 203.0.113.42',
        title: '博客后台发生一次管理员登录',
        subtitle: nowStr,
        preheader: 'admin@example.com 从 203.0.113.42 登录了博客后台',
        message: '如果本次登录是你本人操作，可忽略此邮件；若非本人操作，请立即前往 Supabase 修改密码并吊销会话。',
        lines: [
          ['登录账号', 'admin@example.com'],
          ['登录时间', nowStr],
          ['来源 IP', '203.0.113.42'],
          ['客户端', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0'],
          ['运行环境', 'production'],
        ],
        actions: [{ label: '前往博客后台', href: `${siteUrl}/admin`, variant: 'primary' }],
      }

    case 'weekly':
    default:
      return {
        category: 'weekly',
        badge: '每周简报',
        brandName,
        siteUrl,
        subject: `博客周报 · ${formatBeijingDate()}（18 篇文章 / 3,420 阅读）`,
        title: '本周博客运行与内容简报',
        subtitle: `统计截止 ${nowStr}`,
        preheader: '已发布 18 篇 · 累计 3,420 次阅读 · 2 篇草稿',
        message: '本周重点提醒：有 1 条待审核友链，1 篇草稿已超过 30 天未编辑。以下是完整运行摘要。',
        metrics: [
          { label: '已发布', value: '18', hint: '篇正文' },
          { label: '草稿箱', value: '2', hint: '1 篇超 30 天' },
          { label: '累计阅读', value: '3,420', hint: 'Redis 统计' },
          { label: '累计点赞', value: '168', hint: '1 条待审友链' },
        ],
        sections: [
          {
            title: '最受关注的文章',
            links: [
              {
                title: '构建优雅的 Next.js 16 个人出版系统',
                subtitle: '发布于 2026-11-12',
                badge: '1,240 阅读 · 64 赞',
                href: `${siteUrl}/posts`,
              },
              {
                title: '多模型 AI 翻译流水线的设计与避坑',
                subtitle: '发布于 2026-11-20',
                badge: '860 阅读 · 41 赞',
                href: `${siteUrl}/posts`,
              },
            ],
          },
          {
            title: '待办与草稿提醒',
            links: [
              {
                title: '有 1 条友链申请等待审核',
                subtitle: '前往友链管理页查看详情并处理',
                badge: '待处理',
                href: `${siteUrl}/admin/friends`,
              },
              {
                title: '冬季摄影与胶片色彩笔记',
                subtitle: '超过 30 天未更新 · 最后编辑 2026-10-15',
                badge: '积压草稿',
                href: `${siteUrl}/admin/posts`,
              },
            ],
          },
          {
            title: '内容脉络',
            tags: [
              { label: 'Next.js', count: 6 },
              { label: '设计系统', count: 5 },
              { label: 'AI 工程', count: 4 },
              { label: '随笔', count: 3 },
            ],
          },
          {
            title: '站点运行状态',
            statusItems: [
              { label: 'Supabase 数据库', status: '运行正常', tone: 'ok' },
              { label: 'Upstash Redis 阅读统计', status: '已连接', tone: 'ok' },
              { label: '近 7 天 AI 异常调用', status: '0 次异常', tone: 'ok' },
            ],
          },
        ],
        actions: [
          { label: '打开博客后台', href: `${siteUrl}/admin`, variant: 'primary' },
          { label: '管理文章与草稿', href: `${siteUrl}/admin/posts`, variant: 'secondary' },
        ],
      }
  }
}

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawTemplate = request.nextUrl.searchParams.get('template') || 'weekly'
  const template: EmailPreviewTemplate =
    rawTemplate === 'comment' || rawTemplate === 'friend' || rawTemplate === 'alert'
      ? rawTemplate
      : 'weekly'

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin).replace(/\/$/, '')
  const notification = await buildSampleNotification(template, siteUrl)
  const html = renderAdminNotificationHtml(notification)

  return NextResponse.json({
    template,
    subject: notification.subject,
    html,
  })
}
