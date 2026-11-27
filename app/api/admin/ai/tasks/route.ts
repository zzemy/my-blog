import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { DEFAULT_SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import type { AiTaskConfig, AiTaskKey } from '@/lib/ai/types'
import type { DbTaskConfigRow } from '@/lib/ai/runner'

const ALL_TASK_KEYS: AiTaskKey[] = ['summary', 'metadata', 'translate', 'rewrite', 'outline']

const updateTaskSchema = z.object({
  task_key: z.enum(['summary', 'metadata', 'translate', 'rewrite', 'outline']),
  provider_id: z.string().uuid().nullable().optional(),
  model: z.string().trim().max(120).nullable().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  max_tokens: z.number().int().min(128).max(32768).default(2048),
  system_prompt: z.string().nullable().optional(),
  glossary: z
    .array(
      z.object({
        source: z.string().trim().min(1),
        target: z.string().trim().min(1),
        note: z.string().trim().optional(),
      }),
    )
    .default([]),
})

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = getAdminClient(token || undefined)
    const { data, error } = await client.from('ai_task_configs').select('*')

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          tasks: ALL_TASK_KEYS.map((key) => ({
            task_key: key,
            provider_id: null,
            model: null,
            temperature: 0.3,
            max_tokens: 2048,
            system_prompt: null,
            glossary: [],
          })),
          default_prompts: DEFAULT_SYSTEM_PROMPTS,
          code: 'MIGRATION_REQUIRED',
        })
      }
      throw error
    }

    const rowMap = new Map<string, DbTaskConfigRow>()
    for (const row of (data as DbTaskConfigRow[] | null) ?? []) {
      rowMap.set(row.task_key, row)
    }

    const tasks: AiTaskConfig[] = ALL_TASK_KEYS.map((key) => {
      const existing = rowMap.get(key)
      return {
        task_key: key,
        provider_id: existing?.provider_id ?? null,
        model: existing?.model ?? null,
        temperature: typeof existing?.temperature === 'number' ? existing.temperature : 0.3,
        max_tokens: typeof existing?.max_tokens === 'number' ? existing.max_tokens : 2048,
        system_prompt: existing?.system_prompt ?? null,
        glossary: Array.isArray(existing?.glossary) ? existing.glossary : [],
        updated_at: existing?.updated_at,
      }
    })

    return NextResponse.json({
      tasks,
      default_prompts: DEFAULT_SYSTEM_PROMPTS,
    })
  } catch (error) {
    console.error('GET /api/admin/ai/tasks error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '加载任务配置失败' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = updateTaskSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '请求参数无效', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const body = parsed.data
    const client = getAdminClient(token || undefined)

    const { data, error } = await client
      .from('ai_task_configs')
      .upsert(
        {
          task_key: body.task_key,
          provider_id: body.provider_id || null,
          model: body.model?.trim() || null,
          temperature: body.temperature,
          max_tokens: body.max_tokens,
          system_prompt: body.system_prompt?.trim() || null,
          glossary: body.glossary,
        } as never,
        { onConflict: 'task_key' },
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error('PUT /api/admin/ai/tasks error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存任务配置失败' },
      { status: 500 },
    )
  }
}
