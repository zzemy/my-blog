'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, X, FileText, Hash, Link2, MessageSquare, User } from 'lucide-react';
import { Command as CommandPrimitive } from 'cmdk';
import { PostData } from '@/lib/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getPostRouteId } from '@/lib/post-public-id';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;

  const escapedQuery = escapeRegExp(query.trim());
  if (!escapedQuery) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <span key={i} className="rounded-[2px] bg-foreground/12 px-0.5 font-semibold text-foreground">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

function extractMatchSnippet(content: string, query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed || !content) return null;
  const idx = content.toLowerCase().indexOf(trimmed.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - 28);
  const end = Math.min(content.length, idx + trimmed.length + 52);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < content.length ? '…' : '';
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

type SearchScope = 'global' | 'title_summary' | 'content' | 'tags';

const SCOPE_OPTIONS: ReadonlyArray<{ id: SearchScope; label: string }> = [
  { id: 'global', label: '全部' },
  { id: 'title_summary', label: '标题' },
  { id: 'content', label: '正文' },
  { id: 'tags', label: '标签' },
];

const QUICK_PAGES = [
  { label: '全部文章', href: '/posts', icon: FileText },
  { label: '标签索引', href: '/tags', icon: Hash },
  { label: '友情链接', href: '/friends', icon: Link2 },
  { label: '留言板', href: '/guestbook', icon: MessageSquare },
  { label: '关于我', href: '/about', icon: User },
] as const;

const SEARCH_SCHEMA = {
  id: 'string',
  publicId: 'string',
  slug: 'string',
  title: 'string',
  summary: 'string',
  date: 'string',
  content: 'string',
  tags: 'string[]',
} as const;

type SearchableProperty = 'title' | 'summary' | 'content' | 'tags';

type SearchDocument = {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  summary: string;
  date: string;
  content: string;
  tags: string[];
};

type SearchApiPost = PostData & {
  content?: string;
};

type SearchDb = Awaited<ReturnType<typeof import('@orama/orama').create<typeof SEARCH_SCHEMA>>>;

type OramaRuntime = {
  db: SearchDb;
  search: typeof import('@orama/orama').search;
};

function toSearchDocument(post: SearchApiPost): SearchDocument {
  return {
    id: post.id,
    publicId: post.publicId ?? '',
    slug: post.slug,
    title: post.title,
    summary: post.summary ?? '',
    date: post.date,
    content: post.content ?? '',
    tags: post.tags ?? [],
  };
}

function toResultPost(doc: SearchDocument): SearchApiPost {
  return {
    id: doc.id,
    publicId: doc.publicId || null,
    slug: doc.slug,
    title: doc.title,
    date: doc.date,
    summary: doc.summary || undefined,
    content: doc.content || undefined,
    tags: doc.tags,
  };
}

