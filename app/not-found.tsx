import Link from 'next/link'
import { Lottie404 } from '@/shared/effects/lottie-404'
import "./globals.css"

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col items-center justify-center px-4 relative z-10">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-[8px_8px_0px_#e2e8f0] dark:shadow-[8px_8px_0px_#020617] p-8 md:p-12 text-center flex flex-col items-center space-y-6 group hover:-translate-y-1 transition-transform duration-300">
          
          {/* Decorative Comic Elements */}
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-yellow-100 dark:bg-amber-950/60 border-2 border-yellow-400 dark:border-amber-700/60 rounded-full flex items-center justify-center shadow-[4px_4px_0px_#f59e0b] dark:shadow-[4px_4px_0px_#78350f] rotate-[-10deg] animate-float-slow">
            <span className="text-xl font-black text-yellow-600 dark:text-amber-500">!?</span>
          </div>
          
          <div className="absolute -bottom-4 -right-4 w-16 h-8 bg-sky-100 dark:bg-sky-900/40 border-2 border-sky-400 dark:border-sky-600 rounded-lg shadow-[4px_4px_0px_#38bdf8] dark:shadow-[4px_4px_0px_#0284c7] rotate-[15deg] animate-float-rotate">
          </div>

          <Lottie404 />
          
          <div className="space-y-3 z-10 w-full font-sans">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-heading">
              Page Not Found
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
            </p>
          </div>

          <Link href="/" className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 rounded-xl font-bold tracking-wider hover:bg-slate-700 dark:hover:bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_#cbd5e1] dark:hover:shadow-[6px_6px_0px_#000] border-2 border-transparent dark:border-slate-800 transition-all duration-300 uppercase">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>
            Go back home
          </Link>
        </div>
      </body>
    </html>
  )
}

