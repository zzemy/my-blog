'use client'

import { useState, type ReactNode } from 'react'
import { Check, CheckCircle2, ChevronDown, CircleAlert, Copy, Info, Network, Quote } from 'lucide-react'
import styles from './components-page.module.css'
import { useCodeWindowScrollbar } from '@/shared/components/common/use-code-window-scrollbar'

type CalloutTone = 'note' | 'quote' | 'tip' | 'info' | 'important' | 'warning' | 'success' | 'caution'

const alertExamples = [
  {
    mark: 'NOTE',
    tone: 'note',
    title: 'Note',
    text: 'Useful information that users should know, even when skimming content.',
  },
  {
    mark: 'TIP',
    tone: 'tip',
    title: 'Tip',
    text: 'Helpful advice for doing things better or more easily.',
  },
  {
    mark: 'IMPORTANT',
    tone: 'important',
    title: 'Important',
    text: 'Key information users need to know to achieve their goal.',
  },
  {
    mark: 'WARNING',
    tone: 'warning',
    title: 'Warning',
    text: 'Urgent info that needs immediate user attention to avoid problems.',
  },
  {
    mark: 'CAUTION',
    tone: 'caution',
    title: 'Caution',
    text: 'Advises about risks or negative outcomes of certain actions.',
  },
] as const

const rustExample = `#[derive(Debug)]
pub enum State {
    Start,
    Transient,
    Closed,
}

impl From<&'a str> for State {
    fn from(s: &'a str) -> Self {
        match s {
            "start" => State::Start,
            "closed" => State::Closed,
            _ => unreachable!(),
        }
    }
}`

const javascriptExample = `let userName = prompt("Your name?", "Alice");
let isTeaWanted = confirm("Do you want some tea?");

alert( "Visitor: " + userName ); // Alice
alert( "Tea wanted: " + isTeaWanted ); // true`

export function ReferenceAlerts() {
  return (
    <div className={`component-stack not-prose ${styles.alertStack}`}>
      {alertExamples.map((item) => (
        <div className={styles.alertPair} key={item.mark}>
          <CodeWindow
            code={`> [!${item.mark}]\n> ${item.text}`}
            fileName=""
            label="Markdown"
            showLineNumbers={false}
          />
          <Callout tone={item.tone} title={item.title}>
            {item.text}
          </Callout>
        </div>
      ))}
    </div>
  )
}

export function ReferenceCodeExamples() {
  return (
    <div className={`not-prose ${styles.codeStack}`}>
      <CodeWindow
        code={rustExample}
        fileName="example.rs"
        highlightedLines={getRustHighlightedLines()}
        label="Rust"
        startLine={199}
      />
      <CodeWindow
        code={javascriptExample}
        fileName="example.js"
        highlightedLines={getJavaScriptHighlightedLines()}
        label="JavaScript"
      />
    </div>
  )
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: CalloutTone
  title: string
  children: ReactNode
}) {
  const Icon = getCalloutIcon(tone)

  return (
    <div className={`component-callout component-callout-${tone}`}>
      <div className="component-callout-heading">
        <div className="component-callout-icon">
          <Icon className="h-4 w-4" />
        </div>
        <p className="component-callout-title">{title}</p>
      </div>
      <p>{children}</p>
    </div>
  )
}

function getCalloutIcon(tone: CalloutTone) {
  switch (tone) {
    case 'quote':
      return Quote
    case 'tip':
    case 'success':
      return CheckCircle2
    case 'warning':
    case 'caution':
      return CircleAlert
    case 'important':
    case 'info':
    case 'note':
    default:
      return Info
  }
}

