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
    const [logsRes, totalRes, successRes, aggRes] = await Promise.all([
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
      client
        .from('ai_generation_logs')
        .select('prompt_tokens, completion_tokens, total_tokens, duration_ms, model')
        .limit(5000),
    ])

    if (logsRes.error) {
      if (logsRes.error.code === '42P01') {
        return NextResponse.json({
          logs: [],
          stats: {
            totalCalls: 0,
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgDurationMs: 0,
            estimatedCostUsd: 0,
          },
          code: 'MIGRATION_REQUIRED',
        })
      }
      throw logsRes.error
    }

    const logs = (logsRes.data as LogRow[] | null) ?? []
    const aggRows =
      (aggRes.data as Array<{
        prompt_tokens: number | null
        completion_tokens: number | null
        total_tokens: number | null
        duration_ms: number | null
        model: string | null
      }> | null) ?? []

    const totalCalls = totalRes.count ?? logs.length
    const successCount = successRes.count ?? logs.filter((l) => l.status === 'success').length
    const errorCount = Math.max(0, totalCalls - successCount)
    const totalTokens = aggRows.reduce((acc, item) => acc + (item.total_tokens ?? 0), 0)
    const avgDurationMs =
      aggRows.length > 0
        ? Math.round(
            aggRows.reduce((acc, item) => acc + (item.duration_ms ?? 0), 0) / aggRows.length,
          )
        : 0

    // 粗略按常见模型单价（每百万 token 美元）估算费用，便于站长感知开销
    const estimateRowCost = (row: (typeof aggRows)[number]) => {
      const m = (row.model || '').toLowerCase()
      const inputRate = m.includes('opus')
        ? 15
        : m.includes('sonnet') || m.includes('gpt-4o') || m.includes('pro')
          ? 3
          : m.includes('deepseek')
            ? 0.27
            : 0.5
      const outputRate = m.includes('opus')
        ? 75
        : m.includes('sonnet') || m.includes('gpt-4o') || m.includes('pro')
          ? 12
          : m.includes('deepseek')
            ? 1.1
            : 1.5
      const inTokens = row.prompt_tokens ?? Math.round((row.total_tokens ?? 0) * 0.7)
      const outTokens = row.completion_tokens ?? Math.round((row.total_tokens ?? 0) * 0.3)
      return (inTokens * inputRate + outTokens * outputRate) / 1_000_000
    }
    const estimatedCostUsd = Number(
      aggRows.reduce((acc, row) => acc + estimateRowCost(row), 0).toFixed(4),
    )

    return NextResponse.json({
      logs,
      hasMore: offset + logs.length < totalCalls,
      nextOffset: offset + logs.length,
      stats: {
        totalCalls,
        successCount,
        errorCount,
        totalTokens,
        avgDurationMs,
        estimatedCostUsd,
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
