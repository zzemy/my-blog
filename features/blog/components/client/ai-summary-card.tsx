'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import type { AiSummaryData } from '@/lib/ai/types'

interface AiSummaryCardProps {
  summary: AiSummaryData
  locale?: string
}

export function AiSummaryCard({ summary, locale = 'original' }: AiSummaryCardProps) {
  const [expanded, setExpanded] = useState(true)
  const isEnglish = locale.toLowerCase().startsWith('en')

  if (summary.visible === false) return null
  if (!summary.tldr && summary.key_points.length === 0) return null

  return (
    <section
      aria-label={isEnglish ? 'AI Summary' : 'AI 文章导读'}
      className="mt-8 rounded-xl border border-border/70 bg-muted/30 p-5 backdrop-blur-sm transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {isEnglish ? 'AI Summary' : 'AI 导读摘要'}
          </h2>
          {summary.model && (
            <span className="hidden rounded-full bg-background/80 px-2 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline-block">
              {summary.model}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {expanded ? (
            <>
              <span>{isEnglish ? 'Collapse' : '收起'}</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <span>{isEnglish ? 'Expand' : '展开'}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 space-y-3.5 text-sm leading-relaxed text-foreground/90">
          {summary.tldr && <p className="font-medium text-foreground">{summary.tldr}</p>}

          {summary.key_points.length > 0 && (
            <ul className="space-y-1.5 pl-4 text-muted-foreground list-disc">
              {summary.key_points.map((point, index) => (
                <li key={index} className="leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          )}

          {summary.target_audience && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {isEnglish ? 'Audience: ' : '适合读者：'}
              </span>
              {summary.target_audience}
            </p>
          )}

          {summary.faqs && summary.faqs.length > 0 && (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                {isEnglish ? 'Quick Q&A' : '延伸问答'}
              </p>
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
