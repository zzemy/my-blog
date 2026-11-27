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
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50), 1), 200)

    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('ai_generation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          logs: [],
          stats: { totalCalls: 0, successCount: 0, errorCount: 0, totalTokens: 0, avgDurationMs: 0 },
          code: 'MIGRATION_REQUIRED',
        })
      }
      throw error
    }

    const logs = (data as LogRow[] | null) ?? []
    const totalCalls = logs.length
    const successCount = logs.filter((l) => l.status === 'success').length
    const errorCount = totalCalls - successCount
    const totalTokens = logs.reduce((acc, item) => acc + (item.total_tokens ?? 0), 0)
    const avgDurationMs =
      totalCalls > 0
        ? Math.round(logs.reduce((acc, item) => acc + (item.duration_ms ?? 0), 0) / totalCalls)
        : 0

    return NextResponse.json({
      logs,
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
