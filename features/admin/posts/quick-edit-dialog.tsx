import { Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import type { AdminPost, QuickEditForm } from './types'

interface QuickEditDialogProps {
  post: AdminPost | null
  form: QuickEditForm
  previewTag: string
  onClose: () => void
  onFormChange: (form: QuickEditForm) => void
  onPreviewTagChange: (value: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  onSave: () => void
}

export function QuickEditDialog({
  post,
  form,
  previewTag,
  onClose,
  onFormChange,
  onPreviewTagChange,
  onAddTag,
  onRemoveTag,
  onSave,
}: QuickEditDialogProps) {
  return (
    <Dialog open={!!post} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>快速编辑</DialogTitle>
        </DialogHeader>
        {post && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="quick-edit-title" className="text-sm font-medium">
                标题
              </label>
              <Input
                id="quick-edit-title"
                value={form.title}
                onChange={(e) => onFormChange({ ...form, title: e.target.value })}
                placeholder="文章标题"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="quick-edit-published_at" className="text-sm font-medium">
                发布时间
              </label>
              <Input
                id="quick-edit-published_at"
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => onFormChange({ ...form, published_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">标签</label>
              <div className="flex gap-2">
                <Input
                  value={previewTag}
                  onChange={(e) => onPreviewTagChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onAddTag()
                    }
                  }}
                  placeholder="输入标签..."
                />
                <Button type="button" onClick={onAddTag} size="sm" variant="outline">
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onRemoveTag(tag)}
                      className="hover:text-red-600"
                      aria-label={`移除标签 ${tag}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="quick-edit-featured"
                checked={form.featured}
                onChange={(e) => onFormChange({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border border-input accent-primary"
              />
              <label htmlFor="quick-edit-featured" className="cursor-pointer text-sm font-medium">
                <Star className="h-4 w-4 inline mr-2" />
                标记为特色文章
              </label>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
