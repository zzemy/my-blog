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
  // 支持在 language 字段中携带 "ts:app/page.tsx" 形式的可选文件名，兼容既有 schema
  const [langToken, explicitFileName] = splitLangAndFileName(rawLanguage)
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

  const handleLanguageChange = (nextLang: string) => {
    const combined = explicitFileName ? `${nextLang || 'text'}:${explicitFileName}` : nextLang || null
    updateAttributes({ language: combined })
  }

  const handleFileNameChange = (nextFileName: string) => {
    const cleaned = nextFileName.trim()
    const baseLang = normalizedLanguage || (cleaned ? 'text' : '')
    const combined = cleaned ? `${baseLang}:${cleaned}` : baseLang || null
    updateAttributes({ language: combined })
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
                className="ml-1 w-32 rounded bg-transparent px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground outline-none ring-1 ring-transparent transition-colors placeholder:text-muted-foreground/45 focus:bg-background/60 focus:text-foreground focus:ring-border"
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
          {lines.map((_, index) => (
            <span key={index} className="block">
              {index + 1}
            </span>
          ))}
        </div>
        <div className="code-window-scroll">
          <pre className="code-window-pre">
            <NodeViewContent
              className={`!bg-transparent !p-0 !font-inherit !text-inherit ${
                wrapped ? '!whitespace-pre-wrap !break-words' : '!whitespace-pre'
              }`}
            />
          </pre>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

function splitLangAndFileName(raw: string): [string, string] {
  const colonIdx = raw.indexOf(':')
  if (colonIdx === -1) return [raw, '']
  return [raw.slice(0, colonIdx).trim(), raw.slice(colonIdx + 1).trim()]
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
