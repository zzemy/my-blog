'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { PostData } from '@/lib/types';
import { create, insertMultiple, search } from '@orama/orama';
import { createTokenizer } from '@orama/tokenizers/mandarin';
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
  if (!query || !text) return <>{text}</>;

  const escapedQuery = escapeRegExp(query);
  if (!escapedQuery) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
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

type SearchScope = 'global' | 'title_summary' | 'content' | 'tags';

const SCOPE_OPTIONS: ReadonlyArray<{ id: SearchScope; label: string }> = [
  { id: 'global', label: '全部' },
  { id: 'title_summary', label: '标题' },
  { id: 'content', label: '正文' },
  { id: 'tags', label: '标签' },
];

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

type SearchDb = Awaited<ReturnType<typeof create<typeof SEARCH_SCHEMA>>>;

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

function toPostData(doc: SearchDocument): PostData {
  return {
    id: doc.id,
    publicId: doc.publicId || null,
    slug: doc.slug,
    title: doc.title,
    date: doc.date,
    summary: doc.summary || undefined,
    tags: doc.tags,
  };
}

export function CommandMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [searchScope, setSearchScope] = React.useState<SearchScope>('global');
  const [oramaDb, setOramaDb] = React.useState<SearchDb | null>(null);
  const [allPosts, setAllPosts] = React.useState<PostData[]>([]);
  const [results, setResults] = React.useState<PostData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const initializingRef = React.useRef(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open || oramaDb || initializingRef.current) return;

    let cancelled = false;
    initializingRef.current = true;
    setLoading(true);

    const initOrama = async () => {
      try {
        const [db, res] = await Promise.all([
          create({
            schema: SEARCH_SCHEMA,
            components: {
              tokenizer: await createTokenizer(),
            },
          }),
          fetch('/api/search'),
        ]);

        const data: SearchApiPost[] = res.ok ? await res.json() : [];
        const searchableDocs = data.map(toSearchDocument);
        await insertMultiple(db, searchableDocs);

        if (!cancelled) {
          setOramaDb(db);
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
  }, [open, oramaDb]);

  React.useEffect(() => {
    const searchOrama = async () => {
      if (!oramaDb) return;

      if (!query.trim()) {
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

      const searchResult = await search<SearchDb, SearchDocument>(oramaDb, {
        term: query,
        limit: 6,
        threshold: 0,
        tolerance: 0,
        properties,
      });
      setResults(searchResult.hits.map(hit => toPostData(hit.document)));
    };

    void searchOrama();
  }, [query, oramaDb, searchScope, allPosts]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    if (!open || !compact) return;

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [compact, open]);

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
              title="搜索文章 (⌘K)"
            >
              <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden text-xs text-foreground/55 sm:inline">搜索</span>
              <kbd className="hidden select-none items-center gap-0.5 rounded border border-foreground/10 bg-background/60 px-1 font-mono text-[10px] text-foreground/50 lg:inline-flex">
                ⌘K
              </kbd>
            </Button>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 pl-8 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="搜索文章…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!open) setOpen(true);
                }}
                onClick={() => setOpen(true)}
              />
              <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                ⌘K
              </kbd>
            </div>
          )}
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "overflow-hidden rounded-xl border-border/80 bg-popover/95 p-0 shadow-xl backdrop-blur-xl dark:border-white/12 dark:bg-[#17181b]/95",
            compact ? "w-[min(23rem,calc(100vw-2rem))]" : "w-[var(--radix-popover-trigger-width)]"
          )}
          align={compact ? "end" : "start"}
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {compact && (
            <div className="relative border-b border-border/70 p-2.5">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <input
                ref={searchInputRef}
                className="flex h-9 w-full rounded-lg border border-border/70 bg-background/70 px-3 py-1 pl-9 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="输入关键词搜索文章…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center gap-1 border-b border-border/60 px-2.5 py-2 overflow-x-auto no-scrollbar">
            {SCOPE_OPTIONS.map((scope) => (
              <button
                key={scope.id}
                type="button"
                onClick={() => setSearchScope(scope.id)}
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
          <Command shouldFilter={false} className="bg-transparent">
            <CommandList className="max-h-72">
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
                    {results.slice(0, 6).map((post) => (
                      <CommandItem
                        key={post.id}
                        value={post.title}
                        className="cursor-pointer rounded-lg px-2.5 py-2"
                        onSelect={() => {
                          runCommand(() => router.push(`/posts/${getPostRouteId(post)}`));
                        }}
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate text-sm font-medium">
                            <HighlightText text={post.title} query={query} />
                          </span>
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
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
