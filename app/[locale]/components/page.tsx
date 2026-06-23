/* eslint-disable @next/next/no-img-element */
import { setRequestLocale } from 'next-intl/server'
import { renderToString } from 'katex'
import {
  ArrowRight,
  BarChart3,
  Download,
  ExternalLink,
  FileText,
  Info,
  Keyboard,
  Layers3,
  Music2,
  Play,
  SmilePlus,
  Sigma,
} from 'lucide-react'
import { PostLayout } from '@/features/blog/components/client/post-layout'
import { Comments } from '@/features/blog/components/client/comments'
import { FadeIn } from '@/shared/visuals/fade-in'
import { ReferenceSlider } from './reference-slider'
import { ReferenceAlerts, ReferenceCodeExamples, ReferenceDiagram, ReferenceFlow } from './reference-showcase'
import styles from './components-page.module.css'

const locales = ['zh', 'en', 'fr', 'ja']

const toc = [
  { id: 'headings', text: '标题', depth: 2 },
  { id: 'lead-separators', text: '导语与分隔线', depth: 2 },
  { id: 'rich-content', text: '富文本内容', depth: 2 },
  { id: 'emphasis', text: '强调', depth: 2 },
  { id: 'inline-patterns', text: '行内元素', depth: 2 },
  { id: 'buttons', text: '按钮', depth: 2 },
  { id: 'links', text: '链接', depth: 2 },
  { id: 'paragraph', text: '段落', depth: 2 },
  { id: 'placeholder-text', text: '占位文本', depth: 2 },
  { id: 'lists', text: '列表', depth: 2 },
  { id: 'definition-list', text: '定义列表', depth: 2 },
  { id: 'notice', text: '提示块', depth: 2 },
  { id: 'tabs', text: '标签页', depth: 2 },
  { id: 'accordions', text: '折叠面板', depth: 2 },
  { id: 'code', text: '代码', depth: 2 },
  { id: 'math', text: '数学公式', depth: 2 },
  { id: 'charts', text: '图表', depth: 2 },
  { id: 'flow', text: '流程图', depth: 2 },
  { id: 'diagrams', text: '关系图', depth: 2 },
  { id: 'emoji', text: '表情符号', depth: 2 },
  { id: 'timeline', text: '时间线', depth: 2 },
  { id: 'blockquote', text: '引用', depth: 2 },
  { id: 'tables', text: '表格', depth: 2 },
  { id: 'wide-table', text: '宽表', depth: 2 },
  { id: 'cards', text: '卡片', depth: 2 },
  { id: 'files', text: '文件', depth: 2 },
  { id: 'image', text: '图片', depth: 2 },
  { id: 'gallery', text: '图集', depth: 2 },
  { id: 'slider', text: '轮播', depth: 2 },
  { id: 'audio', text: '音频', depth: 2 },
  { id: 'youtube', text: 'YouTube 视频', depth: 2 },
  { id: 'custom-video', text: '自定义视频', depth: 2 },
  { id: 'footnotes', text: '脚注', depth: 2 },
]

const sampleImages = [
  {
    file: '06.jpg',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    alt: '图片说明：浅色海岸线和清澈浪花',
  },
  {
    file: '01.jpg',
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    alt: '图片说明：湖泊、森林和远处山脊',
  },
  {
    file: '02.jpg',
    src: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1000&q=80',
    alt: '图片说明：蓝色湖面和雪山',
  },
  {
    file: '03.jpg',
    src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=80',
    alt: '图片说明：平静海面和低饱和蓝色天空',
  },
  {
    file: '04.jpg',
    src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1000&q=80',
    alt: '图片说明：绿色山坡和开阔天空',
  },
  {
    file: '05.jpg',
    src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80',
    alt: '图片说明：山地草甸和远处山峰',
  },
]

const sampleFiles = [
  { name: 'article-style-guide.pdf', type: 'PDF', size: '284 KB' },
  { name: 'component-reference.md', type: 'Markdown', size: '18 KB' },
  { name: 'gallery-assets.zip', type: '压缩包', size: '4.2 MB' },
]

const timelineItems = [
  {
    label: '草稿',
    title: '收集内容块',
    text: '先把真实文章里会出现的内容块列全，避免只优化一两个漂亮截图。',
  },
  {
    label: '检查',
    title: '校准阅读节奏',
    text: '重点看标题间距、列表层级、代码宽度、表格滚动和移动端是否稳定。',
  },
  {
    label: '发布',
    title: '复用正文体系',
    text: '组件页、文章详情页、About 页都应该走同一套正文变量和局部组件样式。',
  },
]

