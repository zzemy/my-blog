'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  Heart,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Tag,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ActivityHeatmap, TagDistributionChart } from '@/features/admin/components/charts'

interface DashboardStats {
  stats: {
    totalPosts: number
    draftsCount: number
    staleDraftsCount?: number
    totalViews: number
    totalLikes: number
    pendingFriendsCount: number
    recentAiErrors: number
    redisConfigured: boolean
  }
  topPosts: {
    id: string
    routeId: string
    title: string
    views: number
    likes: number
  }[]
  drafts: {
    id: string
    title: string
    updated_at: string
  }[]
  tags: {
    name: string
    count: number
  }[]
  activity: {
    created_at: string
    published_at: string | null
  }[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.status === 401) {
          router.push('/admin')
          return
        }
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error('Failed to fetch stats', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchStats()
  }, [router])

  const handleExportBackup = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/export')
      if (!res.ok) throw new Error('导出失败')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-blog-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('全站数据备份已开始下载')
    } catch {
      toast.error('导出全站备份失败')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载仪表盘数据中...</div>
      </div>
    )
  }

  if (!data) return null

  const activityMap = new Map<string, number>()
  for (const item of data.activity ?? []) {
    const dateStr = item.published_at || item.created_at
    if (!dateStr) continue
    const date = dateStr.split('T')[0]
    activityMap.set(date, (activityMap.get(date) || 0) + 1)
  }
  const heatmapData = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }))

  const staleDraftsCount = data.stats.staleDraftsCount ?? 0
  const hasAlerts =
    data.stats.pendingFriendsCount > 0 ||
    data.stats.recentAiErrors > 0 ||
    staleDraftsCount > 0

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
          <p className="mt-1 text-sm text-muted-foreground">站点内容、读者互动与运行健康总览</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleExportBackup()}
            disabled={exporting}
            className="gap-1.5"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            导出全站备份
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" />
              新建文章
            </Link>
          </Button>
        </div>
      </div>

      {/* 待办与预警横幅 */}
      {hasAlerts && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div className="flex flex-wrap items-center gap-4">
            {data.stats.pendingFriendsCount > 0 && (
              <Link href="/admin/friends" className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                <Link2 className="h-3.5 w-3.5" />
                {data.stats.pendingFriendsCount} 条友链申请待审核
              </Link>
            )}
            {data.stats.recentAiErrors > 0 && (
              <Link href="/admin/ai" className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                <Sparkles className="h-3.5 w-3.5" />
                近 7 天有 {data.stats.recentAiErrors} 次 AI 调用异常
              </Link>
            )}
            {staleDraftsCount > 0 && (
              <Link href="/admin/posts" className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                <Edit3 className="h-3.5 w-3.5" />
                {staleDraftsCount} 篇草稿已超过 30 天未更新
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4 列核心 KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发布文章</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{data.stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">公开展示正文（不含关于页）</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">草稿箱</CardTitle>
            <Edit3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{data.stats.draftsCount}</div>
            <p className="text-xs text-muted-foreground">待继续打磨与发布</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计阅读量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{data.stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.redisConfigured ? '来自 Upstash Redis 实时统计' : '未配置 Redis 统计'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计点赞</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{data.stats.totalLikes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.pendingFriendsCount > 0
                ? `${data.stats.pendingFriendsCount} 条友链待审核`
                : '读者互动总计'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 创作活跃度热力图 */}
      <Card>
        <CardHeader>
          <CardTitle>创作活跃度</CardTitle>
          <CardDescription>过去一年的文章发布热力图</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      {/* 热门文章 Top 5 + 标签分布 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-4 w-4 text-amber-500" />
              最受关注文章 Top 5
            </CardTitle>
            <CardDescription>按 Redis 实时阅读量与点赞排序</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topPosts && data.topPosts.length > 0 ? (
              <div className="space-y-2.5">
                {data.topPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card/60 px-3 py-2.5 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-xs font-semibold text-muted-foreground bg-muted">
                        {idx + 1}
                      </span>
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Eye className="h-3.5 w-3.5" />
                        {post.views}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Heart className="h-3.5 w-3.5" />
                        {post.likes}
                      </span>
                      <a
                        href={`/posts/${post.routeId}`}
                        target="_blank"
                        rel="noreferrer"
                        title="查看公开文章"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                暂无阅读与互动排行数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-4 w-4 text-muted-foreground" />
              主题标签分布
            </CardTitle>
            <CardDescription>已发布文章的高频主题</CardDescription>
          </CardHeader>
          <CardContent>
            <TagDistributionChart data={data.tags ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* 最新草稿 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">待办草稿</CardTitle>
            <CardDescription>最近编辑中的未发布文章</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/admin/posts">管理全部文章 →</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.drafts && data.drafts.length > 0 ? (
            <div className="space-y-2.5">
              {data.drafts.map((draft) => (
                <Link
                  key={draft.id}
                  href={`/admin/posts/${draft.id}`}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Edit3 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{draft.title || '无标题草稿'}</div>
                      <div className="text-xs text-muted-foreground">
                        更新于 {format(new Date(draft.updated_at), 'yyyy-MM-dd HH:mm')}
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-muted px-2.5 py-1 text-xs">继续编辑</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <Edit3 className="mb-3 h-7 w-7 opacity-25" />
              <span>当前没有积压草稿</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