export function CommandMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [searchScope, setSearchScope] = React.useState<SearchScope>('global');
  const [oramaRuntime, setOramaRuntime] = React.useState<OramaRuntime | null>(null);
  const [allPosts, setAllPosts] = React.useState<SearchApiPost[]>([]);
  const [results, setResults] = React.useState<SearchApiPost[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [shortcutHint, setShortcutHint] = React.useState('⌘K');
  const initializingRef = React.useRef(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    setShortcutHint(isApple ? '⌘K' : 'Ctrl K');
  }, []);

  React.useEffect(() => {
    if (!open || oramaRuntime || initializingRef.current) return;

    let cancelled = false;
    initializingRef.current = true;
    setLoading(true);

    const initOrama = async () => {
      try {
        const [{ create, insertMultiple, search }, { createTokenizer }, res] = await Promise.all([
          import('@orama/orama'),
          import('@orama/tokenizers/mandarin'),
          fetch('/api/search'),
        ]);

        const db = await create({
          schema: SEARCH_SCHEMA,
          components: {
            tokenizer: await createTokenizer(),
          },
        });

        const data: SearchApiPost[] = res.ok ? await res.json() : [];
        const searchableDocs = data.map(toSearchDocument);
        await insertMultiple(db, searchableDocs);

        if (!cancelled) {
          setOramaRuntime({ db, search });
          setAllPosts(data);
          setResults(data);
        }
      } catch (error) {
        console.error('Failed to initialize search index:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        initializingRef.current = false;
      }
    };

    void initOrama();

    return () => {
      cancelled = true;
    };
  }, [open, oramaRuntime]);

  React.useEffect(() => {
    const searchOrama = async () => {
      if (!oramaRuntime) return;

      const trimmed = query.trim();
      if (!trimmed) {
        setResults(allPosts);
        return;
      }

      const propertiesByScope: Record<SearchScope, SearchableProperty[] | undefined> = {
        global: undefined,
        title_summary: ['title', 'summary'],
        content: ['content'],
        tags: ['tags'],
      };
      const properties = propertiesByScope[searchScope];

      const searchResult = await oramaRuntime.search<SearchDb, SearchDocument>(oramaRuntime.db, {
        term: trimmed,
        limit: 10,
        threshold: 0,
        tolerance: 0,
        properties,
      });

      const hits = searchResult.hits.map((hit) => toResultPost(hit.document as unknown as SearchDocument));
      if (hits.length > 0) {
        setResults(hits);
        return;
      }

      // 兜底子串匹配（处理极短词、标点或符号关键词，防止分词漏召回）
      const lower = trimmed.toLowerCase();
      const fallback = allPosts
        .filter((post) => {
          if (searchScope === 'title_summary') {
            return (
              post.title.toLowerCase().includes(lower) ||
              (post.summary ?? '').toLowerCase().includes(lower)
            );
          }
          if (searchScope === 'content') {
            return (post.content ?? '').toLowerCase().includes(lower);
          }
          if (searchScope === 'tags') {
            return (post.tags ?? []).some((tag) => tag.toLowerCase().includes(lower));
          }
          return (
            post.title.toLowerCase().includes(lower) ||
            (post.summary ?? '').toLowerCase().includes(lower) ||
            (post.content ?? '').toLowerCase().includes(lower) ||
            (post.tags ?? []).some((tag) => tag.toLowerCase().includes(lower))
          );
        })
        .slice(0, 10);
      setResults(fallback);
    };

    void searchOrama();
  }, [query, oramaRuntime, searchScope, allPosts]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        const target = e.target as HTMLElement | null;
        const isEditable =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable);
        if (isEditable && !open) return;

        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <div className={cn("relative", compact ? "w-auto" : "w-full md:w-64")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {compact ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-lg px-2 text-foreground/65 transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground dark:hover:bg-white/[0.08] sm:border sm:border-foreground/10 sm:bg-foreground/[0.025] sm:px-2.5 dark:sm:border-white/10 dark:sm:bg-white/[0.03]"
              aria-label="搜索文章"
              title={`搜索文章 (${shortcutHint})`}
            >
              <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden text-xs text-foreground/55 sm:inline">搜索</span>
              <kbd className="hidden select-none items-center gap-0.5 rounded border border-foreground/10 bg-background/60 px-1 font-mono text-[10px] text-foreground/50 lg:inline-flex">
                {shortcutHint}
              </kbd>
            </Button>
          ) : (
            <button
              type="button"
              className="relative flex h-9 w-full items-center rounded-lg border border-input bg-background px-3 py-1 pl-8 text-left text-sm text-muted-foreground shadow-xs transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => setOpen(true)}
            >
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{query || '搜索文章…'}</span>
              <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                {shortcutHint}
              </kbd>
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "overflow-hidden rounded-xl border-border/80 bg-popover/95 p-0 shadow-xl backdrop-blur-xl dark:border-white/12 dark:bg-[#17181b]/95",
            compact ? "w-[min(25rem,calc(100vw-2rem))]" : "w-[var(--radix-popover-trigger-width)]"
          )}
          align={compact ? "end" : "start"}
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false} loop className="bg-transparent">
            <div className="relative border-b border-border/70 p-2.5">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <CommandPrimitive.Input
                ref={searchInputRef}
                className="flex h-9 w-full rounded-lg border border-border/70 bg-background/70 px-3 py-1 pl-9 pr-8 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="输入关键词搜索标题、正文或标签…"
                value={query}
                onValueChange={setQuery}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="清空搜索"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2.5 py-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {SCOPE_OPTIONS.map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => {
                      setSearchScope(scope.id);
                      searchInputRef.current?.focus();
                    }}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs transition-colors",
                      searchScope === scope.id
                        ? "bg-foreground text-background font-medium"
                        : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                    )}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
              {query.trim() && !loading && (
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {results.length} 条
                </span>
              )}
            </div>

            <CommandList className="max-h-80">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>正在加载文章索引…</span>
                </div>
              ) : (
                <>
                  <CommandEmpty className="py-8 text-center text-xs text-muted-foreground">
                    未找到相关文章
                  </CommandEmpty>
                  <CommandGroup heading={query.trim() ? "搜索结果" : "最近文章"}>
                    {results.slice(0, query.trim() ? 10 : 6).map((post) => {
                      const snippet =
                        query.trim() && (searchScope === 'content' || searchScope === 'global')
                          ? extractMatchSnippet(post.content ?? '', query)
                          : null;

                      return (
                        <CommandItem
                          key={post.id}
                          value={`${post.id}-${post.title}`}
                          className="cursor-pointer rounded-lg px-2.5 py-2"
                          onSelect={() => {
                            runCommand(() => router.push(`/posts/${getPostRouteId(post)}`));
                          }}
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="truncate text-sm font-medium">
                              <HighlightText text={post.title} query={query} />
                            </span>
                            {snippet && (
                              <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                <HighlightText text={snippet} query={query} />
                              </span>
                            )}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {post.tags.slice(0, 4).map((tag) => (
                                  <span key={tag} className="text-[11px] text-muted-foreground">
                                    #<HighlightText text={tag} query={query} />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>

                  {!query.trim() && (
                    <CommandGroup heading="快速直达">
                      {QUICK_PAGES.map((page) => {
                        const Icon = page.icon;
                        return (
                          <CommandItem
                            key={page.href}
                            value={`nav-${page.label}`}
                            className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs"
                            onSelect={() => runCommand(() => router.push(page.href))}
                          >
                            <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            <span>{page.label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>

            <div className="hidden items-center justify-between border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground/75 sm:flex">
              <span>↑↓ 选择 · Enter 打开</span>
              <span>Esc 关闭</span>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
