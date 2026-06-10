import { CheckCircle2, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { PostFilterStatus, PostSortBy } from './types'

const filterOptions: Array<{ value: PostFilterStatus; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
]

const sortOptions: Array<{ value: PostSortBy; label: string }> = [
  { value: 'newest', label: '最新' },
  { value: 'oldest', label: '最早' },
  { value: 'modified', label: '最近修改' },
]

interface PostListToolbarProps {
  searchQuery: string
  filterStatus: PostFilterStatus
  sortBy: PostSortBy
  selectedCount: number
  totalCount: number
  onSearchQueryChange: (value: string) => void
  onFilterStatusChange: (status: PostFilterStatus) => void
  onSortByChange: (sortBy: PostSortBy) => void
  onToggleSelectAll: () => void
}

export function PostListToolbar({
  searchQuery,
  filterStatus,
  sortBy,
  selectedCount,
  totalCount,
  onSearchQueryChange,
  onFilterStatusChange,
  onSortByChange,
  onToggleSelectAll,
}: PostListToolbarProps) {
  const allSelected = selectedCount > 0 && selectedCount === totalCount
  const toggleSelectLabel = selectedCount === totalCount && totalCount > 0 ? '取消全选' : '全选'

  return (
    <div className="mb-8 space-y-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="搜索文章标题..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="hidden md:inline text-sm text-zinc-500 dark:text-zinc-400 font-medium">筛选：</span>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filterStatus === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterStatusChange(option.value)}
                  className={`whitespace-nowrap ${filterStatus === option.value ? '' : 'text-zinc-600 dark:text-zinc-300'}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <span className="hidden md:inline text-sm text-zinc-500 dark:text-zinc-400 font-medium">排序：</span>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSortByChange(option.value)}
                  className={`whitespace-nowrap ${sortBy === option.value ? '' : 'text-zinc-600 dark:text-zinc-300'}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-center pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSelectAll}
              className="w-full md:w-auto text-zinc-600 dark:text-zinc-300 gap-2"
            >
              <div
                className={`w-3.5 h-3.5 rounded border ${
                  allSelected ? 'bg-primary border-primary' : 'border-zinc-400'
                } flex items-center justify-center`}
              >
                {allSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              {toggleSelectLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