function CodeWindow({
  label,
  code,
  fileName,
  highlightedLines,
  showLineNumbers = true,
  startLine = 1,
}: {
  label: string
  code: string
  fileName?: string
  highlightedLines?: ReactNode[]
  showLineNumbers?: boolean
  startLine?: number
}) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const lines = code.trimEnd().split('\n')
  const resolvedFileName = fileName === undefined ? getCodeExampleFileName(label) : fileName
  const {
    handleScrollbarPointerDown,
    handleScrollbarPointerMove,
    handleScrollbarPointerUp,
    handleViewportWheel,
    scrollbar,
    updateScrollbar,
    viewportRef,
  } = useCodeWindowScrollbar(code)
  const onCopy = async () => {
    await navigator.clipboard.writeText(code.trimEnd())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className={`code-window has-custom-scrollbar not-prose ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="code-window-header">
        <div className="code-window-titlebar">
          <span className="code-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="component-code-label">{label}</span>
          {resolvedFileName ? <span className="code-window-file">{resolvedFileName}</span> : null}
        </div>
        <div className="code-window-tools">
          <button type="button" className="code-window-copy" aria-label="复制代码" onClick={onCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            className="code-window-toggle"
            aria-label={collapsed ? '展开代码' : '折叠代码'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className={`code-window-body ${showLineNumbers ? '' : 'code-window-body-no-gutter'}`}>
        {showLineNumbers ? (
          <div className="code-window-gutter" aria-hidden="true">
            {lines.map((_, index) => (
              <span key={`${label}-${index}`}>{startLine + index}</span>
            ))}
          </div>
        ) : null}
        <div ref={viewportRef} className="code-window-scroll" onScroll={updateScrollbar} onWheel={handleViewportWheel}>
          <pre className="code-window-pre">
            <code>
              {highlightedLines
                ? highlightedLines.map((line, index) => (
                    <span className={styles.codeWindowLine} key={`${label}-line-${index}`}>
                      {line}
                    </span>
                  ))
                : code}
            </code>
          </pre>
        </div>
        <div
          className={`code-window-scrollbar ${scrollbar.scrollable ? '' : 'is-hidden'}`}
          onPointerDown={handleScrollbarPointerDown}
          onPointerMove={handleScrollbarPointerMove}
          onPointerUp={handleScrollbarPointerUp}
          onPointerCancel={handleScrollbarPointerUp}
        >
          <div
            className="code-window-scrollbar-thumb"
            style={{ left: `${scrollbar.left}%`, width: `${scrollbar.width}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function getRustHighlightedLines() {
  return [
    <>
      <span className={styles.tokenAttr}>#[derive(Debug)]</span>
    </>,
    <>
      <span className={styles.tokenKeyword}>pub</span> <span className={styles.tokenKeyword}>enum</span> State {' {'}
    </>,
    <>    Start,</>,
    <>    Transient,</>,
    <>    Closed,</>,
    <>{'}'}</>,
    <></>,
    <>
      <span className={styles.tokenKeyword}>impl</span> <span className={styles.tokenType}>From</span>&lt;&amp;&apos;a{' '}
      <span className={styles.tokenKeyword}>str</span>&gt; <span className={styles.tokenKeyword}>for</span> State {' {'}
    </>,
    <>
      {'    '}
      <span className={styles.tokenKeyword}>fn</span> from(s: &amp;&apos;a <span className={styles.tokenKeyword}>str</span>) -&gt; Self {' {'}
    </>,
    <>
      {'        '}
      <span className={styles.tokenKeyword}>match</span> s {' {'}
    </>,
    <>
      {'            '}
      <span className={styles.tokenString}>&quot;start&quot;</span> =&gt; State::Start,
    </>,
    <>
      {'            '}
      <span className={styles.tokenString}>&quot;closed&quot;</span> =&gt; State::Closed,
    </>,
    <>
      {'            '}_ =&gt; unreachable!(),
    </>,
    <>        {'}'}</>,
    <>    {'}'}</>,
    <>{'}'}</>,
  ]
}

function getJavaScriptHighlightedLines() {
  return [
    <>
      <span className={styles.tokenJsKeyword}>let</span> userName = <span className={styles.tokenJsFunction}>prompt</span>(
      <span className={styles.tokenJsString}>&quot;Your name?&quot;</span>, <span className={styles.tokenJsString}>&quot;Alice&quot;</span>);
    </>,
    <>
      <span className={styles.tokenJsKeyword}>let</span> isTeaWanted = <span className={styles.tokenJsFunction}>confirm</span>(
      <span className={styles.tokenJsString}>&quot;Do you want some tea?&quot;</span>);
    </>,
    <></>,
    <>
      <span className={styles.tokenJsFunction}>alert</span>( <span className={styles.tokenJsString}>&quot;Visitor: &quot;</span> + userName );{' '}
      <span className={styles.tokenJsComment}>{'// Alice'}</span>
    </>,
    <>
      <span className={styles.tokenJsFunction}>alert</span>( <span className={styles.tokenJsString}>&quot;Tea wanted: &quot;</span> + isTeaWanted );{' '}
      <span className={styles.tokenJsComment}>{'// true'}</span>
    </>,
  ]
}

export function ReferenceFlow() {
  return (
    <div className="component-flow not-prose" aria-label="正文发布流程示例">
      <div className="component-flow-node">收集内容</div>
      <div className="component-flow-connector" aria-hidden="true" />
      <div className="component-flow-node component-flow-question">内容完整？</div>
      <div className="component-flow-branch-line" aria-hidden="true" />
      <div className="component-flow-branches">
        <div>
          <span>是</span>
          <div className="component-flow-node">预览发布</div>
        </div>
        <div>
          <span>否</span>
          <div className="component-flow-node">继续修改</div>
        </div>
      </div>
      <div className="component-flow-merge-line" aria-hidden="true" />
      <div className="component-flow-node">归档</div>
    </div>
  )
}

export function ReferenceDiagram() {
  const items = ['Markdown', '富文本块', '正文渲染']

  return (
    <div className="component-diagram not-prose" aria-label="内容关系图">
      {items.map((item) => (
        <div key={item}>
          <Network className="h-4 w-4" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

function getCodeExampleFileName(label: string) {
  const files: Record<string, string> = {
    C: 'example.c',
    JavaScript: 'example.js',
    Python: 'example.py',
  }

  return files[label] || 'example.txt'
}
