import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import type { Database } from '@/lib/supabase/types'

type LogRow = Database['public']['Tables']['ai_generation_logs']['Row']

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 60), 1), 200)
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0)

    const client = getAdminClient(token || undefined)
    const [logsRes, totalRes, successRes] = await Promise.all([
      client
        .from('ai_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      client.from('ai_generation_logs').select('id', { count: 'exact', head: true }),
      client
        .from('ai_generation_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'success'),
    ])

    if (logsRes.error) {
      if (logsRes.error.code === '42P01') {
        return NextResponse.json({
          logs: [],
          stats: { totalCalls: 0, successCount: 0, errorCount: 0, totalTokens: 0, avgDurationMs: 0 },
          code: 'MIGRATION_REQUIRED',
        })
      }
      throw logsRes.error
    }

    const logs = (logsRes.data as LogRow[] | null) ?? []
    const totalCalls = totalRes.count ?? logs.length
    const successCount = successRes.count ?? logs.filter((l) => l.status === 'success').length
    const errorCount = Math.max(0, totalCalls - successCount)
    const totalTokens = logs.reduce((acc, item) => acc + (item.total_tokens ?? 0), 0)
    const avgDurationMs =
      logs.length > 0
        ? Math.round(logs.reduce((acc, item) => acc + (item.duration_ms ?? 0), 0) / logs.length)
        : 0

    return NextResponse.json({
      logs,
      hasMore: offset + logs.length < totalCalls,
      stats: {
        totalCalls,
        successCount,
        errorCount,
        totalTokens,
        avgDurationMs,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/ai/logs error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '加载 AI 日志失败' },
      { status: 500 },
    )
  }
}
