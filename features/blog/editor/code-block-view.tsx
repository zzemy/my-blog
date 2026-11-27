'use client'

import { useState } from 'react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { Check, ChevronDown, Copy } from 'lucide-react'

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
  { value: 'md', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
]

export function CodeBlockView({ node, editor, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const textContent = node.textContent
  const rawLanguage = typeof node.attrs.language === 'string' ? node.attrs.language.trim() : ''
  const normalizedLanguage = normalizeLanguageKey(rawLanguage)
  const language = formatCodeLanguage(rawLanguage)
  const fileName = getCodeFileName(rawLanguage)
  const lines = textContent.split('\n')

  if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }

  const copyCode = () => {
    void navigator.clipboard.writeText(textContent)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const hasCustomLanguage =
    Boolean(normalizedLanguage) &&
    !CODE_LANGUAGE_OPTIONS.some((option) => option.value === normalizedLanguage)

  return (
    <NodeViewWrapper className={`code-window not-prose group relative ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="code-window-header" contentEditable={false}>
        <div className="code-window-titlebar">
          <span className="code-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {editor.isEditable ? (
            <select
              className="code-window-lang-select"
              value={normalizedLanguage}
              aria-label="选择代码语言"
              data-editor-control="true"
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => updateAttributes({ language: event.target.value || null })}
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
          ) : (
            <span className="component-code-label">{language}</span>
          )}
          <span className="code-window-file">{fileName}</span>
        </div>
        <div className="code-window-tools">
          <button type="button" onClick={copyCode} className="code-window-copy" aria-label="复制代码">
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="code-window-toggle"
            aria-label={collapsed ? '展开代码' : '折叠代码'}
            aria-expanded={!collapsed}
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
            <NodeViewContent className="!bg-transparent !p-0 !whitespace-pre !font-inherit !text-inherit" />
          </pre>
        </div>
      </div>
    </NodeViewWrapper>
  )
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

function getCodeFileName(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'example.txt'
  const language = value.trim().toLowerCase()

  const extensions: Record<string, string> = {
    bash: 'sh',
    c: 'c',
    cpp: 'cpp',
    css: 'css',
    go: 'go',
    golang: 'go',
    html: 'html',
    java: 'java',
    js: 'js',
    javascript: 'js',
    json: 'json',
    jsx: 'jsx',
    md: 'md',
    markdown: 'md',
    py: 'py',
    python: 'py',
    rs: 'rs',
    rust: 'rs',
    sh: 'sh',
    shell: 'sh',
    sql: 'sql',
    ts: 'ts',
    tsx: 'tsx',
    typescript: 'ts',
    yaml: 'yml',
    yml: 'yml',
    zsh: 'sh',
  }

  return `example.${extensions[language] || language}`
}
