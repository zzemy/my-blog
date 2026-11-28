'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Activity, Check, CheckCheck, Edit3, ExternalLink, Link2, Loader2, Mail, MessageSquare, Plus, Save, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSupabaseAuthStore } from '@/lib/supabase-auth-store'
import type { FriendLink } from '@/lib/supabase/types'

type Draft = {
  name: string
  url: string
  avatar_url: string
  description: string
  note: string
  contact: string
  status: FriendLink['status']
  sort_order: string
}

type StatusFilter = 'all' | FriendLink['status']

const emptyDraft: Draft = {
  name: '',
  url: 'https://',
  avatar_url: '',
  description: '',
  note: '',
  contact: '',
  status: 'approved',
  sort_order: '0',
}

function draftFromLink(link: FriendLink): Draft {
  return {
    name: link.name,
    url: link.url,
    avatar_url: link.avatar_url || '',
    description: link.description || '',
    note: link.note || '',
    contact: link.contact || '',
    status: link.status,
    sort_order: String(link.sort_order ?? 0),
  }
}

function statusLabel(status: FriendLink['status']) {
  return status === 'approved' ? '已通过' : status === 'pending' ? '待审核' : '已拒绝'
}

function statusClass(status: FriendLink['status']) {
  return status === 'approved'
    ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300'
    : status === 'pending'
      ? 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300'
      : 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300'
}

