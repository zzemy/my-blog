import { Resend } from 'resend'

type AdminNotification = {
  subject: string
  title: string
  lines: Array<[label: string, value: string | null | undefined]>
  message?: string
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
  const details = notification.lines
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')

  return [
    notification.title,
    notification.message,
    details,
  ].filter(Boolean).join('\n\n')
}

function renderHtml(notification: AdminNotification) {
  const rows = notification.lines
    .filter(([, value]) => value)
    .map(([label, value]) => {
      return `
        <tr>
          <td style="padding: 8px 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${escapeHtml(label)}</td>
          <td style="padding: 8px 12px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(value || '')}</td>
        </tr>
      `
    })
    .join('')

  const message = notification.message
    ? `<p style="margin: 12px 0 0; color: #374151;">${escapeHtml(notification.message)}</p>`
    : ''

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin: 0; font-size: 20px;">${escapeHtml(notification.title)}</h2>
      ${message}
      <table style="margin-top: 20px; width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
