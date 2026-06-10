import { CheckCircle2, Circle, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface BatchActionsBarProps {
  selectedCount: number
  loading: boolean
  onPublishSelected: () => void
  onUnpublishSelected: () => void
  onDeleteSelected: () => void
  onClearSelection: () => void
}

export function BatchActionsBar({
  selectedCount,
  loading,
  onPublishSelected,
  onUnpublishSelected,
  onDeleteSelected,
  onClearSelection,
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-[90%] md:w-auto max-w-sm md:max-w-none">
      <div className="bg-zinc-900 dark:bg-zinc-100 shadow-2xl border border-zinc-800 dark:border-zinc-200/50 rounded-full px-4 py-2 flex items-center justify-between md:justify-start gap-2">
        <span className="text-sm font-medium text-zinc-100 dark:text-zinc-900 px-1 md:px-3 whitespace-nowrap">
          已选 {selectedCount}
        </span>

        <div className="h-4 w-px bg-white/15 dark:bg-black/10 mx-1 md:mx-2" />

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onPublishSelected}
            disabled={loading}
            className="h-8 rounded-full text-zinc-300 dark:text-zinc-600 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/5 px-2 md:px-4"
          >
            <CheckCircle2 className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">发布</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onUnpublishSelected}
            disabled={loading}
            className="h-8 rounded-full text-zinc-300 dark:text-zinc-600 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/5 px-2 md:px-4"
          >
            <Circle className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">草稿</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDeleteSelected}
            disabled={loading}
            className="h-8 rounded-full text-red-400 dark:text-red-500 hover:text-red-300 dark:hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/10 px-2 md:px-4"
          >
            <Trash2 className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{loading ? '处理中...' : '删除'}</span>
          </Button>
        </div>

        <div className="h-4 w-px bg-white/15 dark:bg-black/10 mx-1 md:mx-2" />

        <Button
          size="sm"
          variant="ghost"
          className="rounded-full h-8 w-8 p-0 text-zinc-400 dark:text-zinc-500 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/5"
          onClick={onClearSelection}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
