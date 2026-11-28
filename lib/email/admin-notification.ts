import { Resend } from 'resend'

export type NotificationCategory = 'weekly' | 'comment' | 'friend' | 'alert' | 'general'

export type NotificationLine = [
  label: string,
  value: string | null | undefined,
  href?: string | null,
]

export type NotificationMetric = {
  label: string
  value: string
  hint?: string
}

export type NotificationQuote = {
  author?: string | null
  authorUrl?: string | null
  avatarUrl?: string | null
  meta?: string | null
  body: string
}

export type NotificationHighlightLink = {
  title: string
  subtitle?: string | null
  badge?: string | null
  href: string
}

export type NotificationTag = {
  label: string
  count?: number
}

export type NotificationStatusItem = {
  label: string
  status: string
  tone?: 'ok' | 'warn' | 'muted'
}

export type NotificationAction = {
  label: string
  href: string | null | undefined
  variant?: 'primary' | 'secondary'
}

export type NotificationSection = {
  title: string
  description?: string
  lines?: NotificationLine[]
  items?: string[]
  links?: NotificationHighlightLink[]
  tags?: NotificationTag[]
  statusItems?: NotificationStatusItem[]
}

export type AdminNotification = {
  subject: string
  title: string
  category?: NotificationCategory
  badge?: string
  subtitle?: string
  preheader?: string
  brandName?: string
  siteUrl?: string
  message?: string
  metrics?: NotificationMetric[]
  quote?: NotificationQuote
  lines?: NotificationLine[]
  sections?: NotificationSection[]
  action?: {
    label: string
    href: string | null | undefined
  }
  actions?: NotificationAction[]
}

const CATEGORY_META: Record<
  NotificationCategory,
  { badge: string; accent: string; pillBg: string; pillText: string }
> = {
  weekly: {
    badge: '周报摘要',
    accent: '#17181a',
    pillBg: '#f0f0ec',
    pillText: '#2c2e33',
  },
  comment: {
    badge: '新评论',
    accent: '#1d4ed8',
    pillBg: '#eff6ff',
    pillText: '#1e40af',
  },
  friend: {
    badge: '友链申请',
    accent: '#b45309',
    pillBg: '#fef3c7',
    pillText: '#92400e',
  },
  alert: {
    badge: '安全提醒',
    accent: '#be123c',
    pillBg: '#ffe4e6',
    pillText: '#9f1239',
  },
  general: {
    badge: '站点通知',
    accent: '#17181a',
    pillBg: '#f0f0ec',
    pillText: '#2c2e33',
  },
}

function normalizeEnv(value: string | undefined) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : undefined
}

export function formatBeijingDateTime(value?: string | Date | null): string {
  const date = value ? (value instanceof Date ? value : new Date(value)) : new Date()
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : ''
  }

  try {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return `${formatter.format(date).replace(/\//g, '-')} (CST)`
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ')
  }
}

export function formatBeijingDate(value?: string | Date | null): string {
  const date = value ? (value instanceof Date ? value : new Date(value)) : new Date()
  if (Number.isNaN(date.getTime())) return '未知日期'
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(date)
      .replace(/\//g, '-')
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

export async function sendAdminNotification(notification: AdminNotification) {
  const apiKey = normalizeEnv(process.env.RESEND_API_KEY)
  const from = normalizeEnv(process.env.RESEND_FROM_EMAIL)
  const to = normalizeEnv(process.env.ADMIN_NOTIFICATION_EMAIL) ?? normalizeEnv(process.env.ADMIN_EMAIL)

  if (!apiKey || !from || !to) {
    return { ok: false, skipped: true as const, reason: 'missing_email_env' }
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to,
      subject: notification.subject,
      text: renderText(notification),
      html: renderHtml(notification),
    })

    if (error) {
      console.error('[ADMIN_NOTIFY] Resend error:', error)
      return { ok: false, skipped: false as const, reason: 'resend_error' }
    }

    return { ok: true, skipped: false as const }
  } catch (error) {
    console.error('[ADMIN_NOTIFY] Failed to send notification:', error)
    return { ok: false, skipped: false as const, reason: 'send_failed' }
  }
}

