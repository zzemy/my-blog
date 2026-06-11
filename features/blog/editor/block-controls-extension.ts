import { Extension } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const BlockControls = Extension.create({
  name: 'blockControls',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockControls'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = []

            state.doc.forEach((node, offset, index) => {
              const insertPos = offset + node.nodeSize
              decorations.push(createBlockDecoration(offset, offset + node.nodeSize))
              decorations.push(createInsertDecoration(offset, insertPos, `block-${index}`))
            })

            decorations.push(createInsertDecoration(state.doc.content.size, state.doc.content.size, 'end'))

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

function createBlockDecoration(from: number, to: number) {
  return Decoration.node(from, to, {
    class: 'doc-editable-block',
  })
}

function createInsertDecoration(anchorPos: number, insertPos: number, key: string) {
  return Decoration.widget(
    anchorPos,
    (view) => {
      const wrapper = document.createElement('span')
      wrapper.className = 'doc-block-control'
      wrapper.contentEditable = 'false'

      const insertButton = document.createElement('button')
      insertButton.type = 'button'
      insertButton.className = 'doc-block-insert-button'
      insertButton.setAttribute('aria-label', '在当前块后插入内容块')
      insertButton.innerHTML = '<span aria-hidden="true">+</span>'

      insertButton.addEventListener('mousedown', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const rect = insertButton.getBoundingClientRect()
        view.dom.dispatchEvent(
          new CustomEvent('tiptap-block-insert', {
            bubbles: true,
            detail: {
              pos: insertPos,
              x: rect.right + 8,
              y: rect.top,
            },
          }),
        )
      })

      const styleButton = document.createElement('button')
      styleButton.type = 'button'
      styleButton.className = 'doc-block-style-button'
      styleButton.setAttribute('aria-label', '修改当前块样式')
      styleButton.innerHTML = '<span aria-hidden="true">⋮</span>'

      styleButton.addEventListener('mousedown', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const rect = styleButton.getBoundingClientRect()
        view.dom.dispatchEvent(
          new CustomEvent('tiptap-block-style', {
            bubbles: true,
            detail: {
              pos: Math.min(anchorPos + 1, view.state.doc.content.size),
              x: rect.right + 8,
              y: rect.top,
            },
          }),
        )
      })

      wrapper.appendChild(insertButton)
      wrapper.appendChild(styleButton)
      return wrapper
    },
    {
      key: `block-control-${key}`,
      side: -1,
    },
  )
}
