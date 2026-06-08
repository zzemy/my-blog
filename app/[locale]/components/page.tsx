/* eslint-disable @next/next/no-img-element */
import { setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Play,
} from 'lucide-react'
import { PostLayout } from '@/features/blog/components/client/post-layout'

const locales = ['zh', 'en', 'fr', 'ja']

const toc = [
  { id: 'typography', text: '标题与段落', depth: 2 },
  { id: 'inline', text: '行内内容', depth: 2 },
  { id: 'lists', text: '列表', depth: 2 },
  { id: 'callouts', text: '提示块', depth: 2 },
  { id: 'quote', text: '引用', depth: 2 },
  { id: 'table', text: '表格', depth: 2 },
  { id: 'code', text: '代码', depth: 2 },
  { id: 'image', text: '单图与 alt', depth: 2 },
  { id: 'gallery', text: 'Gallery', depth: 2 },
  { id: 'slider', text: 'Slider', depth: 2 },
  { id: 'youtube', text: 'YouTube video', depth: 2 },
  { id: 'custom-video', text: 'Custom video', depth: 2 },
]

const sampleImages = [
  {
    file: '06.jpg',
    src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    alt: 'alt-text: 山谷和雾气中的日出',
  },
  {
    file: '01.jpg',
    src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80',
    alt: 'alt-text: 山路和远处山脊',
  },
  {
    file: '02.jpg',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    alt: 'alt-text: 海岸线与浅色浪花',
  },
  {
    file: '03.jpg',
    src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1000&q=80',
    alt: 'alt-text: 森林中的光线',
  },
  {
    file: '04.jpg',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=80',
    alt: 'alt-text: 高树和林间小径',
  },
  {
    file: '05.jpg',
    src: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1000&q=80',
    alt: 'alt-text: 湖面、木屋和远山',
  },
]

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata = {
  title: 'Components',
  description: 'Article component and typography visual reference.',
}

