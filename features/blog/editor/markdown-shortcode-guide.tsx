const examples = [
  {
    title: '提示块',
    code: `:::warning 警告
这是一条警告提示。
:::`,
  },
  {
    title: '标签页',
    code: `:::tabs
结构 | 第一组内容
样式 | 第二组内容
验证 | 第三组内容
:::`,
  },
  {
    title: '折叠面板',
    code: `:::accordion
为什么需要？ | 折叠长内容。
如何居中？ | 跟随正文宽度。
:::`,
  },
  {
    title: '图集/轮播',
    code: `:::image
https://example.com/image.jpg | 图片说明 | image.jpg
:::

:::slider
https://example.com/01.jpg | 图片说明
https://example.com/02.jpg | 图片说明
:::`,
  },
  {
    title: '视频',
    code: `:::youtube
https://www.youtube.com/watch?v=linlz7-Pnvw
:::

:::video
src=https://example.com/video.mp4
poster=https://example.com/poster.jpg
title=自定义视频
:::`,
  },
  {
    title: '流程图',
    code: `:::flow
start=开始
question=内容完整？
yes=预览发布
no=继续修改
end=归档
:::`,
  },
  {
    title: '卡片/关系图',
    code: `:::cards
模式 | 摘要卡片 | 用于小型结论。
资源 | 相关阅读 | 链接到系列文章。
:::

:::diagram
内容源
渲染器
正文界面
:::`,
  },
  {
    title: '时间线/富文本',
    code: `:::timeline
草稿 | 收集内容块 | 列全真实内容。
发布 | 复用正文体系 | 保持统一。
:::

:::rich
image=https://example.com/image.jpg
title=混合正文模块
text=承载媒体、摘要和操作入口。
primaryLabel=查看图集
primaryHref=#gallery
:::`,
  },
  {
    title: '音频/按钮',
    code: `:::audio
src=https://example.com/audio.mp3
title=嵌入音频
caption=MP3 · 正文宽度媒体控件
:::

:::button
访问链接 | https://emmmxx.xyz | primary
:::`,
  },
  {
    title: 'Markdown 原生',
    code: `![图片说明](https://example.com/image.jpg)

行内公式：$e^{i\\pi}+1=0$

[^1]: 这是一条脚注。`,
  },
]

export function MarkdownShortcodeGuide() {
  return (
    <details className="markdown-shortcode-guide">
      <summary>
        Markdown 快捷块
      </summary>
      <div className="markdown-shortcode-grid">
        {examples.map((example) => (
          <section key={example.title}>
            <h3>{example.title}</h3>
            <pre>
              <code>{example.code}</code>
            </pre>
          </section>
        ))}
      </div>
    </details>
  )
}