const articleCards = [
  {
    eyebrow: '模式',
    title: '紧凑摘要卡片',
    text: '用于文章中的小型结论、资源组或阅读提示，不承担页面主布局。',
  },
  {
    eyebrow: '状态',
    title: '状态对比',
    text: '可承载就绪、预览、废弃等状态，和表格互补。',
  },
  {
    eyebrow: '资源',
    title: '相关阅读',
    text: '适合链接到同系列文章、外部资料或下载内容。',
  },
]

const chartBars = [
  { label: 'Markdown', value: 74 },
  { label: '富文本块', value: 88 },
  { label: '媒体', value: 63 },
  { label: '代码', value: 92 },
  { label: '表格', value: 58 },
]

const emojiGroups = [
  ['📘', '🧪', '🧭', '🛠️', '🧩'],
  ['🌊', '🌲', '🏔️', '✨', '🌙'],
  ['✅', '⚠️', '💡', '🔗', '📎'],
]

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata = {
  title: '正文组件',
  description: '文章正文组件与排版视觉参考。',
}

export default async function ComponentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <PostLayout toc={toc}>
      <FadeIn>
        <article className={`article-shell ${styles.referencePage}`}>
          <div className="article-hero">
            <h1 className="article-title text-3xl md:text-4xl lg:text-5xl">正文组件</h1>
            <p className="article-description">
              这是一篇完整的正文视觉验收页。它覆盖 Markdown 与富文本常见内容块，并保持和真实文章同一套目录、宽度、
              字体、代码、表格和媒体样式。
            </p>
          </div>

          <div className="article-content prose dark:prose-invert max-w-none article-font mt-10">
          <h2 id="headings">标题</h2>
          <p>
            标题需要建立清楚的文章层级。Markdown 里可以用 <code>#</code> 表示一级标题，用 <code>######</code>
            表示六级标题。
          </p>
          <h1>一级标题</h1>
          <h2>二级标题</h2>
          <h3>三级标题</h3>
          <h4>四级标题</h4>
          <h5>五级标题</h5>
          <h6>六级标题</h6>

          <h2 id="lead-separators">导语与分隔线</h2>
          <p className="lead">
            导语段落应该比普通正文更醒目，但仍然属于文章内容，不应该像营销页首屏一样抢走全部注意力。
          </p>
          <p>分隔线用于长文章的语义转场，应该清楚但克制，不能把每个小节都切成独立卡片。</p>
          <hr />

          <h2 id="rich-content">富文本内容</h2>
          <p>富文本块用于把图片、状态、链接和摘要合在同一段正文语境里，适合项目说明、资源推荐和版本说明。</p>
          <div className="component-rich-showcase not-prose">
            <figure>
              <img src={sampleImages[3].src} alt={sampleImages[3].alt} referrerPolicy="no-referrer" />
            </figure>
            <div>
              <span className="component-overline">
                <Layers3 className="h-4 w-4" />
                富文本块
              </span>
              <h3>混合正文模块</h3>
              <p>
                一个块里同时承载媒体、摘要、状态和操作入口，但仍然遵守正文宽度、正文间距和同一套色彩变量。
              </p>
              <div className="component-mini-actions">
                <a href="#gallery">查看图集</a>
                <a href="#files">查看文件</a>
              </div>
            </div>
          </div>

          <h2 id="emphasis">强调</h2>
          <p>
            斜体用于轻量强调，例如 <em>需要被读者注意的短语</em>。
          </p>
          <p>
            <strong>粗体用于更强的重点信息</strong>，不应该整段滥用。
          </p>
          <p>
            <strong>
              <em>组合强调</em>
            </strong>{' '}
            用于极少数需要同时保留语气和重量的内容。
          </p>
          <p>
            删除线用于修订痕迹。<del>这是一段被划掉的旧说法。</del>
          </p>

          <h2 id="inline-patterns">行内元素</h2>
          <p>
            行内细节包括 <mark>高亮文本</mark>、<kbd>Ctrl</kbd> + <kbd>K</kbd>、H<sub>2</sub>O、E = mc
            <sup>2</sup>、<abbr title="Really Simple Syndication">RSS</abbr>，以及脚注引用
            <sup>
              <a href="#footnote-1" id="footnote-ref-1">
                1
              </a>
            </sup>
            .
          </p>
          <div className="component-inline-grid not-prose">
            <div>
              <Keyboard className="h-4 w-4" />
              <span>快捷键</span>
              <strong>
                <kbd>⌘</kbd> <kbd>Enter</kbd>
              </strong>
            </div>
            <div>
              <Sigma className="h-4 w-4" />
              <span>标记</span>
              <strong>
                x<sub>n</sub> + y<sup>2</sup>
              </strong>
            </div>
            <div>
              <Info className="h-4 w-4" />
              <span>状态</span>
              <strong className="component-badge">稳定</strong>
            </div>
          </div>

          <h2 id="buttons">按钮</h2>
          <div className="component-button-row not-prose">
            <button className="component-button component-button-primary" type="button">
              <span>主要按钮</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="component-button component-button-secondary" type="button">
              <span>次要按钮</span>
              <ExternalLink className="h-4 w-4" />
            </button>
            <button className="component-button component-button-secondary" type="button" disabled>
              <span>不可用</span>
            </button>
          </div>

          <h2 id="links">链接</h2>
          <p>
            <a href="https://blog.zzemy.top">这是一条行内链接</a>
          </p>
          <p>
            <a href="https://blog.zzemy.top" title="emmm Blog">
              这是一条带标题属性的链接
            </a>
          </p>
          <p>
            <a href="/README.md">这是一条指向仓库文件的相对链接</a>
          </p>
          <p>
            普通 URL 也应该能被识别为可点击链接，例如{' '}
            <a href="http://www.example.com">http://www.example.com</a>。
          </p>
          <p>链接颜色要明显，但不能破坏正文阅读的连续性。</p>

          <h2 id="paragraph">段落</h2>
          <p>
            段落是正文的主体。长段落要保持稳定的行高、合适的字宽和足够清晰的灰度层级。读者连续阅读时，
            文字不能被背景、边框、阴影或过强的装饰元素打断。这里用一段较长的中文内容检查换行、段间距、
            标点密度和移动端排版是否自然。
          </p>

          <h2 id="placeholder-text">占位文本</h2>
          <p>占位内容应该足够接近真实文章，用来提前暴露行高、换行和状态标签的问题。</p>
          <div className="component-placeholder not-prose">
            <span>草稿</span>
            <p>
              这是一段用于测试的正文占位内容。它不追求信息密度，而是检查普通段落、弱化标签和紧凑状态是否能在同一个块里保持秩序。
            </p>
          </div>

          <h2 id="lists">列表</h2>
          <h3>有序列表</h3>
          <ol>
            <li>先确认正文宽度。</li>
            <li>再检查标题和段落节奏。</li>
            <li>最后验证移动端滚动。</li>
          </ol>
          <h3>无序列表</h3>
          <ul>
            <li>普通项目符号。</li>
            <li>较长文本换行时保持缩进。</li>
            <li>列表项之间不应该显得拥挤。</li>
          </ul>
          <h3>任务列表</h3>
          <ul data-type="taskList">
            <li>
              <input type="checkbox" checked readOnly />
              <span>代码块复制按钮可见且不挤压内容。</span>
            </li>
            <li>
              <input type="checkbox" readOnly />
              <span>下一步接入可编辑的 Notice 块。</span>
            </li>
          </ul>

          <h2 id="definition-list">定义列表</h2>
          <dl>
            <dt>正文界面</dt>
            <dd>承载真实正文的排版、宽度、颜色变量、代码块、表格、图片和媒体样式。</dd>
            <dt>富文本块</dt>
            <dd>编辑器里以结构化 JSON 保存的可复用内容块，例如提示块、标签页、图集和视频。</dd>
            <dt>参考页面</dt>
            <dd>用来一次性验收所有正文视觉状态，后续新增组件也先放到这里检查。</dd>
          </dl>

          <h2 id="notice">提示块</h2>
          <ReferenceAlerts />

          <h2 id="tabs">标签页</h2>
          <div className="component-tabs not-prose">
            <input className="component-tab-input" defaultChecked id="component-tab-1" name="component-tabs" type="radio" />
            <input className="component-tab-input" id="component-tab-2" name="component-tabs" type="radio" />
            <input className="component-tab-input" id="component-tab-3" name="component-tabs" type="radio" />
            <div className="component-tabs-list" role="tablist" aria-label="组件标签页">
              <label htmlFor="component-tab-1">结构</label>
              <label htmlFor="component-tab-2">样式</label>
              <label htmlFor="component-tab-3">验证</label>
            </div>
            <div className="component-tab-panels">
              <section className="component-tab-panel component-tab-panel-1">
                <h3>内容结构</h3>
                <p>标签页适合把同一主题下的几组短内容并列展示。</p>
              </section>
              <section className="component-tab-panel component-tab-panel-2">
                <h3>视觉样式</h3>
                <p>切换按钮应该清楚可点，激活态不能只依赖颜色。</p>
              </section>
              <section className="component-tab-panel component-tab-panel-3">
                <h3>状态验证</h3>
                <p>移动端需要横向滚动或自然换行，不能撑破正文宽度。</p>
              </section>
            </div>
          </div>

          <h2 id="accordions">折叠面板</h2>
          <div className="component-accordions not-prose">
            <details open>
              <summary>为什么需要折叠面板？</summary>
              <p>为了在同一页里提前看到真实文章会遇到的折叠内容状态。</p>
            </details>
            <details>
              <summary>如何保持横向居中？</summary>
              <p>正文容器负责宽度，组件只需要占满当前正文宽度，不单独改变页面布局。</p>
            </details>
            <details>
              <summary>是否应该使用负边距？</summary>
              <p>这里不使用负 margin，避免移动端和目录布局出现不可预期的横向滚动。</p>
            </details>
          </div>

          <h2 id="code">代码与高亮</h2>
          <p>
            这是一个 <code>Inline code</code> 行内代码示例。
          </p>
          <ReferenceCodeExamples />

          <h2 id="math">数学公式</h2>
          <p>
            行内公式要和正文基线对齐，例如 <MathInline tex={'e^{i\\pi} + 1 = 0'} />。块级公式需要保留呼吸感，
            并且在移动端不能溢出屏幕。
          </p>
          <div className="component-math-card not-prose">
            <MathDisplay tex={'\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}'} />
          </div>

          <h2 id="charts">图表</h2>
          <p>图表块需要能在正文里快速扫读，不应该像后台大屏组件一样压过文章层级。</p>
          <div className="component-chart not-prose">
            <div className="component-chart-header">
              <span className="component-overline">
                <BarChart3 className="h-4 w-4" />
                正文覆盖度
              </span>
              <strong>92%</strong>
            </div>
            <div className="component-chart-bars" aria-label="正文组件覆盖度图表">
              {chartBars.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <i style={{ width: `${item.value}%` }} />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <h2 id="flow">流程图</h2>
          <ReferenceFlow />

          <h2 id="diagrams">关系图</h2>
          <p>关系图用来表达模块关联，比决策流更适合架构、流程和数据方向说明。</p>
          <ReferenceDiagram />

          <h2 id="emoji">表情符号</h2>
          <p>Emoji 要能和中文、英文、代码、链接共存，避免把行高撑乱或破坏正文节奏。</p>
          <div className="component-emoji-board not-prose">
            <span className="component-overline">
              <SmilePlus className="h-4 w-4" />
              表情分组
            </span>
            {emojiGroups.map((group, index) => (
              <p key={`emoji-${index}`}>{group.join(' ')}</p>
            ))}
          </div>

          <h2 id="timeline">时间线</h2>
          <ol className="component-timeline not-prose">
            {timelineItems.map((item) => (
              <li key={item.title}>
                <span>{item.label}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <h2 id="blockquote">引用</h2>
          <blockquote>
            <p>
              好的引用应该像正文中的停顿点：它强调观点，但不把整篇文章带到另一套视觉系统里。
            </p>
          </blockquote>

          <h2 id="tables">表格</h2>
          <table>
            <thead>
              <tr>
                <th>内容块</th>
                <th>用途</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>排版</td>
                <td>正文阅读基础</td>
                <td>就绪</td>
              </tr>
              <tr>
                <td>提示块</td>
                <td>提示、警告、补充信息</td>
                <td>预览</td>
              </tr>
              <tr>
                <td>标签页</td>
                <td>分组信息展示</td>
                <td>预览</td>
              </tr>
              <tr>
                <td>图集</td>
                <td>多图展示</td>
                <td>预览</td>
              </tr>
              <tr>
                <td>视频</td>
                <td>YouTube 与自定义视频嵌入</td>
                <td>预览</td>
              </tr>
            </tbody>
          </table>

          <h2 id="wide-table">宽表</h2>
          <p>宽表在移动端必须横向滚动，而不是把整篇正文撑出屏幕。</p>
          <div className="component-table-scroll not-prose">
            <table>
              <thead>
                <tr>
                  <th>能力</th>
                  <th>Markdown</th>
                  <th>富文本编辑器</th>
                  <th>渲染方式</th>
                  <th>移动端</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>代码窗口</td>
                  <td>支持</td>
                  <td>支持</td>
                  <td>行号与复制</td>
                  <td>横向滚动</td>
                  <td>需要同时适配亮色和暗色模式。</td>
                </tr>
                <tr>
                  <td>图集</td>
                  <td>手写 HTML</td>
                  <td>结构化块</td>
                  <td>网格</td>
                  <td>两列</td>
                  <td>说明文字保留文件名。</td>
                </tr>
                <tr>
                  <td>视频</td>
                  <td>嵌入地址</td>
                  <td>结构化块</td>
                  <td>16:9</td>
                  <td>自适应</td>
                  <td>支持 YouTube 和自定义 MP4。</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 id="cards">卡片</h2>
          <p>正文里的卡片只用于局部重复信息，不作为外层页面容器。</p>
          <div className="component-card-grid not-prose">
            {articleCards.map((card) => (
              <article key={card.title} className="component-card">
                <span>{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>

          <h2 id="files">文件</h2>
          <p>附件、资源和下载入口需要像正文内容一样清楚，但不应该抢过标题和段落的层级。</p>
          <div className="component-file-list not-prose">
            {sampleFiles.map((file) => (
              <a key={file.name} href="#files">
                <FileText className="h-5 w-5" />
                <span>
                  <strong>{file.name}</strong>
                  <small>
                    {file.type} · {file.size}
                  </small>
                </span>
                <Download className="h-4 w-4" />
              </a>
            ))}
          </div>

          <h2 id="image">图片</h2>
          <p>
            单图应该沿用文章图片样式：宽度跟随正文，边框和阴影克制，图片说明放在下方。alt text 用来描述图片内容，
            不应该只写文件名。
          </p>
          <figure className="component-image not-prose">
            <img
              className="article-image"
              src={sampleImages[0].src}
              alt={sampleImages[0].alt}
              referrerPolicy="no-referrer"
            />
            <figcaption>
              <strong>{sampleImages[0].file}</strong>
              <span>{sampleImages[0].alt}</span>
            </figcaption>
          </figure>

          <h2 id="gallery">图集</h2>
          <p>图集用于多图浏览，视觉上应该像文章内容的一部分，而不是跳成独立相册应用。</p>
          <div className="component-gallery not-prose">
            {sampleImages.map((image) => (
              <figure key={image.file}>
                <img src={image.src} alt={image.alt} referrerPolicy="no-referrer" />
                <figcaption>{image.file}</figcaption>
              </figure>
            ))}
          </div>

          <h2 id="slider">轮播</h2>
          <p>轮播展示当前图片、文件名、alt text 和缩略图状态，用来检查切换控件与正文宽度是否协调。</p>
          <ReferenceSlider images={sampleImages} />

          <h2 id="audio">音频</h2>
          <p>音频控件用于访谈、采样和播客片段，宽度跟随正文，不额外制造背景动效。</p>
          <div className="component-audio not-prose">
            <div>
              <Music2 className="h-5 w-5" />
              <span>
                <strong>嵌入音频</strong>
                <small>MP3 · 正文宽度媒体控件</small>
              </span>
            </div>
            <audio controls preload="metadata" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3">
              当前浏览器不支持音频播放。
            </audio>
          </div>

          <h2 id="youtube">YouTube 视频</h2>
          <p>YouTube 嵌入需要固定 16:9 比例，这里使用风景视频检查画面、边框和暗色背景是否协调。</p>
          <div className="component-embed not-prose">
            <iframe
              src="https://www.youtube-nocookie.com/embed/linlz7-Pnvw?rel=0"
              title="风景视频"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <h2 id="custom-video">自定义视频</h2>
          <p>自定义视频使用同一套响应式容器，避免在移动端溢出正文宽度。</p>
          <div className="component-embed component-custom-video not-prose">
            <video controls preload="metadata" poster={sampleImages[1].src}>
              <source
                src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                type="video/mp4"
              />
              当前浏览器不支持视频播放。
            </video>
            <div className="component-video-caption">
              <Play className="h-4 w-4 fill-current" />
              <span>自定义视频</span>
            </div>
          </div>

          <h2 id="footnotes">脚注</h2>
          <section className="component-footnotes">
            <ol>
              <li id="footnote-1">
                脚注应该安静、易读，并且方便回到正文。{' '}
                <a href="#footnote-ref-1" aria-label="返回正文">
                  ↩
                </a>
              </li>
            </ol>
          </section>
          </div>

          <div className="mt-12 border-t pt-10">
            <Comments />
          </div>
        </article>
      </FadeIn>
    </PostLayout>
  )
}

function MathInline({ tex }: { tex: string }) {
  return (
    <span
      className="component-math-inline"
      dangerouslySetInnerHTML={{
        __html: renderToString(tex, {
          throwOnError: false,
        }),
      }}
    />
  )
}

function MathDisplay({ tex }: { tex: string }) {
  return (
    <div
      className="component-math-display"
      dangerouslySetInnerHTML={{
        __html: renderToString(tex, {
          displayMode: true,
          throwOnError: false,
        }),
      }}
    />
  )
}
