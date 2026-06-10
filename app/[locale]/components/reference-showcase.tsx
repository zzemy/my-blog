import type { ReactNode } from 'react'
import { ChevronDown, Copy } from 'lucide-react'
import styles from './components-page.module.css'

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

const calloutToneClasses: Record<CalloutTone, string> = {
  note: styles.calloutNote,
  quote: styles.calloutQuote,
  tip: styles.calloutTip,
  info: styles.calloutInfo,
  important: styles.calloutImportant,
  warning: styles.calloutWarning,
  success: styles.calloutSuccess,
  caution: styles.calloutCaution,
}

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
        linkLabel="example ∞"
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
  return (
    <div className={`${styles.callout} ${calloutToneClasses[tone]}`}>
      <div>
        <p className={styles.calloutTitle}>{title}</p>
        <p>{children}</p>
      </div>
    </div>
  )
}

function CodeWindow({
  label,
  code,
  fileName,
  highlightedLines,
  linkLabel,
  showLineNumbers = true,
  startLine = 1,
}: {
  label: string
  code: string
  fileName?: string
  highlightedLines?: ReactNode[]
  linkLabel?: string
  showLineNumbers?: boolean
  startLine?: number
}) {
  const lines = code.trimEnd().split('\n')
  const resolvedFileName = fileName === undefined ? getCodeExampleFileName(label) : fileName

  return (
    <div className={`not-prose ${styles.codeWindow}`}>
      <div className={styles.codeWindowHeader}>
        <div className={styles.codeWindowTitlebar}>
          <span className={styles.codeWindowDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className={styles.codeLabel}>{label}</span>
        </div>
        <div className={styles.codeWindowTools}>
          {linkLabel ? <span className={styles.codeWindowAnchor}>{linkLabel}</span> : null}
          <span className={styles.codeWindowCopy} aria-hidden="true">
            <Copy className="h-3.5 w-3.5" />
          </span>
          <span className={styles.codeWindowChevron} aria-hidden="true">
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>
      {resolvedFileName ? <div className={styles.codeWindowFile}>{resolvedFileName}</div> : null}
      <div className={styles.codeWindowBody}>
        {showLineNumbers ? (
          <div className={styles.codeWindowGutter} aria-hidden="true">
            {lines.map((_, index) => (
              <span key={`${label}-${index}`}>{startLine + index}</span>
            ))}
          </div>
        ) : null}
        <pre className={styles.codeWindowPre}>
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

export function SequenceDiagram() {
  return (
    <figure className={`not-prose ${styles.diagramPanel} ${styles.sequencePanel}`} aria-label="代理调用时序图">
      <svg viewBox="0 0 980 560" role="img">
        <title>代理调用时序图</title>
        <g className={styles.diagramBoxes}>
          {[
            ['客户端', 90],
            ['代理对象', 310],
            ['代理处理器', 530],
            ['目标对象', 750],
          ].map(([label, x]) => (
            <g key={label}>
              <rect x={Number(x)} y="20" width="150" height="66" rx="2" />
              <rect x={Number(x)} y="460" width="150" height="66" rx="2" />
              <text x={Number(x) + 75} y="60">
                {label}
              </text>
              <text x={Number(x) + 75} y="502">
                {label}
              </text>
              <line x1={Number(x) + 75} y1="86" x2={Number(x) + 75} y2="460" />
            </g>
          ))}
        </g>
        <g className={styles.diagramArrows}>
          <line x1="165" y1="138" x2="385" y2="138" />
          <polygon points="385,138 373,132 373,144" />
          <text x="260" y="120">调用方法</text>

          <line x1="385" y1="224" x2="605" y2="224" />
          <polygon points="605,224 593,218 593,230" />
          <text x="485" y="190">转发代理处理器</text>
          <text x="520" y="214">Invoke()方法</text>

          <line x1="605" y1="306" x2="825" y2="306" />
          <polygon points="825,306 813,300 813,312" />
          <text x="700" y="270">判断Method</text>
          <text x="705" y="292">调用目标对象的方法</text>

          <line x1="825" y1="362" x2="605" y2="362" />
          <polygon points="605,362 617,356 617,368" />
          <text x="710" y="344">返回结果</text>

          <line x1="605" y1="420" x2="385" y2="420" />
          <polygon points="385,420 397,414 397,426" />
          <text x="485" y="402">返回结果</text>

          <line x1="385" y1="480" x2="165" y2="480" />
          <polygon points="165,480 177,474 177,486" />
          <text x="240" y="462">返回结果</text>
        </g>
      </svg>
    </figure>
  )
}

export function SocketDiagram() {
  return (
    <figure className={`not-prose ${styles.diagramPanel} ${styles.socketPanel}`} aria-label="Socket 连接关系图">
      <svg viewBox="0 0 980 430" role="img">
        <title>Socket 连接关系图</title>
        <defs>
          <marker id="diagram-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" />
          </marker>
        </defs>
        <g className={styles.diagramBoxes}>
          <rect x="56" y="72" width="112" height="86" rx="1" />
          <text x="112" y="109">Client1</text>
          <text x="112" y="139">Socket</text>

          <rect x="56" y="214" width="112" height="86" rx="1" />
          <text x="112" y="251">Client2</text>
          <text x="112" y="281">Socket</text>

          <rect x="348" y="36" width="156" height="60" rx="1" />
          <text x="426" y="74">ServerSocket</text>

          <rect x="804" y="72" width="150" height="86" rx="1" />
          <text x="879" y="109">为 Client1 创</text>
          <text x="879" y="139">建的Socket</text>

          <rect x="804" y="235" width="150" height="86" rx="1" />
          <text x="879" y="272">为 Client2 创</text>
          <text x="879" y="302">建的Socket</text>

          <rect x="56" y="360" width="74" height="60" rx="1" />
          <text x="93" y="398">B</text>
          <rect x="178" y="360" width="74" height="60" rx="1" />
          <text x="215" y="398">C</text>
        </g>
        <g className={styles.diagramLabels}>
          <text x="232" y="54">客户端发出连接</text>
          <text x="230" y="177">客户端发出连接</text>
          <text x="650" y="58">服务器接受请求并创建新的</text>
          <text x="704" y="87">Socket</text>
          <text x="502" y="198">两个 Socket 间建立专线连接服务器接受请求并创建新的</text>
          <text x="672" y="230">Socket</text>
          <text x="425" y="333">两个 Socket 间建立专线连接</text>
        </g>
        <g className={styles.diagramArrows}>
          <line x1="168" y1="108" x2="348" y2="62" markerEnd="url(#diagram-arrow)" />
          <line x1="168" y1="256" x2="348" y2="88" markerEnd="url(#diagram-arrow)" />
          <line x1="504" y1="66" x2="804" y2="109" markerEnd="url(#diagram-arrow)" />
          <path d="M470 96 C570 184 690 175 804 128" markerEnd="url(#diagram-arrow)" />
          <path d="M168 132 C300 220 550 192 804 274" markerEnd="url(#diagram-arrow)" />
          <path d="M168 280 C350 360 645 334 804 292" markerEnd="url(#diagram-arrow)" />
          <line x1="130" y1="390" x2="178" y2="390" />
          <polygon points="178,390 167,384 167,396" />
          <polygon points="130,390 141,384 141,396" />
        </g>
      </svg>
    </figure>
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
