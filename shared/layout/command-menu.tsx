'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import { Search } from 'lucide-react';
import { PostData } from '@/lib/types';
import { create, insertMultiple, search, Orama } from '@orama/orama';
import { createTokenizer } from '@orama/tokenizers/mandarin';
import { useLocale, useTranslations } from 'next-intl';
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
          <span key={i} className="text-primary font-bold bg-primary/10 rounded-[1px]">
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

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [searchScope, setSearchScope] = React.useState<SearchScope>('global');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [oramaDb, setOramaDb] = React.useState<Orama<any> | null>(null);
  const [results, setResults] = React.useState<PostData[]>([]);
  const locale = useLocale();
  const t = useTranslations('Common');

  React.useEffect(() => {
    const initOrama = async () => {
      const db = await create({
        schema: {
          id: 'string',
          title: 'string',
          summary: 'string',
          date: 'string',
          content: 'string', // Add content to schema for full-text search
          tags: 'string[]',
        },
        components: {
          tokenizer: await createTokenizer(),
        },
      });

      const res = await fetch(`/api/search`);
      const data: (PostData & { locale: string })[] = await res.json();
      const filteredPosts = data.filter(post => post.locale === locale);

      await insertMultiple(db, filteredPosts as unknown as Record<string, unknown>[]);
      setOramaDb(db);
      setResults(filteredPosts);
    };

    initOrama();
  }, [locale]);

  React.useEffect(() => {
    const searchOrama = async () => {
      if (!oramaDb) return;
      
      const properties = {
        global: undefined, // search all indexed fields
        title_summary: ['title', 'summary'],
        content: ['content'],
        tags: ['tags'],
      }[searchScope];

      const searchResult = await search(oramaDb, { 
        term: query, 
        limit: 5,
        threshold: 0, // Require exact matches for tokens
        tolerance: 0, // No typo tolerance
        properties: properties as string[] | undefined,
      });
      setResults(searchResult.hits.map(hit => hit.document as unknown as PostData));
    };

    searchOrama();
  }, [query, oramaDb, searchScope]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <div className="relative w-full md:w-64">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-input/30 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onClick={() => setOpen(true)}
            />
            <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex items-center gap-1 p-2 border-b overflow-x-auto no-scrollbar">
            {[
              { id: 'global', label: 'Global' },
              { id: 'title_summary', label: 'Title' },
              { id: 'content', label: 'Article' },
              { id: 'tags', label: 'Tag' },
            ].map((scope) => (
              <Button
                key={scope.id}
                variant={searchScope === scope.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSearchScope(scope.id as SearchScope)}
                className={cn(
                  "h-6 text-xs px-2 rounded-full",
                  searchScope === scope.id && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {scope.label}
              </Button>
            ))}
          </div>
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Posts">
                {results.slice(0, 5).map((post) => (
                  <CommandItem
                    key={post.id}
                    value={post.title}
                    onSelect={() => {
                      runCommand(() => router.push(`/posts/${post.slug}`));
                    }}
                  >
                    <div className="flex flex-col">
                      <span>
                        <HighlightText text={post.title} query={query} />
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {post.tags.map((tag) => (
                            <span key={tag} className="text-xs text-muted-foreground">
                              #<HighlightText text={tag} query={query} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
