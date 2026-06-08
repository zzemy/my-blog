/* eslint-disable @next/next/no-img-element */
import { setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Info,
  Lightbulb,
  Play,
  Quote as QuoteIcon,
} from 'lucide-react'
import { PostLayout } from '@/features/blog/components/client/post-layout'

const locales = ['zh', 'en', 'fr', 'ja']

const toc = [
  { id: 'headings', text: 'Headings', depth: 2 },
  { id: 'emphasis', text: 'Emphasis', depth: 2 },
  { id: 'buttons', text: 'Button', depth: 2 },
  { id: 'links', text: 'Link', depth: 2 },
  { id: 'paragraph', text: 'Paragraph', depth: 2 },
  { id: 'lists', text: 'Lists', depth: 2 },
  { id: 'notice', text: 'Notice', depth: 2 },
  { id: 'tabs', text: 'Tab', depth: 2 },
  { id: 'accordions', text: 'Accordions', depth: 2 },
  { id: 'code', text: 'Code', depth: 2 },
  { id: 'flow', text: 'Flow', depth: 2 },
  { id: 'blockquote', text: 'Blockquote', depth: 2 },
  { id: 'tables', text: 'Tables', depth: 2 },
  { id: 'image', text: 'Image', depth: 2 },
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
            这是一篇完整的正文视觉验收页。它覆盖 Markdown 与富文本常见内容块，并保持和真实文章同一套目录、宽度、
            字体、代码、表格和媒体样式。
          </p>
        </div>

        <div className="article-content prose dark:prose-invert max-w-none article-font mt-10">
          <h2 id="headings">Headings</h2>
          <p>
            Here is an example of headings. You can use this heading by the following markdown rules. For example:
            use <code>#</code> for heading 1 and use <code>######</code> for heading 6.
          </p>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <h4>Heading 4</h4>
          <h5>Heading 5</h5>
          <h6>Heading 6</h6>

          <h2 id="emphasis">Emphasis</h2>
          <p>
            The emphasis, aka <em>italics</em>, with asterisks or underscores.
          </p>
          <p>
            <strong>Strong emphasis, aka bold</strong>, with asterisks or underscores.
          </p>
          <p>
            The <strong>
              <em>combined emphasis</em>
            </strong>{' '}
            with asterisks and underscores.
          </p>
          <p>
            Strike through uses two tildes. <del>Scratch this.</del>
          </p>

          <h2 id="buttons">Button</h2>
          <div className="component-button-row not-prose">
            <button className="component-button component-button-primary" type="button">
              <span>Button</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="component-button component-button-secondary" type="button">
              <span>Button</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          <h2 id="links">Link</h2>
          <p>
            <a href="https://emmmxx.xyz">I&apos;m an inline-style link</a>
          </p>
          <p>
            <a href="https://emmmxx.xyz" title="emmm Blog">
              I&apos;m an inline-style link with title
            </a>
          </p>
          <p>
            <a href="/README.md">I&apos;m a relative reference to a repository file</a>
          </p>
          <p>
            URLs and URLs in angle brackets will automatically get turned into links.{' '}
            <a href="http://www.example.com">http://www.example.com</a> or{' '}
            <a href="http://www.example.com">http://www.example.com</a> and sometimes example.com.
          </p>
          <p>Some text to show that the reference links can follow later.</p>

          <h2 id="paragraph">Paragraph</h2>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam nihil enim maxime corporis cumque totam
            aliquid nam sint inventore optio modi neque laborum officiis necessitatibus, facilis placeat pariatur!
            Voluptatem, sed harum pariatur adipisci voluptates voluptatum cumque, porro sint minima similique magni
            perferendis fuga! Optio vel ipsum excepturi tempore reiciendis id quidem? Vel in, doloribus debitis
            nesciunt fugit sequi magnam accusantium modi neque quis, vitae velit, pariatur harum autem a! Velit impedit
            atque maiores animi possimus asperiores natus repellendus excepturi sint architecto eligendi non, omnis
            nihil. Facilis, doloremque illum. Fugit optio laborum minus debitis natus illo perspiciatis corporis
            voluptatum rerum laboriosam.
          </p>

          <h2 id="lists">Lists</h2>
          <h3>Ordered List</h3>
          <ol>
            <li>List item</li>
            <li>List item</li>
            <li>List item</li>
            <li>List item</li>
            <li>List item</li>
          </ol>
          <h3>Unordered List</h3>
          <ul>
            <li>List item</li>
            <li>List item</li>
            <li>List item</li>
            <li>List item</li>
            <li>List item</li>
          </ul>
          <h3>Task List</h3>
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

          <h2 id="notice">Notice</h2>
          <div className="component-stack not-prose">
            <Callout icon={<Info className="h-4 w-4" />} tone="note" title="Note">
              This is a simple note.
            </Callout>
            <Callout icon={<QuoteIcon className="h-4 w-4" />} tone="quote" title="Quote">
              This is a simple quote.
            </Callout>
            <Callout icon={<Lightbulb className="h-4 w-4" />} tone="tip" title="Tip">
              This is a simple tip.
            </Callout>
            <Callout icon={<Info className="h-4 w-4" />} tone="info" title="Info">
              This is a simple info.
            </Callout>
            <Callout icon={<AlertTriangle className="h-4 w-4" />} tone="warning" title="Warning">
              This is a simple warning.
            </Callout>
            <Callout icon={<CheckCircle2 className="h-4 w-4" />} tone="success" title="Done">
              This is a simple success state.
            </Callout>
          </div>

          <h2 id="tabs">Tab</h2>
          <div className="component-tabs not-prose">
            <input className="component-tab-input" defaultChecked id="component-tab-1" name="component-tabs" type="radio" />
            <input className="component-tab-input" id="component-tab-2" name="component-tabs" type="radio" />
            <input className="component-tab-input" id="component-tab-3" name="component-tabs" type="radio" />
            <div className="component-tabs-list" role="tablist" aria-label="Component tabs">
              <label htmlFor="component-tab-1">Tab 1</label>
              <label htmlFor="component-tab-2">Tab 2</label>
              <label htmlFor="component-tab-3">Tab 3</label>
            </div>
            <div className="component-tab-panels">
              <section className="component-tab-panel component-tab-panel-1">
                <h3>Hey There, I am a tab</h3>
                <p>
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut
                  labore et dolore magna aliquyam erat, sed diam voluptua.
                </p>
              </section>
              <section className="component-tab-panel component-tab-panel-2">
                <h3>Second tab content</h3>
                <p>At vero eos et accusam et justo duo dolores et ea rebum.</p>
              </section>
              <section className="component-tab-panel component-tab-panel-3">
                <h3>Third tab content</h3>
                <p>Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
              </section>
            </div>
          </div>

          <h2 id="accordions">Accordions</h2>
          <div className="component-accordions not-prose">
            <details open>
              <summary>Why should you need to do this?</summary>
              <p>为了在同一页里提前看到真实文章会遇到的折叠内容状态。</p>
            </details>
            <details>
              <summary>How can I adjust Horizontal centering</summary>
              <p>正文容器负责宽度，组件只需要占满当前正文宽度，不单独改变页面布局。</p>
            </details>
            <details>
              <summary>Should you use Negative margin?</summary>
              <p>这里不使用负 margin，避免移动端和目录布局出现不可预期的横向滚动。</p>
            </details>
          </div>

          <h2 id="code">Code and Syntax Highlighting</h2>
          <p>
            This is an <code>Inline code</code> sample.
          </p>
          <div className="component-code-stack not-prose">
            <CodeWindow
              label="JavaScript"
              code={`var s = "JavaScript syntax highlighting";
alert(s);`}
            />
            <CodeWindow
              label="Python"
              code={`s = "Python syntax highlighting"
print(s)`}
            />
            <CodeWindow
              label="C"
              code={`#include <stdio.h>

int main(void)
{
    printf("hello, world\\n");
    return 0;
}`}
            />
          </div>

          <h2 id="flow">Flow</h2>
          <div className="component-flow not-prose" aria-label="Decision flow example">
            <div className="component-flow-node">Start</div>
            <div className="component-flow-node component-flow-question">Is it?</div>
            <div className="component-flow-branches">
              <div>
                <span>Yes</span>
                <div className="component-flow-node">OK</div>
              </div>
              <div>
                <span>No</span>
                <div className="component-flow-node">Rethink</div>
              </div>
            </div>
            <div className="component-flow-node">End</div>
          </div>

          <h2 id="blockquote">Blockquote</h2>
          <blockquote>
            <p>
              Did you come here for something in particular or just general Riker-bashing? And blowing into maximum warp
              speed, you appeared for an instant to be in two places at once.
            </p>
          </blockquote>

          <h2 id="tables">Tables</h2>
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
                <td>Notice</td>
                <td>提示、警告、补充信息</td>
                <td>Preview</td>
              </tr>
              <tr>
                <td>Tabs</td>
                <td>分组信息展示</td>
                <td>Preview</td>
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

          <h2 id="image">Image</h2>
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
  tone: 'note' | 'quote' | 'tip' | 'info' | 'warning' | 'success'
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

function CodeWindow({ label, code }: { label: string; code: string }) {
  const lines = code.trimEnd().split('\n')

  return (
    <div className="code-window not-prose">
      <div className="code-window-header">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="component-code-label">{label}</span>
      </div>
      <div className="code-window-body">
        <div className="code-window-gutter" aria-hidden="true">
          {lines.map((_, index) => (
            <span key={`${label}-${index}`}>{index + 1}</span>
          ))}
        </div>
        <pre className="code-window-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
