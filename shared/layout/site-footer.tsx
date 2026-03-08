import Link from "next/link";

export function SiteFooter({ text }: { text: string }) {
  return (
    <footer className="w-full border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-950/30 backdrop-blur-md mt-auto z-10 relative">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {text}
          </p>
        </div>
        <div className="flex justify-center space-x-6 md:order-2 text-sm text-zinc-500 dark:text-zinc-400">
           <Link href="/friends" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              友情链接
           </Link>
           {/* 你可以在这里加更多链接，比如 RSS, About 等 */}
        </div>
      </div>
    </footer>
  )
}