function getResolvedActions(notification: AdminNotification): NotificationAction[] {
  const list: NotificationAction[] = []
  if (notification.actions && notification.actions.length > 0) {
    list.push(...notification.actions)
  } else if (notification.action?.href) {
    list.push({
      label: notification.action.label,
      href: notification.action.href,
      variant: 'primary',
    })
  }
  return list.filter((item) => isSafeHref(item.href))
}

function renderText(notification: AdminNotification) {
  const metricsText = (notification.metrics ?? [])
    .map((metric) => `${metric.label}: ${metric.value}${metric.hint ? ` (${metric.hint})` : ''}`)
    .join(' | ')

  const quoteText = notification.quote
    ? [
        notification.quote.author ? `${notification.quote.author}${notification.quote.meta ? ` · ${notification.quote.meta}` : ''}:` : '',
        notification.quote.body,
      ]
        .filter(Boolean)
        .join('\n')
    : ''

  const details = (notification.lines ?? [])
    .filter(([, value]) => value)
    .map(([label, value, href]) => (href ? `${label}: ${value} (${href})` : `${label}: ${value}`))
    .join('\n')

  const sections = (notification.sections ?? [])
    .map((section) => {
      const parts = [
        section.description || '',
        ...(section.lines ?? [])
          .filter(([, value]) => value)
          .map(([label, value, href]) => (href ? `${label}: ${value} (${href})` : `${label}: ${value}`)),
        ...(section.links ?? []).map(
          (link) => `- ${link.title}${link.badge ? ` [${link.badge}]` : ''}${link.subtitle ? ` — ${link.subtitle}` : ''}\n  ${link.href}`,
        ),
        ...(section.items ?? []).map((item) => `- ${item}`),
        section.tags?.length
          ? section.tags.map((tag) => `#${tag.label}${typeof tag.count === 'number' ? `(${tag.count})` : ''}`).join('  ')
          : '',
        ...(section.statusItems ?? []).map((item) => `${item.label}: ${item.status}`),
      ]
        .filter(Boolean)
        .join('\n')

      return parts ? `【${section.title}】\n${parts}` : ''
    })
    .filter(Boolean)
    .join('\n\n')

  const actionsText = getResolvedActions(notification)
    .map((action) => `${action.label}: ${action.href}`)
    .join('\n')

  return [
    notification.title,
    notification.subtitle,
    notification.message,
    metricsText,
    quoteText,
    details,
    sections,
    actionsText,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function renderAdminNotificationHtml(notification: AdminNotification): string {
  return renderHtml(notification)
}

function renderHtml(notification: AdminNotification) {
  const category = notification.category ?? 'general'
  const theme = CATEGORY_META[category]
  const badgeText = notification.badge || theme.badge
  const brandName = notification.brandName || 'emmm'
  const siteUrl = notification.siteUrl || normalizeEnv(process.env.NEXT_PUBLIC_SITE_URL) || 'https://blog.zzemy.top'
  const preheader = notification.preheader || notification.message || notification.title

  const metricsHtml = renderMetrics(notification.metrics ?? [])
  const quoteHtml = notification.quote ? renderQuote(notification.quote) : ''
  const rowsHtml = renderRows(notification.lines ?? [])
  const sectionsHtml = (notification.sections ?? [])
    .map((section) => renderSection(section))
    .filter(Boolean)
    .join('')
  const actionsHtml = renderActions(getResolvedActions(notification))

  const messageHtml = notification.message
    ? `<p style="margin: 14px 0 0; color: #52555d; font-size: 14px; line-height: 1.75;">${formatMultiline(notification.message)}</p>`
    : ''

  const subtitleHtml = notification.subtitle
    ? `<div style="margin-top: 6px; color: #8a8d95; font-size: 12px; line-height: 1.5;">${escapeHtml(notification.subtitle)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(notification.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f1; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', sans-serif; color: #17181a;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all; font-size: 1px; line-height: 1px; color: #f4f4f1;">
    ${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #f4f4f1;">
    <tr>
      <td align="center" style="padding: 36px 16px 44px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Top Brand Masthead -->
          <tr>
            <td style="padding: 0 4px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${escapeAttribute(siteUrl)}" style="text-decoration: none; color: #17181a; font-size: 17px; font-weight: 600; letter-spacing: 0.04em; font-family: Georgia, 'Songti SC', serif;">
                      ${escapeHtml(brandName)}
                    </a>
                    <span style="margin-left: 8px; color: #9a9da6; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">JOURNAL</span>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 3px 10px; border-radius: 999px; background-color: ${theme.pillBg}; color: ${theme.pillText}; font-size: 11px; font-weight: 600; letter-spacing: 0.04em;">
                      ${escapeHtml(badgeText)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Paper Card -->
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #e6e6e0; border-top: 3px solid ${theme.accent}; border-radius: 14px; overflow: hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                <!-- Title Block -->
                <tr>
                  <td style="padding: 28px 30px 22px;">
                    <h1 style="margin: 0; font-size: 21px; font-weight: 600; line-height: 1.38; color: #17181a; letter-spacing: -0.01em;">
                      ${escapeHtml(notification.title)}
                    </h1>
                    ${subtitleHtml}
                    ${messageHtml}
                  </td>
                </tr>

                ${
                  metricsHtml
                    ? `<tr><td style="padding: 2px 30px 20px;">${metricsHtml}</td></tr>`
                    : ''
                }

                ${
                  quoteHtml
                    ? `<tr><td style="padding: 2px 30px 20px;">${quoteHtml}</td></tr>`
                    : ''
                }

                ${
                  rowsHtml
                    ? `<tr><td style="padding: 4px 30px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; border-top: 1px solid #efefe9;">${rowsHtml}</table></td></tr>`
                    : ''
                }

                ${sectionsHtml}

                ${
                  actionsHtml
                    ? `<tr><td style="padding: 8px 30px 30px;">${actionsHtml}</td></tr>`
                    : ''
                }
              </table>
            </td>
          </tr>

          <!-- Subtle Footer -->
          <tr>
            <td align="center" style="padding: 20px 12px 0; color: #90949d; font-size: 12px; line-height: 1.65;">
              <div>这是一封来自 <a href="${escapeAttribute(siteUrl)}" style="color: #66686e; text-decoration: none; border-bottom: 1px solid #d7d7d0;">${escapeHtml(brandName)}</a> 的系统通知邮件</div>
              <div style="margin-top: 4px; color: #a6a9b1; font-size: 11px;">发送时间：${escapeHtml(formatBeijingDateTime())}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function renderMetrics(metrics: NotificationMetric[]) {
  if (!metrics.length) return ''
  const colWidth = `${Math.floor(100 / Math.min(metrics.length, 4))}%`
  const cells = metrics
    .slice(0, 4)
    .map(
      (metric, index) => `
        <td width="${colWidth}" valign="top" style="padding: ${index === 0 ? '0 5px 0 0' : index === Math.min(metrics.length, 4) - 1 ? '0 0 0 5px' : '0 5px'};">
          <div style="padding: 13px 12px; background-color: #f8f8f6; border: 1px solid #ecece6; border-radius: 10px; text-align: left;">
            <div style="font-size: 11px; color: #7a7d85; letter-spacing: 0.02em;">${escapeHtml(metric.label)}</div>
            <div style="margin-top: 6px; font-size: 20px; font-weight: 600; color: #17181a; font-variant-numeric: tabular-nums; line-height: 1.2;">${escapeHtml(metric.value)}</div>
            ${metric.hint ? `<div style="margin-top: 4px; font-size: 11px; color: #8c9099;">${escapeHtml(metric.hint)}</div>` : ''}
          </div>
        </td>
      `,
    )
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;"><tr>${cells}</tr></table>`
}

function renderQuote(quote: NotificationQuote) {
  const safeAvatar = isSafeHref(quote.avatarUrl) ? quote.avatarUrl : null
  const safeAuthorUrl = isSafeHref(quote.authorUrl) ? quote.authorUrl : null
  const authorDisplay = quote.author
    ? safeAuthorUrl
      ? `<a href="${escapeAttribute(safeAuthorUrl)}" style="color: #17181a; font-weight: 600; text-decoration: none;">${escapeHtml(quote.author)}</a>`
      : `<span style="color: #17181a; font-weight: 600;">${escapeHtml(quote.author)}</span>`
    : ''

  const headerHtml =
    authorDisplay || quote.meta || safeAvatar
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            ${
              safeAvatar
                ? `<td width="34" valign="middle" style="padding-right: 10px;"><img src="${escapeAttribute(safeAvatar)}" alt="" width="30" height="30" style="display: block; width: 30px; height: 30px; border-radius: 999px; object-fit: cover; border: 1px solid #e5e5df;" /></td>`
                : ''
            }
            <td valign="middle" style="font-size: 13px; line-height: 1.4;">
              ${authorDisplay}
              ${quote.meta ? `<div style="color: #8a8d95; font-size: 12px; margin-top: 2px;">${escapeHtml(quote.meta)}</div>` : ''}
            </td>
          </tr>
        </table>
      `
      : ''

  return `
    <div style="padding: 16px 18px; background-color: #f8f8f6; border: 1px solid #ecece6; border-left: 3px solid #17181a; border-radius: 10px;">
      ${headerHtml}
      <div style="color: #2b2e34; font-size: 14px; line-height: 1.75; word-break: break-word;">
        ${formatMultiline(quote.body)}
      </div>
    </div>
  `
}

function renderSection(section: NotificationSection) {
  const rows = renderRows(section.lines ?? [])
  const linksHtml = renderHighlightLinks(section.links ?? [])
  const itemsHtml =
    section.items && section.items.length > 0
      ? `<ul style="margin: 10px 0 0; padding-left: 18px; color: #474a52; font-size: 13px; line-height: 1.75;">${section.items
          .map((item) => `<li style="margin: 4px 0;">${escapeHtml(item)}</li>`)
          .join('')}</ul>`
      : ''
  const tagsHtml = renderTags(section.tags ?? [])
  const statusHtml = renderStatusItems(section.statusItems ?? [])

  if (!rows && !linksHtml && !itemsHtml && !tagsHtml && !statusHtml) return ''

  return `
    <tr>
      <td style="padding: 20px 30px; border-top: 1px solid #efefe9;">
        <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #7a7d85;">
          ${escapeHtml(section.title)}
        </div>
        ${
          section.description
            ? `<div style="margin-top: 4px; font-size: 13px; color: #8a8d95;">${escapeHtml(section.description)}</div>`
            : ''
        }
        ${linksHtml}
        ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px; width: 100%; border-collapse: collapse;">${rows}</table>` : ''}
        ${tagsHtml}
        ${statusHtml}
        ${itemsHtml}
      </td>
    </tr>
  `
}

function renderHighlightLinks(links: NotificationHighlightLink[]) {
  if (!links.length) return ''

  const cards = links
    .filter((link) => isSafeHref(link.href))
    .map(
      (link) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0ea;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td valign="top" style="padding-right: 12px;">
                  <a href="${escapeAttribute(link.href)}" style="color: #17181a; font-size: 14px; font-weight: 600; text-decoration: none; line-height: 1.45;">
                    ${escapeHtml(link.title)}
                  </a>
                  ${
                    link.subtitle
                      ? `<div style="margin-top: 3px; color: #7e828b; font-size: 12px; line-height: 1.5;">${escapeHtml(link.subtitle)}</div>`
                      : ''
                  }
                </td>
                ${
                  link.badge
                    ? `<td align="right" valign="top" style="white-space: nowrap;"><span style="display: inline-block; padding: 3px 9px; border-radius: 999px; background-color: #f3f3ef; color: #474a52; font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums;">${escapeHtml(link.badge)}</span></td>`
                    : ''
                }
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join('')

  if (!cards) return ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px; width: 100%; border-collapse: collapse;">${cards}</table>`
}

function renderTags(tags: NotificationTag[]) {
  if (!tags.length) return ''
  const pills = tags
    .map(
      (tag) =>
        `<span style="display: inline-block; margin: 0 6px 6px 0; padding: 4px 10px; border-radius: 999px; background-color: #f5f5f1; border: 1px solid #e7e7e0; color: #474a52; font-size: 12px;">#${escapeHtml(tag.label)}${typeof tag.count === 'number' ? `<span style="margin-left: 4px; color: #8c9099;">${tag.count}</span>` : ''}</span>`,
    )
    .join('')

  return `<div style="margin-top: 12px;">${pills}</div>`
}

function renderStatusItems(items: NotificationStatusItem[]) {
  if (!items.length) return ''
  const dotColors = {
    ok: '#16a34a',
    warn: '#d97706',
    muted: '#9ca3af',
  }
  const rows = items
    .map((item) => {
      const dotColor = dotColors[item.tone ?? 'muted']
      return `
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #66686e; border-bottom: 1px solid #f2f2ec;">${escapeHtml(item.label)}</td>
          <td align="right" style="padding: 8px 0; font-size: 13px; color: #17181a; font-weight: 500; border-bottom: 1px solid #f2f2ec;">
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 999px; background-color: ${dotColor}; margin-right: 6px; vertical-align: middle;"></span>${escapeHtml(item.status)}
          </td>
        </tr>
      `
    })
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px; width: 100%; border-collapse: collapse;">${rows}</table>`
}

function renderRows(lines: NotificationLine[]) {
  return lines
    .filter(([, value]) => value)
    .map(([label, value, href]) => {
      const displayValue =
        href && isSafeHref(href)
          ? `<a href="${escapeAttribute(href)}" style="color: #17181a; text-decoration: none; border-bottom: 1px solid #d4d4cc;">${escapeHtml(value || href)}</a>`
          : formatMultiline(value || '')

      return `
        <tr>
          <td width="30%" valign="top" style="padding: 10px 12px 10px 0; color: #7a7d85; font-size: 13px; line-height: 1.55; border-bottom: 1px solid #f2f2ec; white-space: nowrap;">
            ${escapeHtml(label)}
          </td>
          <td valign="top" style="padding: 10px 0; color: #17181a; font-size: 13.5px; line-height: 1.6; border-bottom: 1px solid #f2f2ec; word-break: break-word;">
            ${displayValue}
          </td>
        </tr>
      `
    })
    .join('')
}

function renderActions(actions: NotificationAction[]) {
  if (!actions.length) return ''

  const buttons = actions
    .map((action, index) => {
      const isPrimary = (action.variant ?? (index === 0 ? 'primary' : 'secondary')) === 'primary'
      const style = isPrimary
        ? 'display: inline-block; padding: 10px 18px; border-radius: 9px; background-color: #17181a; color: #ffffff; font-size: 13.5px; font-weight: 600; text-decoration: none; border: 1px solid #17181a;'
        : 'display: inline-block; padding: 10px 16px; border-radius: 9px; background-color: #ffffff; color: #17181a; font-size: 13.5px; font-weight: 500; text-decoration: none; border: 1px solid #dcdcd5;'
      return `<td style="padding-right: 10px; padding-bottom: 6px;"><a href="${escapeAttribute(action.href!)}" style="${style}">${escapeHtml(action.label)}</a></td>`
    })
    .join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr>${buttons}</tr></table>`
}

function isSafeHref(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function formatMultiline(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function escapeAttribute(value: string) {
  return escapeHtml(value)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
