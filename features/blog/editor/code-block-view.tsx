'use client'

import { useEffect, useRef, useState } from 'react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { Check, ChevronDown, Copy, WrapText } from 'lucide-react'

const CODE_LANGUAGE_OPTIONS = [
  { value: '', label: 'Plain Text' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'js', label: 'JavaScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'py', label: 'Python' },
  { value: 'sh', label: 'Shell' },
  { value: 'json', label: 'JSON' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'sql', label: 'SQL' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'diff', label: 'Diff' },
  { value: 'md', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
]

export function CodeBlockView({ node, editor, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [wrapped, setWrapped] = useState(false)
  const copyTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const textContent = node.textContent
  const rawLanguage = typeof node.attrs.language === 'string' ? node.attrs.language.trim() : ''
  // 支持 "ts:app/page.tsx"、"ts title=\"app/page.tsx\" {1,3-5}" 或 "ts:app/page.tsx{1,3-5}"
  const { langToken, fileName: explicitFileName, highlightSpec, highlightedLines } =
    parseCodeBlockMeta(rawLanguage)
  const normalizedLanguage = normalizeLanguageKey(langToken)
  const language = formatCodeLanguage(langToken)
  const lines = textContent.split('\n')

  if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(textContent)
      setCopied(true)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const hasCustomLanguage =
    Boolean(normalizedLanguage) &&
    !CODE_LANGUAGE_OPTIONS.some((option) => option.value === normalizedLanguage)

  const composeLanguageAttr = (nextLang: string, nextFile: string, nextHighlight: string) => {
    const cleanFile = nextFile.trim()
    const cleanHighlight = nextHighlight.trim().replace(/^\{|\}$/g, '')
    const baseLang = nextLang.trim() || (cleanFile || cleanHighlight ? 'text' : '')
    if (!baseLang && !cleanFile && !cleanHighlight) return null
    let result = baseLang
    if (cleanFile) result += `:${cleanFile}`
    if (cleanHighlight) result += `{${cleanHighlight}}`
    return result
  }

  const handleLanguageChange = (nextLang: string) => {
    updateAttributes({ language: composeLanguageAttr(nextLang, explicitFileName, highlightSpec) })
  }

  const handleFileNameChange = (nextFileName: string) => {
    updateAttributes({
      language: composeLanguageAttr(normalizedLanguage, nextFileName, highlightSpec),
    })
  }

  const handleHighlightChange = (nextHighlight: string) => {
    updateAttributes({
      language: composeLanguageAttr(normalizedLanguage, explicitFileName, nextHighlight),
    })
  }

  return (
    <NodeViewWrapper
      className={`code-window not-prose group relative ${collapsed ? 'is-collapsed' : ''} ${wrapped ? 'is-wrapped' : ''}`}
    >
      <div className="code-window-header" contentEditable={false}>
        <div className="code-window-titlebar">
          <span className="code-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {editor.isEditable ? (
            <>
              <select
                className="code-window-lang-select"
                value={normalizedLanguage}
                aria-label="选择代码语言"
                data-editor-control="true"
                onMouseDown={(event) => event.stopPropagation()}
                onChange={(event) => handleLanguageChange(event.target.value)}
              >
                {CODE_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value || 'plain'} value={option.value}>
                    {option.label}
                  </option>
                ))}
                {hasCustomLanguage ? (
                  <option value={normalizedLanguage}>{language}</option>
                ) : null}
              </select>
              <input
                type="text"
                defaultValue={explicitFileName}
                placeholder="文件名（可选）"
                aria-label="代码文件名"
                data-editor-control="true"
                onMouseDown={(event) => event.stopPropagation()}
                onBlur={(event) => handleFileNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
                className="ml-1 w-28 rounded bg-transparent px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground outline-none ring-1 ring-transparent transition-colors placeholder:text-muted-foreground/45 focus:bg-background/60 focus:text-foreground focus:ring-border"
              />
              <input
                type="text"
                defaultValue={highlightSpec}
                placeholder="高亮行 如 1,3-5"
                aria-label="高亮代码行"
                data-editor-control="true"
                onMouseDown={(event) => event.stopPropagation()}
                onBlur={(event) => handleHighlightChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
                className="ml-1 w-24 rounded bg-transparent px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground outline-none ring-1 ring-transparent transition-colors placeholder:text-muted-foreground/45 focus:bg-background/60 focus:text-foreground focus:ring-border"
              />
            </>
          ) : (
            <>
              <span className="component-code-label">{language}</span>
              {explicitFileName ? (
                <span className="code-window-file">{explicitFileName}</span>
              ) : (
                <span className="code-window-file">{lines.length} 行</span>
              )}
            </>
          )}
        </div>
        <div className="code-window-tools">
          <button
            type="button"
            onClick={() => setWrapped((value) => !value)}
            className={`code-window-copy ${wrapped ? 'text-foreground opacity-100' : ''}`}
            aria-label={wrapped ? '关闭自动换行' : '开启自动换行'}
            aria-pressed={wrapped}
            title={wrapped ? '关闭自动换行' : '开启自动换行'}
          >
            <WrapText className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="code-window-copy"
            aria-label="复制代码"
            title={copied ? '已复制' : '复制代码'}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="code-window-toggle"
            aria-label={collapsed ? '展开代码' : '折叠代码'}
            aria-expanded={!collapsed}
            title={collapsed ? '展开代码' : '折叠代码'}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="code-window-body">
        <div className="code-window-gutter" aria-hidden="true">
          {lines.map((_, index) => {
            const lineNum = index + 1
            const isHighlighted = highlightedLines.has(lineNum)
            return (
              <span key={index} className={`block ${isHighlighted ? 'is-highlighted' : ''}`}>
                {lineNum}
              </span>
            )
          })}
        </div>
        <div className="code-window-scroll">
          <pre className="code-window-pre relative">
            {highlightedLines.size > 0 && !wrapped && (
              <div className="code-line-highlight-layer" aria-hidden="true">
                {lines.map((_, index) => (
                  <div
                    key={index}
                    className={
                      highlightedLines.has(index + 1)
                        ? 'code-line-highlight-band'
                        : 'h-[var(--article-code-line-height)]'
                    }
                  />
                ))}
              </div>
            )}
            <NodeViewContent
              className={`relative z-[1] !bg-transparent !p-0 !font-inherit !text-inherit ${
                wrapped ? '!whitespace-pre-wrap !break-words' : '!whitespace-pre'
              }`}
            />
          </pre>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

function parseHighlightLines(spec: string): Set<number> {
  const result = new Set<number>()
  if (!spec.trim()) return result
  for (const part of spec.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = Number(rangeMatch[1])
      const end = Number(rangeMatch[2])
      if (start > 0 && end >= start && end - start <= 200) {
        for (let line = start; line <= end; line += 1) {
          result.add(line)
        }
      }
      continue
    }
    const single = Number(trimmed)
    if (Number.isInteger(single) && single > 0) {
      result.add(single)
    }
  }
  return result
}

function parseCodeBlockMeta(raw: string): {
  langToken: string
  fileName: string
  highlightSpec: string
  highlightedLines: Set<number>
} {
  let working = raw.trim()
  let highlightSpec = ''
  const hlMatch = working.match(/\{([0-9,\-\s]+)\}/)
  if (hlMatch) {
    highlightSpec = hlMatch[1].trim()
    working = working.replace(hlMatch[0], '').trim()
  }

  let fileName = ''
  const titleMatch = working.match(/title=["']([^"']+)["']/)
  if (titleMatch) {
    fileName = titleMatch[1].trim()
    working = working.replace(titleMatch[0], '').trim()
  }

  if (!fileName) {
    const colonIdx = working.indexOf(':')
    if (colonIdx !== -1) {
      fileName = working.slice(colonIdx + 1).trim()
      working = working.slice(0, colonIdx).trim()
    }
  }

  const langToken = working.split(/\s+/)[0] || ''
  return {
    langToken,
    fileName,
    highlightSpec,
    highlightedLines: parseHighlightLines(highlightSpec),
  }
}

function normalizeLanguageKey(value: string) {
  const lowered = value.trim().toLowerCase()
  const aliases: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    bash: 'sh',
    shell: 'sh',
    zsh: 'sh',
    markdown: 'md',
    yml: 'yaml',
    rs: 'rust',
    golang: 'go',
    text: '',
    plaintext: '',
  }

  return lowered in aliases ? aliases[lowered] : lowered
}

function formatCodeLanguage(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'Code'
  const language = value.trim().toLowerCase()

  const labels: Record<string, string> = {
    bash: 'Shell',
    c: 'C',
    cpp: 'C++',
    css: 'CSS',
    diff: 'Diff',
    go: 'Go',
    golang: 'Go',
    html: 'HTML',
    java: 'Java',
    js: 'JavaScript',
    javascript: 'JavaScript',
    json: 'JSON',
    jsx: 'JSX',
    md: 'Markdown',
    markdown: 'Markdown',
    py: 'Python',
    python: 'Python',
    rs: 'Rust',
    rust: 'Rust',
    sh: 'Shell',
    shell: 'Shell',
    sql: 'SQL',
    ts: 'TypeScript',
    tsx: 'TSX',
    typescript: 'TypeScript',
    yaml: 'YAML',
    yml: 'YAML',
    zsh: 'Shell',
  }

  return labels[language] || value.trim()
}
