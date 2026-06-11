'use client'

import { useState } from 'react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { Check, ChevronDown, Copy } from 'lucide-react'

export function CodeBlockView({ node }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const textContent = node.textContent
  const language = formatCodeLanguage(node.attrs.language)
  const fileName = getCodeFileName(node.attrs.language)
  const lines = textContent.split('\n')

  if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }

  const copyCode = () => {
    void navigator.clipboard.writeText(textContent)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <NodeViewWrapper className={`code-window not-prose group relative ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="code-window-header">
        <div className="code-window-titlebar">
          <span className="code-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="component-code-label">{language}</span>
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
        <pre className="code-window-pre">
          <NodeViewContent className="!bg-transparent !p-0 !whitespace-pre !font-inherit !text-inherit" />
        </pre>
      </div>
    </NodeViewWrapper>
  )
}

function formatCodeLanguage(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'Code'
  const language = value.trim().toLowerCase()

  const labels: Record<string, string> = {
    c: 'C',
    cpp: 'C++',
    css: 'CSS',
    html: 'HTML',
    js: 'JavaScript',
    javascript: 'JavaScript',
    json: 'JSON',
    jsx: 'JSX',
    md: 'Markdown',
    markdown: 'Markdown',
    py: 'Python',
    python: 'Python',
    sh: 'Shell',
    shell: 'Shell',
    ts: 'TypeScript',
    tsx: 'TSX',
    typescript: 'TypeScript',
  }

  return labels[language] || value.trim()
}

function getCodeFileName(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'example.txt'
  const language = value.trim().toLowerCase()

  const extensions: Record<string, string> = {
    c: 'c',
    cpp: 'cpp',
    css: 'css',
    html: 'html',
    js: 'js',
    javascript: 'js',
    json: 'json',
    jsx: 'jsx',
    md: 'md',
    markdown: 'md',
    py: 'py',
    python: 'py',
    sh: 'sh',
    shell: 'sh',
    ts: 'ts',
    tsx: 'tsx',
    typescript: 'ts',
  }

  return `example.${extensions[language] || language}`
}