export default function AdminFriendsPage() {
  const accessToken = useSupabaseAuthStore((state) => state.accessToken)
  const [links, setLinks] = useState<FriendLink[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [checkingLiveness, setCheckingLiveness] = useState(false)
  const [livenessMap, setLivenessMap] = useState<
    Record<string, { ok: boolean; status: number; latencyMs: number; error?: string }>
  >({})
  const [batchApproving, setBatchApproving] = useState(false)
  const [pendingDeleteLink, setPendingDeleteLink] = useState<FriendLink | null>(null)

  const authHeaders = useMemo(
    () => (accessToken && accessToken !== 'hidden' ? { Authorization: `Bearer ${accessToken}` } : undefined),
    [accessToken],
  )

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/friends', { credentials: 'include', headers: authHeaders })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || '友链加载失败')
      setLinks(data.links || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '友链加载失败')
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    void fetchLinks()
  }, [fetchLinks])

  const updateDraft = (field: keyof Draft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }))

  const resetForm = () => {
    setDraft(emptyDraft)
    setEditingId(null)
  }

  const saveLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(editingId ? `/api/admin/friends/${editingId}` : '/api/admin/friends', {
        method: editingId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, sort_order: Number(draft.sort_order) || 0 }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || '保存失败')
      toast.success(editingId ? '友链已更新并刷新前台' : '友链已添加')
      resetForm()
      await fetchLinks()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: FriendLink['status']) => {
    setActionId(id)
    try {
      const response = await fetch(`/api/admin/friends/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('状态更新失败')
      toast.success(`状态已更新为「${statusLabel(status)}」`)
      await fetchLinks()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '状态更新失败')
    } finally {
      setActionId(null)
    }
  }

  const deleteLink = (link: FriendLink) => {
    setPendingDeleteLink(link)
  }

  const confirmDeleteLink = async () => {
    if (!pendingDeleteLink) return
    const target = pendingDeleteLink
    setPendingDeleteLink(null)
    setActionId(target.id)
    try {
      const response = await fetch(`/api/admin/friends/${target.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders,
      })
      if (!response.ok) throw new Error('删除失败')
      setLinks((current) => current.filter((item) => item.id !== target.id))
      if (editingId === target.id) resetForm()
      toast.success(`已删除「${target.name}」`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    } finally {
      setActionId(null)
    }
  }

  const handleCheckLiveness = async () => {
    setCheckingLiveness(true)
    try {
      const res = await fetch('/api/admin/friends/check-links', {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders,
      })
      const data = (await res.json().catch(() => ({}))) as {
        results?: Array<{ id: string; ok: boolean; status: number; latencyMs: number; error?: string }>
        error?: string
      }
      if (!res.ok) throw new Error(data.error || '检测失败')
      const next: Record<string, { ok: boolean; status: number; latencyMs: number; error?: string }> = {}
      let failed = 0
      for (const item of data.results ?? []) {
        next[item.id] = item
        if (!item.ok) failed += 1
      }
      setLivenessMap(next)
      toast.success(
        failed > 0
          ? `检测完成：${(data.results?.length ?? 0) - failed} 个正常，${failed} 个异常`
          : `全部 ${data.results?.length ?? 0} 个已通过友链均可正常访问`,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '检测失败')
    } finally {
      setCheckingLiveness(false)
    }
  }

  const handleApproveAllPending = async () => {
    const pendingList = links.filter((l) => l.status === 'pending')
    if (pendingList.length === 0) return
    setBatchApproving(true)
    try {
      const results = await Promise.all(
        pendingList.map((l) =>
          fetch(`/api/admin/friends/${l.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' }),
          }).then((r) => r.ok),
        ),
      )
      const okCount = results.filter(Boolean).length
      toast.success(`已批量通过 ${okCount} 条待审友链`)
      await fetchLinks()
    } finally {
      setBatchApproving(false)
    }
  }

  const pendingCount = links.filter((link) => link.status === 'pending').length
  const approvedCount = links.filter((link) => link.status === 'approved').length
  const rejectedCount = links.filter((link) => link.status === 'rejected').length

  const filteredLinks = useMemo(() => {
    if (statusFilter === 'all') return links
    return links.filter((link) => link.status === statusFilter)
  }, [links, statusFilter])

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link2 className="size-7" />
            <h1 className="text-3xl font-bold tracking-tight">友链管理</h1>
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            待审核申请自动置顶，列表直接展示私有联系方式与申请备注。
          </p>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          共 {links.length} 条 ·{' '}
          <span className={pendingCount ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>
            {pendingCount} 条待审核
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Edit3 className="size-5" /> : <Plus className="size-5" />}
            {editingId ? '编辑友链' : '添加友链'}
          </CardTitle>
          <CardDescription>通过后台添加的友链默认直接显示，保存后自动刷新前台缓存。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveLink} className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="admin-friend-name">个人昵称 *</Label>
              <Input
                id="admin-friend-name"
                value={draft.name}
                onChange={(event) => updateDraft('name', event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-friend-url">网站地址 *</Label>
              <Input
                id="admin-friend-url"
                type="url"
                value={draft.url}
                onChange={(event) => updateDraft('url', event.target.value)}
                placeholder="https://"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-friend-avatar">头像 URL</Label>
              <Input
                id="admin-friend-avatar"
                type="url"
                value={draft.avatar_url}
                onChange={(event) => updateDraft('avatar_url', event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-friend-contact">联系方式（私有）</Label>
              <Input
                id="admin-friend-contact"
                value={draft.contact}
                onChange={(event) => updateDraft('contact', event.target.value)}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="admin-friend-description">网站介绍</Label>
              <Textarea
                id="admin-friend-description"
                value={draft.description}
                onChange={(event) => updateDraft('description', event.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-friend-note">审核备注</Label>
              <Input
                id="admin-friend-note"
                value={draft.note}
                onChange={(event) => updateDraft('note', event.target.value)}
                placeholder="仅后台可见，不公开展示"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-friend-order">排序值</Label>
              <Input
                id="admin-friend-order"
                type="number"
                value={draft.sort_order}
                onChange={(event) => updateDraft('sort_order', event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-friend-status">状态</Label>
              <select
                id="admin-friend-status"
                value={draft.status}
                onChange={(event) => updateDraft('status', event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="approved">已通过</option>
                <option value="pending">待审核</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {editingId ? '保存修改' : '添加友链'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  取消编辑
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">友链列表</h2>
          <div className="flex flex-wrap items-center gap-2">
            {pendingCount > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={batchApproving}
                onClick={() => void handleApproveAllPending()}
                className="h-8 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
              >
                {batchApproving ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                一键通过全部待审 ({pendingCount})
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={checkingLiveness || approvedCount === 0}
              onClick={() => void handleCheckLiveness()}
              className="h-8 gap-1.5 text-xs"
            >
              {checkingLiveness ? <Loader2 className="size-3.5 animate-spin" /> : <Activity className="size-3.5" />}
              存活性检测
            </Button>
            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            {(
              [
                { id: 'all', label: `全部 (${links.length})` },
                { id: 'pending', label: `待审核 (${pendingCount})` },
                { id: 'approved', label: `已通过 (${approvedCount})` },
                { id: 'rejected', label: `已拒绝 (${rejectedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-background font-medium text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">当前筛选下没有友链记录。</Card>
        ) : (
          filteredLinks.map((link) => (
            <Card key={link.id} className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                {link.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={link.avatar_url}
                    alt=""
                    className="size-12 shrink-0 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground">
                    {link.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{link.name}</h3>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${statusClass(link.status)}`}
                    >
                      {statusLabel(link.status)}
                    </span>
                    {livenessMap[link.id] && (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[11px] ring-1 ring-inset ${
                          livenessMap[link.id].ok
                            ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300'
                            : 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300'
                        }`}
                      >
                        {livenessMap[link.id].ok
                          ? `HTTP ${livenessMap[link.id].status} · ${livenessMap[link.id].latencyMs}ms`
                          : livenessMap[link.id].status
                            ? `异常 HTTP ${livenessMap[link.id].status}`
                            : '无法访问'}
                      </span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="size-3.5 shrink-0" />
                    <span className="truncate">{link.url}</span>
                  </a>
                  {link.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{link.description}</p>
                  )}
                  {(link.contact || link.note) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                      {link.contact && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3" />
                          <span>联系：{link.contact}</span>
                        </span>
                      )}
                      {link.note && (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3" />
                          <span>备注：{link.note}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {link.status !== 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void updateStatus(link.id, 'approved')}
                      disabled={actionId === link.id}
                      className="gap-1.5 text-emerald-600 dark:text-emerald-400"
                    >
                      <Check className="size-4" />
                      通过
                    </Button>
                  )}
                  {link.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void updateStatus(link.id, 'rejected')}
                      disabled={actionId === link.id}
                      className="gap-1.5 text-zinc-500"
                    >
                      <X className="size-4" />
                      拒绝
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(link.id)
                      setDraft(draftFromLink(link))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="gap-1.5"
                  >
                    <Edit3 className="size-4" />
                    编辑
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void deleteLink(link)}
                    disabled={actionId === link.id}
                    title="删除友链"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <Dialog
        open={Boolean(pendingDeleteLink)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteLink(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除友链</DialogTitle>
            <DialogDescription>
              确定要永久删除友链「{pendingDeleteLink?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteLink(null)}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteLink()}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
