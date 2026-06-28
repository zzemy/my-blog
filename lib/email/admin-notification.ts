import { Resend } from 'resend'

type AdminNotification = {
  subject: string
  title: string
  lines?: Array<[label: string, value: string | null | undefined]>
  message?: string
  action?: {
    label: string
    href: string | null | undefined
  }
  sections?: Array<{
    title: string
    lines?: Array<[label: string, value: string | null | undefined]>
    items?: string[]
  }>
}

function normalizeEnv(value: string | undefined) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : undefined
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

function renderText(notification: AdminNotification) {
  const details = (notification.lines ?? [])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')
  const sections = (notification.sections ?? [])
    .map((section) => {
      const sectionLines = [
        ...(section.lines ?? [])
          .filter(([, value]) => value)
          .map(([label, value]) => `${label}: ${value}`),
        ...(section.items ?? []),
      ].join('\n')

      return sectionLines ? `${section.title}\n${sectionLines}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
  const action = notification.action?.href ? `${notification.action.label}: ${notification.action.href}` : ''

  return [
    notification.title,
    notification.message,
    details,
    sections,
    action,
  ].filter(Boolean).join('\n\n')
}

function renderHtml(notification: AdminNotification) {
  const rows = renderRows(notification.lines ?? [])
  const sections = (notification.sections ?? [])
    .map((section) => renderSection(section.title, section.lines ?? [], section.items ?? []))
    .join('')

  const message = notification.message
    ? `<p style="margin: 12px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">${formatMultiline(notification.message)}</p>`
    : ''
  const action = notification.action?.href
    ? `
      <a href="${escapeAttribute(notification.action.href)}" style="display: inline-block; margin-top: 22px; padding: 11px 16px; border-radius: 8px; background: #111827; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">
        ${escapeHtml(notification.action.label)}
      </a>
    `
    : ''

  return `
    <div style="margin: 0; padding: 32px 16px; background: #f4f1ea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827;">
      <div style="max-width: 680px; margin: 0 auto; overflow: hidden; border: 1px solid #ded7ca; border-radius: 14px; background: #fffaf0;">
        <div style="padding: 26px 28px; background: #111827; color: #ffffff;">
          <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #facc15;">emmm blog</div>
          <h1 style="margin: 10px 0 0; font-size: 24px; line-height: 1.25;">${escapeHtml(notification.title)}</h1>
        </div>

        <div style="padding: 26px 28px;">
          ${message}
          ${rows ? `<table style="margin-top: 22px; width: 100%; border-collapse: collapse;">${rows}</table>` : ''}
          ${sections}
          ${action}
        </div>
      </div>
    </div>
  `
}

function renderSection(
  title: string,
  lines: Array<[label: string, value: string | null | undefined]>,
  items: string[],
) {
  const rows = renderRows(lines)
  const list = items.length
    ? `
      <ul style="margin: 12px 0 0; padding-left: 18px; color: #334155; font-size: 14px; line-height: 1.7;">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    `
    : ''

  if (!rows && !list) return ''

  return `
    <div style="margin-top: 24px; padding-top: 22px; border-top: 1px solid #e7dece;">
      <h2 style="margin: 0 0 12px; font-size: 16px; color: #111827;">${escapeHtml(title)}</h2>
      ${rows ? `<table style="width: 100%; border-collapse: collapse;">${rows}</table>` : ''}
      ${list}
    </div>
  `
}

function renderRows(lines: Array<[label: string, value: string | null | undefined]>) {
  return lines
    .filter(([, value]) => value)
    .map(([label, value]) => {
      return `
        <tr>
          <td style="width: 34%; padding: 10px 0; color: #64748b; font-size: 13px; vertical-align: top; border-bottom: 1px solid #ece4d8;">${escapeHtml(label)}</td>
          <td style="padding: 10px 0 10px 14px; color: #111827; font-size: 14px; line-height: 1.55; vertical-align: top; border-bottom: 1px solid #ece4d8;">${formatMultiline(value || '')}</td>
        </tr>
      `
    })
    .join('')
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