export default async function ComponentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <PostLayout toc={toc}>
      <article className="article-shell">
        <div className="article-hero">
          <h1 className="article-title text-4xl md:text-5xl">Components</h1>
          <p className="article-description">
            这是一篇用来验收文章正文视觉的静态页面。它和真实文章使用同一套目录、宽度、标题层级、代码块、表格和媒体样式。
          </p>
        </div>

        <div className="article-content prose dark:prose-invert max-w-none article-font mt-10">
          <h2 id="typography">标题与段落</h2>
          <p>
            正文段落需要在长时间阅读中保持稳定节奏。页面主标题由上方的文章标题承担，正文区域从二级标题开始展开，
            这样目录、滚动定位和阅读层级会和真实文章一致。
          </p>
          <p>
            中文和 English words 混排时，字重和行距都应该自然。段落不追求装饰感，优先让读者快速扫读、回看和复制。
          </p>
          <h3>三级标题用于小节</h3>
          <p>小节标题需要明显，但不能抢过二级标题。间距应该让内容自然分组。</p>
          <h4>四级标题用于更细的说明</h4>
          <p>如果一段内容需要继续拆分，四级标题应保持克制，不改变正文的整体阅读重心。</p>

          <h2 id="inline">行内内容</h2>
          <p>
            这里有一个 <a href="https://emmmxx.xyz">外部链接</a>、<strong>强调文本</strong>、普通英文
            words 和 <code>inline code</code>，用于检查行内元素的颜色、粗细、下划线与中英文混排。
          </p>

          <h2 id="lists">列表</h2>
          <ol>
            <li>确认内容结构和可观察结果。</li>
            <li>实现最小样式改动。</li>
            <li>用真实页面验证桌面端和移动端。</li>
          </ol>
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

          <h2 id="callouts">提示块</h2>
          <div className="component-stack not-prose">
            <Callout icon={<Info className="h-4 w-4" />} tone="info" title="Info">
              用于补充背景、环境要求、版本差异和上下文。
            </Callout>
            <Callout icon={<Lightbulb className="h-4 w-4" />} tone="tip" title="Tip">
              用于给出推荐做法、效率技巧或更稳妥的操作路径。
            </Callout>
            <Callout icon={<AlertTriangle className="h-4 w-4" />} tone="warning" title="Warning">
              用于提醒破坏性操作、不可逆变更或容易忽略的边界。
            </Callout>
            <Callout icon={<CheckCircle2 className="h-4 w-4" />} tone="success" title="Done">
              用于标记验证完成、迁移完成或某个阶段已经收敛。
            </Callout>
          </div>

          <h2 id="quote">引用</h2>
          <blockquote>
            <p>“好的文章视觉不是把所有东西做得醒目，而是让重要的东西自然浮出来。”</p>
          </blockquote>

          <h2 id="table">表格</h2>
          <table>
            <thead>
              <tr>
                <th>Block</th>
                <th>用途</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Typography</td>
                <td>正文阅读基础</td>
                <td>Ready</td>
              </tr>
              <tr>
                <td>Callout</td>
                <td>提示、警告、补充信息</td>
                <td>Next</td>
              </tr>
              <tr>
                <td>Gallery</td>
                <td>多图展示</td>
                <td>Preview</td>
              </tr>
              <tr>
                <td>Video</td>
                <td>YouTube 与自定义视频嵌入</td>
                <td>Preview</td>
              </tr>
            </tbody>
          </table>

          <h2 id="code">代码</h2>
          <div className="code-window not-prose">
            <div className="code-window-header">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="component-code-label">app/[locale]/components/page.tsx</span>
            </div>
            <div className="code-window-body">
              <div className="code-window-gutter" aria-hidden="true">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
              <pre className="code-window-pre">
                <code>{`const status = "ready"
if (status === "ready") {
  console.log("ship the article system")
}`}</code>
              </pre>
            </div>
          </div>

          <h2 id="image">单图与 alt</h2>
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

          <h2 id="gallery">Gallery</h2>
          <p>Gallery 用于多图浏览，视觉上应该像文章内容的一部分，而不是跳成独立相册应用。</p>
          <div className="component-gallery not-prose">
            {sampleImages.map((image) => (
              <figure key={image.file}>
                <img src={image.src} alt={image.alt} referrerPolicy="no-referrer" />
                <figcaption>{image.file}</figcaption>
              </figure>
            ))}
          </div>

          <h2 id="slider">Slider</h2>
          <p>Slider 展示当前图片、文件名、alt text 和缩略图状态，用来检查切换控件与正文宽度是否协调。</p>
          <div className="component-slider not-prose">
            <figure className="component-slider-stage">
              <img src={sampleImages[0].src} alt={sampleImages[0].alt} referrerPolicy="no-referrer" />
              <figcaption>
                <strong>{sampleImages[0].file}</strong>
                <span>{sampleImages[0].alt}</span>
              </figcaption>
            </figure>
            <div className="component-slider-strip" aria-label="Slider thumbnails">
              {sampleImages.map((image) => (
                <button
                  key={image.file}
                  className={image.file === sampleImages[0].file ? 'is-active' : ''}
                  type="button"
                  aria-label={`Preview ${image.file}`}
                >
                  <img src={image.src} alt="" referrerPolicy="no-referrer" />
                  <span>{image.file}</span>
                </button>
              ))}
            </div>
          </div>

          <h2 id="youtube">YouTube video</h2>
          <p>YouTube 嵌入需要固定 16:9 比例，和图片、代码块一样使用正文边框半径。</p>
          <div className="component-embed not-prose">
            <iframe
              src="https://www.youtube.com/embed/ysz5S6PUM-U"
              title="YouTube video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <h2 id="custom-video">Custom video</h2>
          <p>自定义视频使用同一套响应式容器，避免在移动端溢出正文宽度。</p>
          <div className="component-embed component-custom-video not-prose">
            <video controls preload="metadata" poster={sampleImages[1].src}>
              <source
                src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
            <div className="component-video-caption">
              <Play className="h-4 w-4 fill-current" />
              <span>Custom video</span>
            </div>
          </div>
        </div>
      </article>
    </PostLayout>
  )
}

function Callout({
  icon,
  tone,
  title,
  children,
}: {
  icon: ReactNode
  tone: 'info' | 'tip' | 'warning' | 'success'
  title: string
  children: ReactNode
}) {
  return (
    <div className={`component-callout component-callout-${tone}`}>
      <div className="component-callout-icon">{icon}</div>
      <div>
        <p className="component-callout-title">{title}</p>
        <p>{children}</p>
      </div>
    </div>
  )
}
