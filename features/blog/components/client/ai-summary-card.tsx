'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import type { AiSummaryData } from '@/lib/ai/types'

interface AiSummaryCardProps {
  summary: AiSummaryData
  locale?: string
}

const SUMMARY_LABELS: Record<
  string,
  { title: string; collapse: string; expand: string; audience: string; qa: string }
> = {
  zh: { title: 'AI 导读摘要', collapse: '收起', expand: '展开', audience: '适合读者：', qa: '延伸问答' },
  'zh-tw': { title: 'AI 導讀摘要', collapse: '收起', expand: '展開', audience: '適合讀者：', qa: '延伸問答' },
  en: { title: 'AI Summary', collapse: 'Collapse', expand: 'Expand', audience: 'Audience: ', qa: 'Quick Q&A' },
  ja: { title: 'AI 要約', collapse: '閉じる', expand: '開く', audience: '対象読者：', qa: 'よくある質問' },
  ko: { title: 'AI 요약', collapse: '접기', expand: '펼치기', audience: '추천 독자: ', qa: '핵심 Q&A' },
  fr: { title: 'Résumé IA', collapse: 'Réduire', expand: 'Développer', audience: 'Public cible : ', qa: 'Questions clés' },
  de: { title: 'KI-Zusammenfassung', collapse: 'Einklappen', expand: 'Ausklappen', audience: 'Zielgruppe: ', qa: 'Kurze Q&A' },
  es: { title: 'Resumen IA', collapse: 'Ocultar', expand: 'Mostrar', audience: 'Dirigido a: ', qa: 'Preguntas clave' },
}

function resolveLabels(locale: string) {
  const lower = locale.toLowerCase()
  if (lower === 'original' || lower === 'zh-cn' || lower === 'zh') return SUMMARY_LABELS.zh
  if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk')) return SUMMARY_LABELS['zh-tw']
  const base = lower.split('-')[0]
  return SUMMARY_LABELS[base] ?? SUMMARY_LABELS.en
}

export function AiSummaryCard({ summary, locale = 'original' }: AiSummaryCardProps) {
  const [expanded, setExpanded] = useState(true)
  const labels = resolveLabels(locale)

  if (summary.visible === false) return null
  if (!summary.tldr && summary.key_points.length === 0) return null

  return (
    <section
      aria-label={labels.title}
      className="mt-8 rounded-xl border border-border/70 bg-muted/30 p-5 backdrop-blur-sm transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {labels.title}
          </h2>
          {summary.model && (
            <span className="hidden rounded-full bg-background/80 px-2 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline-block">
              {summary.model}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {expanded ? (
            <>
              <span>{labels.collapse}</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <span>{labels.expand}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 space-y-3.5 text-sm leading-relaxed text-foreground/90">
          {summary.tldr && <p className="font-medium text-foreground">{summary.tldr}</p>}

          {summary.key_points.length > 0 && (
            <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
              {summary.key_points.map((point, index) => (
                <li key={index} className="leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          )}

          {summary.target_audience && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{labels.audience}</span>
              {summary.target_audience}
            </p>
          )}

          {summary.faqs && summary.faqs.length > 0 && (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="text-xs font-medium text-muted-foreground">{labels.qa}</p>
              <div className="space-y-2">
                {summary.faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="group rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs"
                  >
                    <summary className="cursor-pointer font-medium text-foreground/90">
                      {faq.question}
                    </summary>
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
