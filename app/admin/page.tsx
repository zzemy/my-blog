'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityHeatmap } from '@/features/admin/components/charts'
import { useSupabaseAuthStore } from '@/lib/supabase-auth-store'
import { useRouter } from 'next/navigation'
import { FileText, Eye, Edit3, MessageSquare, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface DashboardStats {
  stats: {
    totalPosts: number
    draftsCount: number
    totalViews: number
  }
  drafts: {
    id: string
    title: string
    updated_at: string
  }[]
  activity: {
    created_at: string
    published_at: string | null
  }[]
}

export default function AdminDashboard() {
  const { accessToken } = useSupabaseAuthStore() // 保留，还是不用？最好删掉对 accessToken 的依赖，或者保留解构但不使用。
  const router = useRouter()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 移除 if (!accessToken) return

    const fetchStats = async () => {
      try {
        // 移除 Authorization header
        const res = await fetch('/api/admin/stats')
        if (res.status === 401) {
            router.push('/admin/posts') // fallback
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

    fetchStats()
  }, [accessToken, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">加载数据中...</div>
      </div>
    )
  }

  if (!data) return null

  // Process data for charts

  // 1. Activity Heatmap Data
  // Aggregate using published_at (if available) or created_at
  const activityMap = new Map<string, number>()
  if (data.activity) {
      data.activity.forEach(item => {
        const dateStr = item.published_at || item.created_at
        if (!dateStr) return
        const date = dateStr.split('T')[0]
        activityMap.set(date, (activityMap.get(date) || 0) + 1)
      })
  }
  const heatmapData = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }))

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <div className="text-sm text-muted-foreground">
          欢迎回来，管理员
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总文章数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              已发布内容
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">草稿箱</CardTitle>
            <Edit3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.draftsCount}</div>
            <p className="text-xs text-muted-foreground">
              等待编辑
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总阅读量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              来自 Supabase 统计
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>创作活跃度</CardTitle>
          <CardDescription>
            过去一年的文章发布热力图
          </CardDescription>
        </CardHeader>
        <CardContent>
           <ActivityHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1">
        {/* Drafts List */}
        <Card className="flex flex-col">
           <CardHeader>
             <CardTitle className="text-lg">待办事项</CardTitle>
             <CardDescription className="text-sm">最新草稿</CardDescription>
           </CardHeader>
           <CardContent className="flex-1">
             {data.drafts && data.drafts.length > 0 ? (
                 <div className="space-y-4">
                   {data.drafts.map(draft => (
                       <Link 
                        key={draft.id} 
                        href={`/admin/posts/${draft.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                       >
                           <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                                   <Edit3 className="h-4 w-4" />
                               </div>
                               <div>
                                   <div className="font-medium">{draft.title || '无标题'}</div>
                                   <div className="text-xs text-muted-foreground">
                                       {format(new Date(draft.updated_at), 'yyyy-MM-dd HH:mm')}
                                   </div>
                               </div>
                           </div>
                           <span className="text-xs bg-muted px-2 py-1 rounded">编辑</span>
                       </Link>
                   ))}
                 </div>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Edit3 className="h-8 w-8 mb-4 opacity-20" />
                    <span>没有草稿</span>
                 </div>
             )}
           </CardContent>
        </Card>
      </div>

      {/* System Notifications / Vercel Info */}
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
           <CardHeader>
             <CardTitle>流量统计</CardTitle>
             <CardDescription>数据来源说明</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="flex items-start gap-4 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50">
                 <div className="mt-1">
                     <BarChart3 className="h-5 w-5 text-blue-500" />
                 </div>
                 <div>
                     <div className="font-medium text-sm">Vercel Analytics</div>
                     <p className="text-xs text-muted-foreground mt-1">
                         您正在使用 Vercel Web Analytics。请前往 <a href="https://vercel.com/dashboard" target="_blank" className="underline hover:text-primary">Vercel 仪表盘</a> 查看详细的实时流量分析。
                     </p>
                 </div>
             </div>
           </CardContent>
        </Card>

        <Card>
           <CardHeader>
             <CardTitle>评论系统</CardTitle>
             <CardDescription>Giscus</CardDescription>
           </CardHeader>
           <CardContent>
                <div className="flex items-start gap-4 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="mt-1">
                        <MessageSquare className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                        <div className="font-medium text-sm">GitHub Discussions</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            评论数据存储在 GitHub 仓库的 Discussions 中。请前往 GitHub 查看最新评论。
                        </p>
                    </div>
                </div>
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
