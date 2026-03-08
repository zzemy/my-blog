const loggedKeys = new Set<string>()

function toMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return String(error)
}

function toCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string') return code
  }
  return undefined
}

export function isExpectedSupabaseBuildError(error: unknown) {
  const code = toCode(error)
  const message = toMessage(error)
  return (
    code === 'PGRST116' ||
    /invalid api key/i.test(message) ||
    /cannot coerce the result to a single json object/i.test(message) ||
    /missing supabase environment variables/i.test(message) ||
    /failed to initialize supabase client/i.test(message)
  )
}

export function logExpectedSupabaseBuildErrorOnce(key: string, message: string, error: unknown) {
  if (process.env.NODE_ENV === 'production') return
  if (loggedKeys.has(key)) return
  loggedKeys.add(key)
  console.warn(message, error)
}
