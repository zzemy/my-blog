import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const VERSION_PREFIX = 'v1:'

function resolveEncryptionSecret(): { secret: string; usingFallback: boolean } {
  const dedicated = process.env.AI_ENCRYPTION_KEY?.trim()
  if (dedicated && dedicated.length >= 16) {
    return { secret: dedicated, usingFallback: false }
  }

  const csrfFallback = process.env.CSRF_SECRET?.trim()
  if (csrfFallback && csrfFallback.length >= 16) {
    return { secret: csrfFallback, usingFallback: true }
  }

  throw new Error(
    '未配置独立的 AI_ENCRYPTION_KEY 环境变量（至少 16 位字符），无法加密存储 API Key（不再回退至 SUPABASE_SERVICE_ROLE_KEY 以避免数据库密钥轮换导致解密失败）。请在 .env.local 或 Vercel 环境变量中配置 AI_ENCRYPTION_KEY，或改用「环境变量引用」模式。',
  )
}

function getDecryptionCandidateSecrets(): string[] {
  const candidates = [
    process.env.AI_ENCRYPTION_KEY?.trim(),
    process.env.CSRF_SECRET?.trim(),
    // 仅用于兼容解密历史旧数据，新加密绝不再使用 SUPABASE_SERVICE_ROLE_KEY
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  ].filter((val): val is string => Boolean(val && val.length >= 16))
  return Array.from(new Set(candidates))
}

function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret, 'utf8').digest()
}

export function getEncryptionKeyStatus(): {
  configured: boolean
  usingFallback: boolean
} {
  const dedicated = process.env.AI_ENCRYPTION_KEY?.trim()
  if (dedicated && dedicated.length >= 16) {
    return { configured: true, usingFallback: false }
  }
  const csrfFallback = process.env.CSRF_SECRET?.trim()
  if (csrfFallback && csrfFallback.length >= 16) {
    return { configured: true, usingFallback: true }
  }
  return { configured: false, usingFallback: false }
}

export function encryptApiKey(plainKey: string): string {
  const trimmed = plainKey.trim()
  if (!trimmed) {
    throw new Error('API Key 不能为空')
  }

  const { secret } = resolveEncryptionSecret()
  const key = deriveKey(secret)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${VERSION_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptApiKey(payload: string): string {
  if (!payload.startsWith(VERSION_PREFIX)) {
    throw new Error('不支持的加密密钥格式')
  }

  const parts = payload.slice(VERSION_PREFIX.length).split(':')
  if (parts.length !== 3) {
    throw new Error('加密密钥数据结构损坏')
  }

  const candidates = getDecryptionCandidateSecrets()
  if (candidates.length === 0) {
    throw new Error('未配置 AI_ENCRYPTION_KEY，无法解密已保存的 API Key')
  }

  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const encrypted = Buffer.from(parts[2], 'base64')

  let lastError: unknown = null
  for (const secret of candidates) {
    try {
      const key = deriveKey(secret)
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
      return decrypted.toString('utf8')
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('解密 API Key 失败')
}

export function maskApiKey(plainKey: string): string {
  const trimmed = plainKey.trim()
  if (!trimmed) return ''
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}••••${trimmed.slice(-2)}`
  }
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`
}
