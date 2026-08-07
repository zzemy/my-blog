'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Edit3, ExternalLink, Link2, Loader2, Plus, Save, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const emptyDraft: Draft = {
  name: '', url: '', avatar_url: '', description: '', note: '', contact: '', status: 'approved', sort_order: '0',
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
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const authHeaders = useMemo(() => accessToken && accessToken !== 'hidden' ? { Authorization: `Bearer ${accessToken}` } : undefined, [accessToken])

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/friends', { credentials: 'include', headers: authHeaders })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || '友链加载失败')
      setLinks(data.links || [])
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '友链加载失败' })
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const updateDraft = (field: keyof Draft, value: string) => setDraft((current) => ({ ...current, [field]: value }))

  const resetForm = () => { setDraft(emptyDraft); setEditingId(null) }

  const saveLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch(editingId ? `/api/admin/friends/${editingId}` : '/api/admin/friends', {
        method: editingId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, sort_order: Number(draft.sort_order) || 0 }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || '保存失败')
      setMessage({ type: 'success', text: editingId ? '友链已更新' : '友链已添加' })
      resetForm()
      await fetchLinks()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '保存失败' })
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
      await fetchLinks()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '状态更新失败' })
    } finally {
      setActionId(null)
    }
  }

  const deleteLink = async (link: FriendLink) => {
    if (!window.confirm(`确定删除「${link.name}」吗？`)) return
    setActionId(link.id)
    try {
      const response = await fetch(`/api/admin/friends/${link.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders })
      if (!response.ok) throw new Error('删除失败')
      setLinks((current) => current.filter((item) => item.id !== link.id))
      if (editingId === link.id) resetForm()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '删除失败' })
    } finally {
      setActionId(null)
    }
  }

  const pendingCount = links.filter((link) => link.status === 'pending').length

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3"><Link2 className="size-7" /><h1 className="text-3xl font-bold tracking-tight">友链管理</h1></div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">管理公开友链、审核申请和展示顺序。</p>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">共 {links.length} 条 · <span className={pendingCount ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>{pendingCount} 条待审核</span></div>
      </div>

      {message && <p role="status" className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-destructive/25 bg-destructive/10 text-destructive'}`}>{message.text}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">{editingId ? <Edit3 className="size-5" /> : <Plus className="size-5" />}{editingId ? '编辑友链' : '添加友链'}</CardTitle>
          <CardDescription>通过后台添加的友链默认直接显示，可在状态菜单中调整。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveLink} className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="admin-friend-name">个人昵称 *</Label><Input id="admin-friend-name" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required /></div>
            <div className="grid gap-2"><Label htmlFor="admin-friend-url">网站地址 *</Label><Input id="admin-friend-url" type="url" value={draft.url} onChange={(event) => updateDraft('url', event.target.value)} placeholder="https://" required /></div>
            <div className="grid gap-2"><Label htmlFor="admin-friend-avatar">头像 URL</Label><Input id="admin-friend-avatar" type="url" value={draft.avatar_url} onChange={(event) => updateDraft('avatar_url', event.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="admin-friend-contact">联系方式（私有）</Label><Input id="admin-friend-contact" value={draft.contact} onChange={(event) => updateDraft('contact', event.target.value)} /></div>
            <div className="grid gap-2 md:col-span-2"><Label htmlFor="admin-friend-description">网站介绍 *</Label><Textarea id="admin-friend-description" value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} rows={2} required className="resize-none" /></div>
            <div className="grid gap-2"><Label htmlFor="admin-friend-note">展示备注</Label><Input id="admin-friend-note" value={draft.note} onChange={(event) => updateDraft('note', event.target.value)} placeholder="可选，展示在卡片底部" /></div>
            <div className="grid gap-2"><Label htmlFor="admin-friend-order">排序值</Label><Input id="admin-friend-order" type="number" value={draft.sort_order} onChange={(event) => updateDraft('sort_order', event.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="admin-friend-status">状态</Label><select id="admin-friend-status" value={draft.status} onChange={(event) => updateDraft('status', event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="approved">已通过</option><option value="pending">待审核</option><option value="rejected">已拒绝</option></select></div>
            <div className="flex items-center gap-2 md:col-span-2"><Button type="submit" disabled={saving} className="gap-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{editingId ? '保存修改' : '添加友链'}</Button>{editingId && <Button type="button" variant="ghost" onClick={resetForm}>取消编辑</Button>}</div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">全部友链</h2>
        {loading ? <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : links.length === 0 ? <Card className="p-12 text-center text-sm text-muted-foreground">还没有友链记录。</Card> : links.map((link) => (
          <Card key={link.id} className="overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
              {link.avatar_url ? <img src={link.avatar_url} alt="" className="size-12 shrink-0 rounded-lg object-cover" referrerPolicy="no-referrer" /> : <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground">{link.name.charAt(0)}</div>}
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{link.name}</h3><span className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${statusClass(link.status)}`}>{statusLabel(link.status)}</span></div><a href={link.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary"><ExternalLink className="size-3.5" />{link.url}</a><p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{link.description}</p></div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">{link.status !== 'approved' && <Button size="sm" variant="outline" onClick={() => updateStatus(link.id, 'approved')} disabled={actionId === link.id} className="gap-1.5 text-emerald-600 dark:text-emerald-400"><Check className="size-4" />通过</Button>}{link.status !== 'rejected' && <Button size="sm" variant="outline" onClick={() => updateStatus(link.id, 'rejected')} disabled={actionId === link.id} className="gap-1.5 text-zinc-500"><X className="size-4" />拒绝</Button>}<Button size="sm" variant="ghost" onClick={() => { setEditingId(link.id); setDraft(draftFromLink(link)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="gap-1.5"><Edit3 className="size-4" />编辑</Button><Button size="icon" variant="ghost" onClick={() => deleteLink(link)} disabled={actionId === link.id} title="删除友链" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button></div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
