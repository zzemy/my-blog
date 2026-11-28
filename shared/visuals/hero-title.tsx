'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

type HeroTitleProps = {
  title: string
  description: string
  postCount?: number
  latestDate?: string
}

export function HeroTitle({ title, description, postCount, latestDate }: HeroTitleProps) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const x = useSpring(offsetX, { stiffness: 45, damping: 20, mass: 0.9 })
  const y = useSpring(offsetY, { stiffness: 45, damping: 20, mass: 0.9 })

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(Boolean(mq?.matches))
    sync()
    mq?.addEventListener?.('change', sync)
    return () => mq?.removeEventListener?.('change', sync)
  }, [])

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
    offsetX.set(horizontal * 10)
    offsetY.set(vertical * 6)
  }

  const resetPosition = () => {
    offsetX.set(0)
    offsetY.set(0)
  }

  const scrollToPosts = () => {
    const target = document.getElementById('recent-posts')
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }

  return (
    <section
      className="relative mx-auto flex min-h-[64vh] max-w-4xl flex-col items-center justify-center px-2 pb-12 pt-8 text-center md:min-h-[74vh] md:pb-16 md:pt-12"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPosition}
    >
      <div className="flex flex-col items-center rounded-3xl px-4 py-6 [text-shadow:0_2px_20px_rgba(0,0,0,0.14)] dark:[text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
        <span
          className="animate-hero-rise mb-6 inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] text-foreground/65 uppercase"
          style={{ animationDelay: '40ms' }}
        >
          <span className="h-px w-5 bg-foreground/30" aria-hidden />
          <span>随笔与札记</span>
          <span className="h-px w-5 bg-foreground/30" aria-hidden />
        </span>

        <div
          className="animate-hero-rise"
          style={{ animationDelay: '100ms' }}
        >
          <motion.h1
            aria-label={title}
            className="hero-display bg-gradient-to-b from-foreground via-foreground/95 to-foreground/75 bg-clip-text pb-2 text-6xl font-normal leading-[1.02] text-transparent sm:text-7xl md:text-[6.25rem] lg:text-[7.5rem]"
            style={reducedMotion ? undefined : { x, y }}
          >
            {title}
          </motion.h1>
        </div>

        <div
          className="animate-hero-rise my-6 h-px w-10 bg-foreground/30"
          style={{ animationDelay: '180ms' }}
          aria-hidden
        />

        <p
          className="animate-hero-rise max-w-xl font-handwriting-cjk text-base leading-8 text-foreground/82 sm:text-lg md:text-[1.125rem]"
          style={{ animationDelay: '240ms' }}
        >
          {description}
        </p>

        {(typeof postCount === 'number' && postCount > 0) && (
          <div
            className="animate-hero-rise mt-6 flex items-center gap-3 font-mono text-[11px] tracking-wider text-foreground/62"
            style={{ animationDelay: '320ms' }}
          >
            <span>{postCount} 篇文字</span>
            {latestDate && (
              <>
                <span aria-hidden>·</span>
                <span>最近更新 {latestDate}</span>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={scrollToPosts}
        aria-label="向下浏览文章"
        className="animate-hero-rise group absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-foreground/58 transition-colors duration-300 hover:text-foreground/90 md:bottom-4"
        style={{ animationDelay: '420ms' }}
      >
        <span className="font-mono text-[10px] tracking-[0.26em] uppercase">Scroll</span>
        <span className="relative h-8 w-px overflow-hidden bg-foreground/20">
          <span className="animate-scroll-cue absolute inset-0 block bg-foreground/75" />
        </span>
      </button>
    </section>
  )
}
